import { deflate, inflate } from "pako"

// ─── low-level buffer helpers ─────────────────────────────────────────────────

function readStr(buf: Uint8Array, pos: number, len: number): string {
  let s = ""
  for (let i = 0; i < len; i++) s += String.fromCharCode(buf[pos + i])
  return s
}

function readU32(buf: Uint8Array, pos: number): number {
  return buf[pos] | (buf[pos + 1] << 8) | (buf[pos + 2] << 16) | (buf[pos + 3] << 24)
}

function readU16(buf: Uint8Array, pos: number): number {
  return buf[pos] | (buf[pos + 1] << 8)
}

// @note writes little-endian value into array-like at pos, up to `len` bytes
function writeU(dest: number[], pos: number, len: number, value: number): void {
  for (let i = 0; i < len; i++) {
    dest[pos + i] = (value >> (i * 8)) & 0xff
  }
}

// ─── rttex → png (canvas-based, browser only) ────────────────────────────────

export interface RttexInfo {
  width: number
  height: number
  usesAlpha: boolean
  compressed: boolean
}

/**
 * @param buf - raw bytes of the .rttex (or .rtpack-wrapped rttex) file
 * @param canvas - an offscreen canvas used to decode pixel data
 * @returns data-URL (image/png) and texture metadata, or throws on invalid input
 */
export function rttexToPng(
  buf: Uint8Array,
  canvas: HTMLCanvasElement,
): { dataUrl: string; info: RttexInfo } {
  let compressed = false

  // unwrap RTPACK container if present
  if (readStr(buf, 0, 6) === "RTPACK") {
    buf = inflate(buf.slice(32))
    compressed = true
  }

  if (readStr(buf, 0, 6) !== "RTTXTR") {
    throw new Error("Not a valid RTTEX file")
  }

  const height = readU32(buf, 8)
  const width = readU16(buf, 12)
  const usesAlpha = buf[0x1c] !== 0

  const ctx = canvas.getContext("2d")!
  canvas.width = width
  canvas.height = height

  const pixelLen = height * width * (3 + (usesAlpha ? 1 : 0))
  const imgData = ctx.createImageData(width, height)

  if (usesAlpha) {
    // RGBA — direct copy
    imgData.data.set(new Uint8ClampedArray(buf.buffer, buf.byteOffset + 0x7c, pixelLen))
  } else {
    // RGB — expand to RGBA
    const src = new Uint8Array(buf.buffer, buf.byteOffset + 0x7c, pixelLen)
    const dst = imgData.data
    for (let i = 0, j = 0; i < pixelLen; i += 3, j += 4) {
      dst[j] = src[i]
      dst[j + 1] = src[i + 1]
      dst[j + 2] = src[i + 2]
      dst[j + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)

  // flip vertically — growtopia stores pixels bottom-up
  const flipped = document.createElement("canvas")
  flipped.width = width
  flipped.height = height
  const fctx = flipped.getContext("2d")!
  fctx.scale(1, -1)
  fctx.drawImage(canvas, 0, -height)

  return {
    dataUrl: flipped.toDataURL("image/png"),
    info: { width, height, usesAlpha, compressed },
  }
}

// ─── png → rttex (canvas-based, browser only) ────────────────────────────────

export interface PngToRttexOptions {
  /** wrap result in RTPACK zlib container (default: true, matches game expectation) */
  compress?: boolean
}

/**
 * @param img - fully loaded HTMLImageElement
 * @param canvas - offscreen canvas used to read pixel data
 * @param opts - conversion options
 * @returns Uint8Array of the .rttex (or RTPACK-wrapped) binary
 */
export function pngToRttex(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  opts: PngToRttexOptions = {},
): Uint8Array {
  const { compress = true } = opts

  const ctx = canvas.getContext("2d")!
  canvas.width = img.width
  canvas.height = img.height

  // flip vertically when drawing — game expects bottom-up pixels
  ctx.scale(1, -1)
  ctx.drawImage(img, 0, -img.height)

  const imageData = ctx.getImageData(0, 0, img.width, img.height)
  const pixelBuffer = new Uint8Array(imageData.data.buffer)

  // build RTTXTR header (124 bytes / 0x7c)
  const header: number[] = [0x52, 0x54, 0x54, 0x58, 0x54, 0x52]
  for (let i = 6; i < 0x7c; i++) header[i] = 0

  writeU(header, 8, 4, img.height)
  writeU(header, 12, 4, img.width)
  writeU(header, 16, 4, 5121) // GL_UNSIGNED_BYTE
  writeU(header, 20, 4, img.height)
  writeU(header, 24, 4, img.width)
  header[28] = 1 // usesAlpha
  header[29] = 0
  writeU(header, 32, 4, 1)
  writeU(header, 100, 4, img.height)
  writeU(header, 104, 4, img.width)
  writeU(header, 108, 4, pixelBuffer.length)
  writeU(header, 112, 4, 0)
  writeU(header, 116, 4, 0)
  writeU(header, 120, 4, 0)

  const rttexRaw = new Uint8Array([...header, ...pixelBuffer])

  if (!compress) return rttexRaw

  // wrap in RTPACK container
  const deflated = deflate(rttexRaw)
  const rtpack: number[] = [0x52, 0x54, 0x50, 0x41, 0x43, 0x4b]
  for (let i = 6; i < 32; i++) rtpack[i] = 0

  writeU(rtpack, 8, 4, deflated.length)
  writeU(rtpack, 12, 4, rttexRaw.length)
  rtpack[16] = 1

  return new Uint8Array([...rtpack, ...deflated])
}

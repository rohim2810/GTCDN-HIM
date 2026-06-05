// @note pure ts port of items_tools.js — no dom dependencies

const ITEMS_SECRET_KEY = "PBG892FXX982ABC*"

export interface SeedColor {
  a: number
  r: number
  g: number
  b: number
}

export interface ItemEntry {
  item_id: number
  editable_type: number
  item_category: number
  action_type: number
  hit_sound_type: number
  name: string
  texture: string
  texture_hash: number
  item_kind: number
  val1: number
  texture_x: number
  texture_y: number
  spread_type: number
  is_stripey_wallpaper: number
  collision_type: number
  break_hits: number | string
  drop_chance: number
  clothing_type: number
  rarity: number
  max_amount: number
  extra_file: string
  extra_file_hash: number
  audio_volume: number
  pet_name: string
  pet_prefix: string
  pet_suffix: string
  pet_ability: string
  seed_base: number
  seed_overlay: number
  tree_base: number
  tree_leaves: number
  seed_color: SeedColor
  seed_overlay_color: SeedColor
  grow_time: number
  val2: number
  is_rayman: number
  extra_options: string
  texture2: string
  extra_options2: string
  data_position_80: string
  punch_options?: string
  data_version_12?: string
  int_version_13?: number
  int_version_14?: number
  data_version_15?: string
  str_version_15?: string
  str_version_16?: string
  int_version_17?: number
  int_version_18?: number
  int_version_19?: number
  int_version_21?: number
  str_version_22?: string
  int_version_23?: number
  int_version_24?: number
}

export interface ItemsDat {
  version: number
  item_count: number
  items: ItemEntry[]
}

// @note reads a little-endian integer from a buffer at pos with len bytes
function readNumber(buffer: Uint8Array, pos: number, len: number): number {
  let value = 0
  for (let a = 0; a < len; a++) value += buffer[pos + a] << (a * 8)
  return value >>> 0
}

// @note decodes a string from the buffer, optionally xor-ing with the secret key
function readString(
  buffer: Uint8Array,
  pos: number,
  len: number,
  usingKey: boolean,
  itemId = 0,
): string {
  let result = ""
  if (usingKey) {
    for (let a = 0; a < len; a++)
      result += String.fromCharCode(
        buffer[a + pos] ^
          ITEMS_SECRET_KEY.charCodeAt(
            (itemId + a) % ITEMS_SECRET_KEY.length,
          ),
      )
  } else {
    for (let a = 0; a < len; a++)
      result += String.fromCharCode(buffer[a + pos])
  }
  return result
}

// @note converts a slice of bytes to an uppercase hex string (space-separated)
function toHex(slice: Uint8Array, withoutSpace = false): string {
  const parts: string[] = []
  for (let i = 0; i < slice.length; i++)
    parts.push(slice[i].toString(16).padStart(2, "0"))
  return parts.join(withoutSpace ? "" : " ").toUpperCase()
}

// @note writes a little-endian integer into the buffer at pos
function writeNumber(buf: number[], pos: number, len: number, value: number) {
  const n = Number(value) >>> 0
  for (let a = 0; a < len; a++) buf[pos + a] = (n >> (a * 8)) & 0xff
}

// @note writes a string into the buffer, optionally xor-ing with the secret key
function writeString(
  buf: number[],
  pos: number,
  len: number,
  value: string,
  usingKey: boolean,
  itemId = 0,
) {
  for (let a = 0; a < len; a++) {
    if (usingKey)
      buf[pos + a] =
        value.charCodeAt(a) ^
        ITEMS_SECRET_KEY.charCodeAt((a + itemId) % ITEMS_SECRET_KEY.length)
    else buf[pos + a] = value.charCodeAt(a)
  }
}

// @note writes hex string bytes into buf starting at pos
function writeHexString(buf: number[], pos: number, hexStr: string): number {
  const clean = hexStr.replace(/ /g, "")
  const pairs = clean.match(/[\dA-Fa-f]{2}/g) ?? []
  for (let i = 0; i < pairs.length; i++) buf[pos + i] = parseInt(pairs[i], 16)
  return pairs.length
}

/**
 * decodes a binary items.dat buffer into a structured ItemsDat object
 * @param buffer - raw bytes of the items.dat file
 */
export function decodeItemsDat(buffer: Uint8Array): ItemsDat {
  let pos = 6
  const version = readNumber(buffer, 0, 2)
  const itemCount = readNumber(buffer, 2, 4)

  if (version > 24)
    throw new Error(
      `items.dat version ${version} is not supported (max: 24)`,
    )

  const items: ItemEntry[] = []

  for (let a = 0; a < itemCount; a++) {
    const item_id = readNumber(buffer, pos, 4)
    pos += 4

    const editable_type = buffer[pos++]
    const item_category = buffer[pos++]
    const action_type = buffer[pos++]
    const hit_sound_type = buffer[pos++]

    let len = readNumber(buffer, pos, 2)
    pos += 2
    const name = readString(buffer, pos, len, true, item_id)
    pos += len

    len = readNumber(buffer, pos, 2)
    pos += 2
    const texture = readString(buffer, pos, len, false)
    pos += len

    const texture_hash = readNumber(buffer, pos, 4)
    pos += 4

    const item_kind = buffer[pos++]

    const val1 = readNumber(buffer, pos, 4)
    pos += 4

    const texture_x = buffer[pos++]
    const texture_y = buffer[pos++]
    const spread_type = buffer[pos++]
    const is_stripey_wallpaper = buffer[pos++]
    const collision_type = buffer[pos++]

    let breakHitsRaw = buffer[pos++]
    const break_hits: number | string =
      breakHitsRaw % 6 !== 0 ? `${breakHitsRaw}r` : breakHitsRaw / 6

    const drop_chance = readNumber(buffer, pos, 4)
    pos += 4

    const clothing_type = buffer[pos++]

    const rarity = readNumber(buffer, pos, 2)
    pos += 2

    const max_amount = buffer[pos++]

    len = readNumber(buffer, pos, 2)
    pos += 2
    const extra_file = readString(buffer, pos, len, false)
    pos += len

    const extra_file_hash = readNumber(buffer, pos, 4)
    pos += 4
    const audio_volume = readNumber(buffer, pos, 4)
    pos += 4

    len = readNumber(buffer, pos, 2)
    pos += 2
    const pet_name = readString(buffer, pos, len, false)
    pos += len

    len = readNumber(buffer, pos, 2)
    pos += 2
    const pet_prefix = readString(buffer, pos, len, false)
    pos += len

    len = readNumber(buffer, pos, 2)
    pos += 2
    const pet_suffix = readString(buffer, pos, len, false)
    pos += len

    len = readNumber(buffer, pos, 2)
    pos += 2
    const pet_ability = readString(buffer, pos, len, false)
    pos += len

    const seed_base = buffer[pos++]
    const seed_overlay = buffer[pos++]
    const tree_base = buffer[pos++]
    const tree_leaves = buffer[pos++]

    const seed_color: SeedColor = {
      a: buffer[pos++],
      r: buffer[pos++],
      g: buffer[pos++],
      b: buffer[pos++],
    }
    const seed_overlay_color: SeedColor = {
      a: buffer[pos++],
      r: buffer[pos++],
      g: buffer[pos++],
      b: buffer[pos++],
    }

    pos += 4 // skip ingredients

    const grow_time = readNumber(buffer, pos, 4)
    pos += 4
    const val2 = readNumber(buffer, pos, 2)
    pos += 2
    const is_rayman = readNumber(buffer, pos, 2)
    pos += 2

    len = readNumber(buffer, pos, 2)
    pos += 2
    const extra_options = readString(buffer, pos, len, false)
    pos += len

    len = readNumber(buffer, pos, 2)
    pos += 2
    const texture2 = readString(buffer, pos, len, false)
    pos += len

    len = readNumber(buffer, pos, 2)
    pos += 2
    const extra_options2 = readString(buffer, pos, len, false)
    pos += len

    const data_position_80 = toHex(buffer.slice(pos, pos + 80))
    pos += 80

    const item: ItemEntry = {
      item_id,
      editable_type,
      item_category,
      action_type,
      hit_sound_type,
      name,
      texture,
      texture_hash,
      item_kind,
      val1,
      texture_x,
      texture_y,
      spread_type,
      is_stripey_wallpaper,
      collision_type,
      break_hits,
      drop_chance,
      clothing_type,
      rarity,
      max_amount,
      extra_file,
      extra_file_hash,
      audio_volume,
      pet_name,
      pet_prefix,
      pet_suffix,
      pet_ability,
      seed_base,
      seed_overlay,
      tree_base,
      tree_leaves,
      seed_color,
      seed_overlay_color,
      grow_time,
      val2,
      is_rayman,
      extra_options,
      texture2,
      extra_options2,
      data_position_80,
    }

    if (version >= 11) {
      len = readNumber(buffer, pos, 2)
      pos += 2
      item.punch_options = readString(buffer, pos, len, false)
      pos += len
    }
    if (version >= 12) {
      item.data_version_12 = toHex(buffer.slice(pos, pos + 13))
      pos += 13
    }
    if (version >= 13) {
      item.int_version_13 = readNumber(buffer, pos, 4)
      pos += 4
    }
    if (version >= 14) {
      item.int_version_14 = readNumber(buffer, pos, 4)
      pos += 4
    }
    if (version >= 15) {
      item.data_version_15 = toHex(buffer.slice(pos, pos + 25))
      pos += 25
      len = readNumber(buffer, pos, 2)
      pos += 2
      item.str_version_15 = readString(buffer, pos, len, false)
      pos += len
    }
    if (version >= 16) {
      len = readNumber(buffer, pos, 2)
      pos += 2
      item.str_version_16 = readString(buffer, pos, len, false)
      pos += len
    }
    if (version >= 17) {
      item.int_version_17 = readNumber(buffer, pos, 4)
      pos += 4
    }
    if (version >= 18) {
      item.int_version_18 = readNumber(buffer, pos, 4)
      pos += 4
    }
    if (version >= 19) {
      item.int_version_19 = readNumber(buffer, pos, 9)
      pos += 9
    }
    if (version >= 21) {
      item.int_version_21 = readNumber(buffer, pos, 2)
      pos += 2
    }
    if (version >= 22) {
      len = readNumber(buffer, pos, 2)
      pos += 2
      item.str_version_22 = readString(buffer, pos, len, false)
      pos += len
    }
    if (version >= 23) {
      item.int_version_23 = readNumber(buffer, pos, 4)
      pos += 4
    }
    if (version >= 24) {
      item.int_version_24 = readNumber(buffer, pos, 1)
      pos += 1
    }

    items.push(item)
  }

  return { version, item_count: itemCount, items }
}

/**
 * encodes an ItemsDat object back into a binary items.dat buffer
 * @param data - the parsed items dat structure
 */
export function encodeItemsDat(data: ItemsDat): Uint8Array {
  const buf: number[] = []
  let pos = 6

  writeNumber(buf, 0, 2, data.version)
  writeNumber(buf, 2, 4, data.item_count)

  for (let a = 0; a < data.item_count; a++) {
    const item = data.items[a]

    writeNumber(buf, pos, 4, item.item_id)
    pos += 4

    buf[pos++] = item.editable_type
    buf[pos++] = item.item_category
    buf[pos++] = item.action_type
    buf[pos++] = item.hit_sound_type

    writeNumber(buf, pos, 2, item.name.length)
    pos += 2
    writeString(buf, pos, item.name.length, item.name, true, item.item_id)
    pos += item.name.length

    writeNumber(buf, pos, 2, item.texture.length)
    pos += 2
    writeString(buf, pos, item.texture.length, item.texture, false)
    pos += item.texture.length

    writeNumber(buf, pos, 4, item.texture_hash)
    pos += 4

    buf[pos++] = item.item_kind

    writeNumber(buf, pos, 4, item.val1)
    pos += 4

    buf[pos++] = item.texture_x
    buf[pos++] = item.texture_y
    buf[pos++] = item.spread_type
    buf[pos++] = item.is_stripey_wallpaper
    buf[pos++] = item.collision_type

    // @note break_hits with 'r' suffix means raw value, otherwise multiply by 6
    const bh = item.break_hits.toString()
    if (bh.endsWith("r")) buf[pos++] = Number(bh.slice(0, -1))
    else buf[pos++] = Number(bh) * 6

    writeNumber(buf, pos, 4, item.drop_chance)
    pos += 4

    buf[pos++] = item.clothing_type

    writeNumber(buf, pos, 2, item.rarity)
    pos += 2

    buf[pos++] = item.max_amount

    writeNumber(buf, pos, 2, item.extra_file.length)
    pos += 2
    writeString(buf, pos, item.extra_file.length, item.extra_file, false)
    pos += item.extra_file.length

    writeNumber(buf, pos, 4, item.extra_file_hash)
    pos += 4
    writeNumber(buf, pos, 4, item.audio_volume)
    pos += 4

    writeNumber(buf, pos, 2, item.pet_name.length)
    pos += 2
    writeString(buf, pos, item.pet_name.length, item.pet_name, false)
    pos += item.pet_name.length

    writeNumber(buf, pos, 2, item.pet_prefix.length)
    pos += 2
    writeString(buf, pos, item.pet_prefix.length, item.pet_prefix, false)
    pos += item.pet_prefix.length

    writeNumber(buf, pos, 2, item.pet_suffix.length)
    pos += 2
    writeString(buf, pos, item.pet_suffix.length, item.pet_suffix, false)
    pos += item.pet_suffix.length

    writeNumber(buf, pos, 2, item.pet_ability.length)
    pos += 2
    writeString(buf, pos, item.pet_ability.length, item.pet_ability, false)
    pos += item.pet_ability.length

    buf[pos++] = item.seed_base
    buf[pos++] = item.seed_overlay
    buf[pos++] = item.tree_base
    buf[pos++] = item.tree_leaves

    buf[pos++] = item.seed_color.a
    buf[pos++] = item.seed_color.r
    buf[pos++] = item.seed_color.g
    buf[pos++] = item.seed_color.b

    buf[pos++] = item.seed_overlay_color.a
    buf[pos++] = item.seed_overlay_color.r
    buf[pos++] = item.seed_overlay_color.g
    buf[pos++] = item.seed_overlay_color.b

    writeNumber(buf, pos, 4, 0) // skip ingredients
    pos += 4

    writeNumber(buf, pos, 4, item.grow_time)
    pos += 4
    writeNumber(buf, pos, 2, item.val2)
    pos += 2
    writeNumber(buf, pos, 2, item.is_rayman)
    pos += 2

    writeNumber(buf, pos, 2, item.extra_options.length)
    pos += 2
    writeString(buf, pos, item.extra_options.length, item.extra_options, false)
    pos += item.extra_options.length

    writeNumber(buf, pos, 2, item.texture2.length)
    pos += 2
    writeString(buf, pos, item.texture2.length, item.texture2, false)
    pos += item.texture2.length

    writeNumber(buf, pos, 2, item.extra_options2.length)
    pos += 2
    writeString(buf, pos, item.extra_options2.length, item.extra_options2, false)
    pos += item.extra_options2.length

    const written = writeHexString(buf, pos, item.data_position_80)
    pos += written > 0 ? written : 80

    if (data.version >= 11 && item.punch_options !== undefined) {
      writeNumber(buf, pos, 2, item.punch_options.length)
      pos += 2
      writeString(buf, pos, item.punch_options.length, item.punch_options, false)
      pos += item.punch_options.length
    }
    if (data.version >= 12 && item.data_version_12 !== undefined) {
      writeHexString(buf, pos, item.data_version_12)
      pos += 13
    }
    if (data.version >= 13 && item.int_version_13 !== undefined) {
      writeNumber(buf, pos, 4, item.int_version_13)
      pos += 4
    }
    if (data.version >= 14 && item.int_version_14 !== undefined) {
      writeNumber(buf, pos, 4, item.int_version_14)
      pos += 4
    }
    if (data.version >= 15) {
      if (item.data_version_15 !== undefined) {
        writeHexString(buf, pos, item.data_version_15)
        pos += 25
      }
      const sv15 = item.str_version_15 ?? ""
      writeNumber(buf, pos, 2, sv15.length)
      pos += 2
      writeString(buf, pos, sv15.length, sv15, false)
      pos += sv15.length
    }
    if (data.version >= 16) {
      const sv16 = item.str_version_16 ?? ""
      writeNumber(buf, pos, 2, sv16.length)
      pos += 2
      writeString(buf, pos, sv16.length, sv16, false)
      pos += sv16.length
    }
    if (data.version >= 17 && item.int_version_17 !== undefined) {
      writeNumber(buf, pos, 4, item.int_version_17)
      pos += 4
    }
    if (data.version >= 18 && item.int_version_18 !== undefined) {
      writeNumber(buf, pos, 4, item.int_version_18)
      pos += 4
    }
    if (data.version >= 19 && item.int_version_19 !== undefined) {
      writeNumber(buf, pos, 9, item.int_version_19)
      pos += 9
    }
    if (data.version >= 21 && item.int_version_21 !== undefined) {
      writeNumber(buf, pos, 2, item.int_version_21)
      pos += 2
    }
    if (data.version >= 22) {
      const sv22 = item.str_version_22 ?? ""
      writeNumber(buf, pos, 2, sv22.length)
      pos += 2
      writeString(buf, pos, sv22.length, sv22, false)
      pos += sv22.length
    }
    if (data.version >= 23 && item.int_version_23 !== undefined) {
      writeNumber(buf, pos, 4, item.int_version_23)
      pos += 4
    }
    if (data.version >= 24 && item.int_version_24 !== undefined) {
      writeNumber(buf, pos, 1, item.int_version_24)
      pos += 1
    }
  }

  return new Uint8Array(buf)
}

/**
 * encodes an items.dat binary from a decoded .txt file (backslash-delimited format)
 * @param txt - raw text content of an items.txt file
 */
export function encodeItemsDatFromTxt(txt: string): Uint8Array {
  const buf: number[] = []
  let pos = 6
  let version = 0

  const lines = txt.split("\n")

  for (const line of lines) {
    const parts = line.split("\\")
    const key = parts[0]

    if (key === "version") {
      version = Number(parts[1])
      writeNumber(buf, 0, 2, version)
    } else if (key === "itemCount") {
      writeNumber(buf, 2, 4, Number(parts[1]))
    } else if (key === "add_item") {
      // @note field order matches the txt format header comment from decodeItemsDat
      const item_id = Number(parts[1])

      writeNumber(buf, pos, 4, item_id)
      pos += 4

      buf[pos++] = Number(parts[2])  // editable_type
      buf[pos++] = Number(parts[3])  // item_category
      buf[pos++] = Number(parts[4])  // action_type
      buf[pos++] = Number(parts[5])  // hit_sound_type

      // name (xor encoded)
      const name = parts[6]
      writeNumber(buf, pos, 2, name.length)
      pos += 2
      writeString(buf, pos, name.length, name, true, item_id)
      pos += name.length

      // texture
      const texture = parts[7]
      writeNumber(buf, pos, 2, texture.length)
      pos += 2
      writeString(buf, pos, texture.length, texture, false)
      pos += texture.length

      writeNumber(buf, pos, 4, Number(parts[8]))  // texture_hash
      pos += 4

      buf[pos++] = Number(parts[9])  // item_kind

      writeNumber(buf, pos, 4, Number(parts[10]))  // val1
      pos += 4

      buf[pos++] = Number(parts[11])  // texture_x
      buf[pos++] = Number(parts[12])  // texture_y
      buf[pos++] = Number(parts[13])  // spread_type
      buf[pos++] = Number(parts[14])  // is_stripey_wallpaper
      buf[pos++] = Number(parts[15])  // collision_type

      // @note break_hits: 'r' suffix means raw, otherwise multiply by 6
      const bh = parts[16]
      if (bh.endsWith("r")) buf[pos++] = Number(bh.slice(0, -1))
      else buf[pos++] = Number(bh) * 6

      writeNumber(buf, pos, 4, Number(parts[17]))  // drop_chance
      pos += 4

      buf[pos++] = Number(parts[18])  // clothing_type

      writeNumber(buf, pos, 2, Number(parts[19]))  // rarity
      pos += 2

      buf[pos++] = Number(parts[20])  // max_amount

      // extra_file
      const extra_file = parts[21]
      writeNumber(buf, pos, 2, extra_file.length)
      pos += 2
      writeString(buf, pos, extra_file.length, extra_file, false)
      pos += extra_file.length

      writeNumber(buf, pos, 4, Number(parts[22]))  // extra_file_hash
      pos += 4
      writeNumber(buf, pos, 4, Number(parts[23]))  // audio_volume
      pos += 4

      // pet_name
      const pet_name = parts[24]
      writeNumber(buf, pos, 2, pet_name.length)
      pos += 2
      writeString(buf, pos, pet_name.length, pet_name, false)
      pos += pet_name.length

      // pet_prefix
      const pet_prefix = parts[25]
      writeNumber(buf, pos, 2, pet_prefix.length)
      pos += 2
      writeString(buf, pos, pet_prefix.length, pet_prefix, false)
      pos += pet_prefix.length

      // pet_suffix
      const pet_suffix = parts[26]
      writeNumber(buf, pos, 2, pet_suffix.length)
      pos += 2
      writeString(buf, pos, pet_suffix.length, pet_suffix, false)
      pos += pet_suffix.length

      // pet_ability
      const pet_ability = parts[27]
      writeNumber(buf, pos, 2, pet_ability.length)
      pos += 2
      writeString(buf, pos, pet_ability.length, pet_ability, false)
      pos += pet_ability.length

      buf[pos++] = Number(parts[28])  // seed_base
      buf[pos++] = Number(parts[29])  // seed_overlay
      buf[pos++] = Number(parts[30])  // tree_base
      buf[pos++] = Number(parts[31])  // tree_leaves

      // seed_color ARGB (stored as "a,r,g,b")
      const sc = parts[32].split(",")
      buf[pos++] = Number(sc[0])
      buf[pos++] = Number(sc[1])
      buf[pos++] = Number(sc[2])
      buf[pos++] = Number(sc[3])

      // seed_overlay_color ARGB (stored as "a,r,g,b")
      const soc = parts[33].split(",")
      buf[pos++] = Number(soc[0])
      buf[pos++] = Number(soc[1])
      buf[pos++] = Number(soc[2])
      buf[pos++] = Number(soc[3])

      writeNumber(buf, pos, 4, 0)  // skip ingredients
      pos += 4

      writeNumber(buf, pos, 4, Number(parts[34]))  // grow_time
      pos += 4
      writeNumber(buf, pos, 2, Number(parts[35]))  // val2
      pos += 2
      writeNumber(buf, pos, 2, Number(parts[36]))  // is_rayman
      pos += 2

      // extra_options
      const extra_options = parts[37]
      writeNumber(buf, pos, 2, extra_options.length)
      pos += 2
      writeString(buf, pos, extra_options.length, extra_options, false)
      pos += extra_options.length

      // texture2
      const texture2 = parts[38]
      writeNumber(buf, pos, 2, texture2.length)
      pos += 2
      writeString(buf, pos, texture2.length, texture2, false)
      pos += texture2.length

      // extra_options2
      const extra_options2 = parts[39]
      writeNumber(buf, pos, 2, extra_options2.length)
      pos += 2
      writeString(buf, pos, extra_options2.length, extra_options2, false)
      pos += extra_options2.length

      // data_position_80: 80 bytes as hex string
      writeHexString(buf, pos, parts[40])
      pos += 80

      if (version >= 11) {
        const punch_options = parts[41] ?? ""
        writeNumber(buf, pos, 2, punch_options.length)
        pos += 2
        writeString(buf, pos, punch_options.length, punch_options, false)
        pos += punch_options.length
      }
      if (version >= 12) {
        writeHexString(buf, pos, parts[42] ?? "")
        pos += 13
      }
      if (version >= 13) {
        writeNumber(buf, pos, 4, Number(parts[43] ?? 0))
        pos += 4
      }
      if (version >= 14) {
        writeNumber(buf, pos, 4, Number(parts[44] ?? 0))
        pos += 4
      }
      if (version >= 15) {
        writeHexString(buf, pos, parts[45] ?? "")
        pos += 25
        const sv15 = parts[46] ?? ""
        writeNumber(buf, pos, 2, sv15.length)
        pos += 2
        writeString(buf, pos, sv15.length, sv15, false)
        pos += sv15.length
      }
      if (version >= 16) {
        const sv16 = parts[47] ?? ""
        writeNumber(buf, pos, 2, sv16.length)
        pos += 2
        writeString(buf, pos, sv16.length, sv16, false)
        pos += sv16.length
      }
      if (version >= 17) {
        writeNumber(buf, pos, 4, Number(parts[48] ?? 0))
        pos += 4
      }
      if (version >= 18) {
        writeNumber(buf, pos, 4, Number(parts[49] ?? 0))
        pos += 4
      }
      if (version >= 19) {
        writeNumber(buf, pos, 9, Number(parts[50] ?? 0))
        pos += 9
      }
      if (version >= 21) {
        writeNumber(buf, pos, 2, Number(parts[51] ?? 0))
        pos += 2
      }
      if (version >= 22) {
        const sv22 = parts[52] ?? ""
        writeNumber(buf, pos, 2, sv22.length)
        pos += 2
        writeString(buf, pos, sv22.length, sv22, false)
        pos += sv22.length
      }
      if (version >= 23) {
        writeNumber(buf, pos, 4, Number(parts[53] ?? 0))
        pos += 4
      }
      if (version >= 24) {
        writeNumber(buf, pos, 1, Number(parts[54] ?? 0))
        pos += 1
      }
    }
  }

  return new Uint8Array(buf)
}

/**
 * computes the growtopia proton hash for a binary buffer
 * @param buffer - bytes to hash
 * @returns unsigned 32-bit hash value
 */
export function protonHash(buffer: Uint8Array): number {
  let hash = 0x55555555
  for (let a = 0; a < buffer.length; a++)
    hash = ((hash >>> 27) + (hash << 5) + buffer[a]) >>> 0
  return hash
}

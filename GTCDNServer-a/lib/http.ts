import { NextResponse } from "next/server"

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error"
}

export function jsonError(error: unknown, status = 500) {
  return NextResponse.json({ error: getErrorMessage(error) }, { status })
}

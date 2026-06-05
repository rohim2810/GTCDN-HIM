import { auth, seedDefaultUser } from "@/lib/auth"

export async function GET(req: Request) {
  await seedDefaultUser()
  return auth.handler(req)
}

export async function POST(req: Request) {
  await seedDefaultUser()
  return auth.handler(req)
}

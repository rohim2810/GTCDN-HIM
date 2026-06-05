import { hashPassword } from "better-auth/crypto";

const hashed = await hashPassword("user123");
console.log(hashed);

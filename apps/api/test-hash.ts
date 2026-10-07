import { hashPassword } from "better-auth/crypto";
async function main() {
  const h = await hashPassword("my-password");
  console.log("hash is:", h);
}
main().catch(console.error);

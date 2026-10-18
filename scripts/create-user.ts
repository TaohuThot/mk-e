// ใช้: npm run user:create -- <email> <ชื่อ> <รหัสผ่าน>
// ถ้ามีอีเมลนี้อยู่แล้ว จะเปลี่ยนรหัสผ่านให้แทน
import "dotenv/config";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../src/db/schema";

async function main() {
  const [email, name, password] = process.argv.slice(2);
  if (!email || !name || !password) {
    console.error("ใช้: npm run user:create -- <email> <ชื่อ> <รหัสผ่าน>");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("รหัสผ่านต้องยาวอย่างน้อย 12 ตัวอักษร");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);
  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .insert(users)
    .values({ email: email.toLowerCase(), name, passwordHash })
    .onConflictDoUpdate({ target: users.email, set: { name, passwordHash } });

  console.log(`บันทึกผู้ใช้ ${email} แล้ว`);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

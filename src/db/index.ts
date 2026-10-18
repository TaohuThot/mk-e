import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

// เก็บ client ไว้ใน globalThis เพื่อไม่ให้เปิด connection ใหม่ทุกครั้งที่ hot reload ตอน dev
const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL!, {
    max: 5,
    // ต้องปิด prepare ถ้าต่อผ่าน connection pooler แบบ transaction (Supabase pooler / Neon -pooler)
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });

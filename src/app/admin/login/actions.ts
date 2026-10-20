"use server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/auth";
import type { FormState } from "../styles";

// hash จำลองไว้เทียบเมื่อไม่พบอีเมล เพื่อให้เวลาตอบกลับใกล้เคียงกัน
const DUMMY_HASH = "$2b$12$ibRvDPBW37Ud7FhPxoxma.JQZL0GCGyQvz7LZ9UJvYr9DTaV4m.Ge";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };

  await createSession(user);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

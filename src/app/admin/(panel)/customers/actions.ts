"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { firstError, optionalText, requiredText } from "@/lib/validation";
import type { FormState } from "../../ui";

const customerSchema = z.object({
  name: requiredText("ชื่อลูกค้า").pipe(z.string().max(255)),
  phone: optionalText.pipe(z.string().max(50).nullable()),
  email: optionalText.pipe(z.email("อีเมลไม่ถูกต้อง").max(255).nullable()),
  address: optionalText,
  note: optionalText,
});

function parseCustomer(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? undefined,
    email: formData.get("email") ?? undefined,
    address: formData.get("address") ?? undefined,
    note: formData.get("note") ?? undefined,
  });
}

export async function createCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = parseCustomer(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const [{ id }] = await db.insert(customers).values(parsed.data).returning({ id: customers.id });
  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${id}`);
}

export async function updateCustomer(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = parseCustomer(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db.update(customers).set(parsed.data).where(eq(customers.id, id));
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  return { ok: "บันทึกแล้ว" };
}

// คำสั่งซื้อของลูกค้าที่ถูกลบจะยังอยู่ แต่ไม่ผูกกับลูกค้า (on delete set null)
export async function deleteCustomer(id: number): Promise<FormState> {
  await requireUser();
  await db.delete(customers).where(eq(customers.id, id));
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

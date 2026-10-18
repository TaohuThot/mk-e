import { z } from "zod";

// ช่องว่างในฟอร์มให้เป็น null
export const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

export const requiredText = (label: string) => z.string().trim().min(1, `กรุณากรอก${label}`);

export const money = z.coerce
  .number({ message: "ราคาต้องเป็นตัวเลข" })
  .min(0, "ราคาต้องไม่ติดลบ")
  .max(9_999_999_999, "ราคาสูงเกินไป")
  .transform((v) => v.toFixed(2));

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
}

// error code ของ Postgres เมื่อค่าซ้ำกับ unique constraint
// drizzle ห่อ error ของ driver ไว้ใน cause
export function isUniqueViolation(error: unknown): error is { constraint_name?: string } {
  const e = (error as { cause?: unknown })?.cause ?? error;
  return (e as { code?: string })?.code === "23505";
}
export function uniqueConstraint(error: unknown) {
  const e = ((error as { cause?: unknown })?.cause ?? error) as { constraint_name?: string };
  return e.constraint_name ?? "";
}

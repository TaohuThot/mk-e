"use server";
import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders, orderStatus, products, stockMovements } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { stockQty } from "@/lib/stock";
import { firstError, optionalText } from "@/lib/validation";
import type { FormState } from "../../styles";

const orderSchema = z.object({
  customerId: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int().positive().nullable()),
  status: z.enum(["pending", "paid"]),
  note: optionalText,
  items: z
    .array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(100_000) }))
    .min(1, "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ"),
});

class OrderError extends Error {}

export async function createOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "ข้อมูลรายการสินค้าไม่ถูกต้อง" };
  }
  const parsed = orderSchema.safeParse({
    customerId: formData.get("customerId") ?? undefined,
    status: formData.get("status"),
    note: formData.get("note") ?? undefined,
    items,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { customerId, status, note } = parsed.data;

  // รวมรายการที่เป็นสินค้าเดียวกัน
  const qtyById = new Map<number, number>();
  for (const item of parsed.data.items) {
    qtyById.set(item.productId, (qtyById.get(item.productId) ?? 0) + item.quantity);
  }
  const ids = [...qtyById.keys()];

  let orderId: number;
  try {
    orderId = await db.transaction(async (tx) => {
      // ล็อกแถวสินค้าตามลำดับ id กัน deadlock และกันขายเกินสต็อก
      const rows = await tx
        .select({ id: products.id, name: products.name, price: products.price, cost: products.cost, stock: stockQty })
        .from(products)
        .where(inArray(products.id, ids))
        .orderBy(products.id)
        .for("update");
      if (rows.length !== ids.length) throw new OrderError("มีสินค้าบางรายการถูกลบไปแล้ว");

      for (const p of rows) {
        const qty = qtyById.get(p.id)!;
        if (qty > p.stock) throw new OrderError(`"${p.name}" สต็อกไม่พอ (คงเหลือ ${p.stock}, ต้องการ ${qty})`);
      }

      // คำนวณเป็นสตางค์ เลี่ยงปัญหาทศนิยมของ float
      const totalSatang = rows.reduce(
        (sum, p) => sum + Math.round(Number(p.price) * 100) * qtyById.get(p.id)!,
        0,
      );

      const [order] = await tx
        .insert(orders)
        .values({ customerId, status, note, total: (totalSatang / 100).toFixed(2) })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(
        rows.map((p) => ({
          orderId: order.id,
          productId: p.id,
          quantity: qtyById.get(p.id)!,
          unitPrice: p.price,
          unitCost: p.cost,
        })),
      );
      await tx.insert(stockMovements).values(
        rows.map((p) => ({ productId: p.id, type: "sale" as const, quantity: -qtyById.get(p.id)!, orderId: order.id })),
      );
      return order.id;
    });
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    const cause = (error as { cause?: { code?: string } })?.cause;
    if (cause?.code === "23503") return { error: "ไม่พบลูกค้าที่เลือก" };
    throw error;
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/products");
  redirect(`/admin/orders/${orderId}`);
}

export async function updateOrderStatus(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = z.enum(orderStatus.enumValues).safeParse(formData.get("status"));
  if (!parsed.success) return { error: "สถานะไม่ถูกต้อง" };
  const status = parsed.data;

  const result = await db.transaction(async (tx): Promise<FormState> => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
    if (!order) return { error: "ไม่พบคำสั่งซื้อ" };
    if (order.status === "cancelled") return { error: "คำสั่งซื้อที่ยกเลิกแล้วเปลี่ยนสถานะไม่ได้" };
    if (order.status === status) return { ok: "สถานะเหมือนเดิม" };

    if (status === "cancelled") {
      // คืนสต็อกตามรายการในคำสั่งซื้อ
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      if (items.length > 0) {
        await tx.insert(stockMovements).values(
          items.map((i) => ({ productId: i.productId, type: "return" as const, quantity: i.quantity, orderId: id, note: "ยกเลิกคำสั่งซื้อ" })),
        );
      }
    }
    await tx.update(orders).set({ status, updatedAt: sql`now()` }).where(eq(orders.id, id));
    return { ok: status === "cancelled" ? "ยกเลิกแล้ว และคืนสต็อกเรียบร้อย" : "อัปเดตสถานะแล้ว" };
  });

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/products");
  return result;
}

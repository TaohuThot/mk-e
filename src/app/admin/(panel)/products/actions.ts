"use server";
import { eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, products, stockMovements } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { saveProductImage } from "@/lib/images";
import { stockQty } from "@/lib/stock";
import { deleteFile } from "@/lib/storage";
import { firstError, isUniqueViolation, money, optionalText, requiredText, uniqueConstraint } from "@/lib/validation";
import type { FormState } from "../../ui";

const productSchema = z.object({
  name: requiredText("ชื่อสินค้า").pipe(z.string().max(255)),
  sku: requiredText("SKU").pipe(z.string().max(100)),
  barcode: optionalText.pipe(z.string().max(100).nullable()),
  price: money,
  description: optionalText,
});

function parseProduct(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    barcode: formData.get("barcode") ?? undefined,
    price: formData.get("price"),
    description: formData.get("description") ?? undefined,
  });
}

function uploadedImage(formData: FormData) {
  const file = formData.get("image");
  return file instanceof File && file.size > 0 ? file : null;
}

function duplicateMessage(error: unknown): FormState {
  const name = uniqueConstraint(error);
  if (name.includes("barcode")) return { error: "บาร์โค้ดนี้มีสินค้าอื่นใช้อยู่แล้ว" };
  return { error: "SKU นี้มีสินค้าอื่นใช้อยู่แล้ว" };
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = parseProduct(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const initialStock = Number(formData.get("initialStock") || 0);
  if (!Number.isInteger(initialStock) || initialStock < 0) {
    return { error: "จำนวนเริ่มต้นต้องเป็นจำนวนเต็มที่ไม่ติดลบ" };
  }

  let id: number;
  try {
    [{ id }] = await db.insert(products).values(parsed.data).returning({ id: products.id });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateMessage(error);
    throw error;
  }

  if (initialStock > 0) {
    await db.insert(stockMovements).values({ productId: id, type: "in", quantity: initialStock, note: "ยอดเริ่มต้น" });
  }

  const image = uploadedImage(formData);
  if (image) {
    try {
      const paths = await saveProductImage(id, image);
      await db.update(products).set(paths).where(eq(products.id, id));
    } catch (error) {
      console.error(error);
      redirect(`/admin/products/${id}?imageError=1`);
    }
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${id}`);
}

export async function updateProduct(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = parseProduct(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const current = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!current) return { error: "ไม่พบสินค้า" };

  const image = uploadedImage(formData);
  let paths: { imagePath: string; thumbnailPath: string } | undefined;
  if (image) {
    try {
      paths = await saveProductImage(id, image);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "อัปโหลดรูปไม่สำเร็จ" };
    }
  }

  try {
    await db
      .update(products)
      .set({ ...parsed.data, ...paths, updatedAt: new Date() })
      .where(eq(products.id, id));
  } catch (error) {
    if (paths) await Promise.all([deleteFile(paths.imagePath), deleteFile(paths.thumbnailPath)]);
    if (isUniqueViolation(error)) return duplicateMessage(error);
    throw error;
  }

  if (paths) {
    if (current.imagePath) await deleteFile(current.imagePath);
    if (current.thumbnailPath) await deleteFile(current.thumbnailPath);
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: "บันทึกแล้ว" };
}

export async function deleteProduct(id: number): Promise<FormState> {
  await requireUser();
  const used = await db.query.orderItems.findFirst({ where: eq(orderItems.productId, id) });
  if (used) return { error: "ลบไม่ได้ เพราะสินค้านี้อยู่ในคำสั่งซื้อแล้ว" };

  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
  if (deleted?.imagePath) await deleteFile(deleted.imagePath);
  if (deleted?.thumbnailPath) await deleteFile(deleted.thumbnailPath);

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

const movementSchema = z.object({
  type: z.enum(["in", "out", "adjust"]),
  quantity: z.coerce.number().int("จำนวนต้องเป็นจำนวนเต็ม").min(0, "จำนวนต้องไม่ติดลบ").max(1_000_000),
  note: optionalText,
});

export async function addStockMovement(productId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = movementSchema.safeParse({
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { type, quantity, note } = parsed.data;

  const result = await db.transaction(async (tx) => {
    // ล็อกแถวสินค้า กันการบันทึกพร้อมกันทำให้ยอดเพี้ยน
    const [product] = await tx
      .select({ id: products.id, stock: stockQty })
      .from(products)
      .where(eq(products.id, productId))
      .for("update");
    if (!product) return { error: "ไม่พบสินค้า" };

    let delta: number;
    if (type === "in") delta = quantity;
    else if (type === "out") delta = -quantity;
    else delta = quantity - product.stock; // ปรับยอดให้ตรงกับที่ตรวจนับได้

    if (type !== "adjust" && quantity === 0) return { error: "จำนวนต้องมากกว่า 0" };
    if (delta === 0) return { error: "ยอดคงเหลือตรงกับที่นับได้อยู่แล้ว" };
    if (product.stock + delta < 0) return { error: `สต็อกไม่พอ (คงเหลือ ${product.stock})` };

    await tx.insert(stockMovements).values({ productId, type, quantity: delta, note });
    return { ok: `บันทึกแล้ว คงเหลือ ${product.stock + delta}` };
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  return result;
}

export type ProductSearchResult = {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  price: string;
  stock: number;
};

// ใช้ในหน้าสร้างคำสั่งซื้อ: บาร์โค้ด/SKU ตรงตัวขึ้นก่อน แล้วตามด้วยชื่อที่มีคำค้น
export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  await requireUser();
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  return db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      barcode: products.barcode,
      price: products.price,
      stock: stockQty,
    })
    .from(products)
    .where(or(eq(products.barcode, q), eq(products.sku, q), ilike(products.name, pattern), ilike(products.sku, pattern)))
    .orderBy(sql`(${products.barcode} = ${q} or ${products.sku} = ${q}) desc`, products.name)
    .limit(10);
}

export async function findByBarcode(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "กรุณาสแกนหรือพิมพ์บาร์โค้ด" };
  const product = await db.query.products.findFirst({
    where: or(eq(products.barcode, code), eq(products.sku, code)),
    columns: { id: true },
  });
  if (!product) return { error: `ไม่พบสินค้าที่มีบาร์โค้ด/SKU "${code}"` };
  redirect(`/admin/products/${product.id}`);
}


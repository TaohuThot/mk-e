import "server-only";
import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { stockQty } from "./stock";
import { fileUrl } from "./storage";

// ข้อมูลที่หน้าร้านเห็นได้ ห้ามใส่ราคาทุนหรือข้อมูลภายในอื่น
const publicColumns = {
  id: products.id,
  name: products.name,
  price: products.price,
  description: products.description,
  imagePath: products.imagePath,
  thumbnailPath: products.thumbnailPath,
  stock: stockQty,
};

function toPublic(row: { imagePath: string | null; thumbnailPath: string | null } & Record<string, unknown>) {
  const { imagePath, thumbnailPath, ...rest } = row;
  return { ...rest, imageUrl: fileUrl(imagePath), thumbnailUrl: fileUrl(thumbnailPath) };
}

export type PublicProduct = {
  id: number;
  name: string;
  price: string;
  description: string | null;
  stock: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
};

// สินค้าที่มีของขึ้นก่อน แล้วเรียงจากใหม่ไปเก่า
export async function listPublicProducts({ q = "", limit = 24, offset = 0 } = {}) {
  const term = q.trim();
  const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
  const where = term ? or(ilike(products.name, pattern), eq(products.barcode, term)) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.select(publicColumns).from(products).where(where).orderBy(sql`${stockQty} > 0 desc`, desc(products.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(products).where(where),
  ]);
  return { products: rows.map(toPublic) as PublicProduct[], total };
}

export async function getPublicProduct(id: number) {
  const [row] = await db.select(publicColumns).from(products).where(eq(products.id, id));
  return row ? (toPublic(row) as PublicProduct) : null;
}

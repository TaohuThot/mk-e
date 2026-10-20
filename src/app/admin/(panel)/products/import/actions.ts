"use server";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { readSpreadsheet, type SheetRow } from "@/lib/spreadsheet";
import { optionalMoney } from "@/lib/validation";

export type ImportState =
  | { ok: true; created: number; updated: number; stockAdded: number }
  | { ok: false; errors: string[] }
  | undefined;

const MAX_ROWS = 5000;
const MAX_BYTES = 5 * 1024 * 1024;

// หัวคอลัมน์ที่รองรับ (ไทย/อังกฤษ ไม่สนตัวพิมพ์เล็กใหญ่)
const COLUMNS = {
  sku: ["sku", "รหัสสินค้า"],
  name: ["name", "ชื่อสินค้า", "ชื่อ"],
  barcode: ["barcode", "บาร์โค้ด"],
  price: ["price", "ราคา", "ราคาขาย"],
  cost: ["cost", "ราคาทุน", "ทุน"],
  stock: ["stock", "qty", "จำนวน", "จำนวนรับเข้า"],
  description: ["description", "รายละเอียด"],
} as const;
type Column = keyof typeof COLUMNS;

function pick(row: SheetRow, column: Column) {
  for (const [key, value] of Object.entries(row)) {
    if ((COLUMNS[column] as readonly string[]).includes(key.toLowerCase())) return value;
  }
  return "";
}

const priceField = optionalMoney;
const stockField = z.preprocess(
  (v) => (v === "" ? 0 : v),
  z.coerce.number({ message: "จำนวนต้องเป็นตัวเลข" }).int("จำนวนต้องเป็นจำนวนเต็ม").min(0, "จำนวนต้องไม่ติดลบ").max(1_000_000),
);

type ParsedRow = {
  line: number;
  sku: string;
  name: string | null;
  barcode: string | null;
  price: string | null;
  cost: string | null;
  stock: number;
  description: string | null;
};

export async function importProducts(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, errors: ["กรุณาเลือกไฟล์"] };
  if (file.size > MAX_BYTES) return { ok: false, errors: ["ไฟล์ใหญ่เกิน 5 MB"] };

  let rows: SheetRow[];
  try {
    rows = await readSpreadsheet(file);
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : "อ่านไฟล์ไม่สำเร็จ"] };
  }
  if (rows.length === 0) return { ok: false, errors: ["ไม่พบข้อมูลในไฟล์ (แถวแรกต้องเป็นหัวคอลัมน์)"] };
  if (rows.length > MAX_ROWS) return { ok: false, errors: [`นำเข้าได้ครั้งละไม่เกิน ${MAX_ROWS} แถว`] };
  if (!Object.keys(rows[0]).some((k) => (COLUMNS.sku as readonly string[]).includes(k.toLowerCase()))) {
    return { ok: false, errors: ["ไม่พบคอลัมน์ SKU (ดาวน์โหลดไฟล์ตัวอย่างเพื่อดูหัวคอลัมน์ที่รองรับ)"] };
  }

  const errors: string[] = [];
  const parsed: ParsedRow[] = [];
  const seenSku = new Map<string, number>();
  const seenBarcode = new Map<string, number>();

  rows.forEach((row, i) => {
    const line = i + 2; // แถวที่ 1 คือหัวคอลัมน์
    const sku = pick(row, "sku");
    if (!sku) return errors.push(`แถว ${line}: ไม่มี SKU`);
    if (sku.length > 100) return errors.push(`แถว ${line}: SKU ยาวเกิน 100 ตัวอักษร`);
    if (seenSku.has(sku)) return errors.push(`แถว ${line}: SKU "${sku}" ซ้ำกับแถว ${seenSku.get(sku)}`);
    seenSku.set(sku, line);

    const barcode = pick(row, "barcode") || null;
    if (barcode) {
      if (seenBarcode.has(barcode)) return errors.push(`แถว ${line}: บาร์โค้ด "${barcode}" ซ้ำกับแถว ${seenBarcode.get(barcode)}`);
      seenBarcode.set(barcode, line);
    }

    const price = priceField.safeParse(pick(row, "price"));
    const cost = priceField.safeParse(pick(row, "cost"));
    const stock = stockField.safeParse(pick(row, "stock"));
    if (!price.success) return errors.push(`แถว ${line}: ราคาไม่ถูกต้อง`);
    if (!cost.success) return errors.push(`แถว ${line}: ราคาทุนไม่ถูกต้อง`);
    if (!stock.success) return errors.push(`แถว ${line}: ${stock.error.issues[0].message}`);

    const name = pick(row, "name") || null;
    if (name && name.length > 255) return errors.push(`แถว ${line}: ชื่อสินค้ายาวเกิน 255 ตัวอักษร`);
    parsed.push({
      line,
      sku,
      name,
      barcode,
      price: price.data,
      cost: cost.data,
      stock: stock.data,
      description: pick(row, "description") || null,
    });
  });

  const existing = new Map(
    (
      await db
        .select({ id: products.id, sku: products.sku })
        .from(products)
        .where(inArray(products.sku, parsed.map((r) => r.sku).concat("")))
    ).map((p) => [p.sku, p.id]),
  );

  for (const r of parsed) {
    if (!existing.has(r.sku)) {
      if (!r.name) errors.push(`แถว ${r.line}: สินค้าใหม่ "${r.sku}" ต้องมีชื่อสินค้า`);
      if (r.price === null) errors.push(`แถว ${r.line}: สินค้าใหม่ "${r.sku}" ต้องมีราคา`);
    }
  }

  // บาร์โค้ดต้องไม่ซ้ำกับสินค้าตัวอื่นที่มีอยู่แล้วในระบบ
  const barcodes = parsed.filter((r) => r.barcode).map((r) => r.barcode!);
  if (barcodes.length > 0) {
    const owners = await db
      .select({ sku: products.sku, barcode: products.barcode })
      .from(products)
      .where(inArray(products.barcode, barcodes));
    for (const o of owners) {
      const r = parsed.find((x) => x.barcode === o.barcode)!;
      if (r.sku !== o.sku) errors.push(`แถว ${r.line}: บาร์โค้ด "${o.barcode}" เป็นของสินค้า ${o.sku} อยู่แล้ว`);
    }
  }

  if (errors.length > 0) {
    errors.sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
    return { ok: false, errors };
  }

  let created = 0;
  let updated = 0;
  let stockAdded = 0;
  await db.transaction(async (tx) => {
    const movements: (typeof stockMovements.$inferInsert)[] = [];
    const newRows = parsed.filter((r) => !existing.has(r.sku));
    const newSkus = new Set(newRows.map((r) => r.sku));

    for (let i = 0; i < newRows.length; i += 500) {
      const chunk = newRows.slice(i, i + 500);
      const inserted = await tx
        .insert(products)
        .values(
          chunk.map((r) => ({
            sku: r.sku,
            name: r.name!,
            barcode: r.barcode,
            price: r.price!,
            cost: r.cost,
            description: r.description,
          })),
        )
        .returning({ id: products.id, sku: products.sku });
      for (const p of inserted) existing.set(p.sku, p.id);
      created += inserted.length;
    }

    for (const r of parsed) {
      const id = existing.get(r.sku)!;
      const isNew = newSkus.has(r.sku);
      if (!isNew) {
        // อัปเดตเฉพาะช่องที่กรอกมาในไฟล์ ช่องว่างไม่ทับข้อมูลเดิม
        const set: Partial<typeof products.$inferInsert> = {};
        if (r.name) set.name = r.name;
        if (r.barcode) set.barcode = r.barcode;
        if (r.price !== null) set.price = r.price;
        if (r.cost !== null) set.cost = r.cost;
        if (r.description) set.description = r.description;
        if (Object.keys(set).length > 0) {
          await tx
            .update(products)
            .set({ ...set, updatedAt: new Date() })
            .where(eq(products.id, id));
          updated++;
        }
      }
      if (r.stock > 0) {
        movements.push({ productId: id, type: "in", quantity: r.stock, note: isNew ? "ยอดเริ่มต้น (นำเข้าไฟล์)" : "รับเข้า (นำเข้าไฟล์)" });
        stockAdded += r.stock;
      }
    }

    for (let i = 0; i < movements.length; i += 1000) {
      await tx.insert(stockMovements).values(movements.slice(i, i + 1000));
    }
  });

  revalidatePath("/admin/products");
  return { ok: true, created, updated, stockAdded };
}

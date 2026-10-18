import "server-only";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { putFile } from "./storage";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// แปลงรูปเป็น WebP: รูปหลักด้านยาวไม่เกิน 1000px และ thumbnail 300px
export async function saveProductImage(productId: number, file: File) {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("ไฟล์รูปใหญ่เกิน 10 MB");
  if (!file.type.startsWith("image/")) throw new Error("ไฟล์ที่อัปโหลดไม่ใช่รูปภาพ");

  const input = Buffer.from(await file.arrayBuffer());
  // .rotate() ใช้ EXIF หมุนรูปจากมือถือให้ตรง
  const base = sharp(input, { limitInputPixels: 50_000_000 }).rotate();

  const [main, thumb] = await Promise.all([
    base
      .clone()
      .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(),
    base
      .clone()
      .resize({ width: 300, height: 300, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer(),
  ]);

  // ใส่ชื่อไฟล์แบบสุ่ม เพื่อไม่ให้ CDN แสดงรูปเก่าที่แคชไว้เมื่อเปลี่ยนรูป
  const id = randomUUID();
  const imagePath = `products/${productId}/${id}.webp`;
  const thumbnailPath = `products/${productId}/${id}-thumb.webp`;

  await Promise.all([
    putFile(imagePath, main, "image/webp"),
    putFile(thumbnailPath, thumb, "image/webp"),
  ]);

  return { imagePath, thumbnailPath };
}

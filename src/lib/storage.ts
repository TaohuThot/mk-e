import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// ถ้าตั้งค่า S3_* ครบ จะอัปโหลดไป object storage (Cloudflare R2 / Supabase Storage)
// ถ้าไม่ได้ตั้ง จะเก็บไว้ในโฟลเดอร์ uploads/ บนเครื่อง และเปิดดูผ่าน /uploads/... (src/app/uploads)
// ใช้ได้ตอน dev หรือ server ที่มีดิสก์ถาวร แต่ใช้กับ Vercel ไม่ได้
export const useS3 = Boolean(
  process.env.S3_ENDPOINT &&
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY,
);

const s3 = useS3
  ? new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "auto",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export const LOCAL_DIR = path.join(process.cwd(), "uploads");

export async function putFile(key: string, body: Buffer, contentType: string) {
  if (s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return;
  }
  const filePath = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
}

export async function deleteFile(key: string) {
  try {
    if (s3) {
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    } else {
      await unlink(path.join(LOCAL_DIR, key));
    }
  } catch (error) {
    // ไฟล์หายไปแล้วหรือลบไม่ได้ ไม่ควรทำให้การบันทึกข้อมูลล้ม
    console.error("deleteFile failed:", key, error);
  }
}

// ฐานข้อมูลเก็บแค่ key (path) ส่วน URL สร้างตอนแสดงผล เผื่อเปลี่ยนโดเมนภายหลัง
export function fileUrl(key: string | null | undefined) {
  if (!key) return null;
  const base = useS3 ? process.env.S3_PUBLIC_URL?.replace(/\/$/, "") : "/uploads";
  return `${base}/${key}`;
}

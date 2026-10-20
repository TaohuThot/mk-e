import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_DIR, useS3 } from "@/lib/storage";

// เสิร์ฟรูปที่เก็บบนเครื่อง เมื่อไม่ได้ตั้งค่า object storage
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (useS3) return new Response("Not found", { status: 404 });

  const { key } = await params;
  const filePath = path.resolve(LOCAL_DIR, ...key);
  // กัน path traversal เช่น /uploads/../.env
  if (!filePath.startsWith(LOCAL_DIR + path.sep) || path.extname(filePath) !== ".webp") {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(filePath);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

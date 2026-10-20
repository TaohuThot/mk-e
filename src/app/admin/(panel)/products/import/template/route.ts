import { requireUser } from "@/lib/auth";

// ไฟล์ตัวอย่าง CSV ใส่ BOM ไว้ให้ Excel อ่านภาษาไทยถูก
export async function GET() {
  await requireUser();
  const csv = [
    "SKU,ชื่อสินค้า,บาร์โค้ด,ราคาขาย,ราคาทุน,จำนวนรับเข้า,รายละเอียด",
    'TS-001,เสื้อยืดสีขาว,8850000000011,199,120,20,"ผ้าคอตตอน 100%"',
    "CAP-01,หมวกแก๊ป,,250,150,10,",
  ].join("\r\n");
  return new Response("﻿" + csv + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="product-import-template.csv"',
    },
  });
}

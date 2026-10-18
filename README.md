# MyShop

เว็บร้านค้า (หน้าร้าน) + ระบบจัดการคลังสินค้าหลังบ้าน สร้างด้วย Next.js 15 (App Router)

- หน้าร้าน: `/`, `/Product`
- หลังบ้าน (ต้องล็อกอิน): `/admin` — สินค้า, รูปสินค้า, บาร์โค้ด, สต็อก, คำสั่งซื้อ, ลูกค้า

## Stack หลังบ้าน

| ส่วน | ใช้ |
| --- | --- |
| ฐานข้อมูล | PostgreSQL (Neon หรือ Supabase) ผ่าน Drizzle ORM |
| รูปภาพ | แปลงเป็น WebP ด้วย sharp (ด้านยาว ≤1000px + thumbnail 300px) เก็บใน object storage แบบ S3 (Cloudflare R2 / Supabase Storage) ฐานข้อมูลเก็บแค่ path |
| ล็อกอิน | อีเมล + รหัสผ่าน (bcrypt) และ session cookie แบบ JWT (jose) |

## เริ่มใช้งานบนเครื่อง

```bash
npm install
cp .env.example .env.local     # แล้วแก้ DATABASE_URL และใส่ AUTH_SECRET (openssl rand -base64 32)
npm run db:migrate             # สร้างตาราง
npm run user:create -- you@example.com "ชื่อคุณ" "รหัสผ่านยาวอย่างน้อย12ตัว"
npm run dev                    # เปิด http://localhost:3000/admin
```

> คำสั่ง `db:*` และ `user:create` อ่านค่าจาก `.env` (ผ่าน dotenv) ถ้าใช้ `.env.local` ให้คัดลอกเป็น `.env` ด้วย
> หรือรันแบบ `DATABASE_URL=... npm run db:migrate`

ถ้ายังไม่ได้ตั้งค่า `S3_*` รูปจะถูกเก็บในโฟลเดอร์ `uploads/` บนเครื่อง (ใช้ตอน dev ได้ แต่ใช้บน Vercel ไม่ได้)

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
| --- | --- |
| `npm run db:generate` | สร้างไฟล์ migration ใหม่หลังแก้ `src/db/schema.ts` |
| `npm run db:migrate` | รัน migration กับฐานข้อมูลใน `DATABASE_URL` |
| `npm run db:studio` | เปิด Drizzle Studio ดู/แก้ข้อมูลในเบราว์เซอร์ |
| `npm run user:create -- <email> <ชื่อ> <รหัสผ่าน>` | เพิ่มผู้ใช้ หรือเปลี่ยนรหัสผ่านถ้ามีอีเมลนี้แล้ว |

## โครงสร้างข้อมูล

- `products` — ชื่อ, SKU, บาร์โค้ด, ราคา, รายละเอียด, image_path, thumbnail_path
- `stock_movements` — ประวัติเข้า-ออก (บวก = รับเข้า, ลบ = จ่ายออก) **คงเหลือ = ผลรวมของ quantity** ไม่มีคอลัมน์ยอดคงเหลือแยก
  ประเภท: `in` รับเข้า, `out` จ่ายออก, `adjust` ตรวจนับ, `sale` ขาย, `return` คืนจากการยกเลิกคำสั่งซื้อ
- `customers` — ชื่อ, เบอร์โทร, อีเมล, ที่อยู่, หมายเหตุ
- `orders` + `order_items` — ลูกค้า, สถานะ, ยอดรวม, รายการสินค้าพร้อม **ราคา ณ ตอนขาย**
- `users` — ผู้ใช้หลังบ้าน

กติกาสต็อก: สร้างคำสั่งซื้อแล้วตัดสต็อกทันที (ขายเกินคงเหลือไม่ได้), ยกเลิกคำสั่งซื้อแล้วคืนสต็อกอัตโนมัติ (ยกเลิกแล้วเปลี่ยนกลับไม่ได้),
ลบสินค้าที่เคยอยู่ในคำสั่งซื้อไม่ได้

## บาร์โค้ด

- เครื่องสแกนแบบ USB/Bluetooth ใช้ได้ทุกช่องค้นหา (เครื่องจะพิมพ์รหัสแล้วกด Enter ให้)
- หน้า `/admin/scan` ค้นหาสินค้าจากบาร์โค้ด/SKU แล้วเปิดหน้าสินค้านั้น และใช้กล้องมือถือได้ในเบราว์เซอร์ที่รองรับ BarcodeDetector (เช่น Chrome บน Android)
- หน้าสร้างคำสั่งซื้อ: สแกนแล้วเพิ่มสินค้าลงตะกร้าทันที สแกนซ้ำจะเพิ่มจำนวน

## Deploy (เช่น Vercel)

1. สร้างฐานข้อมูลที่ Neon หรือ Supabase แล้วคัดลอก connection string (มี `sslmode=require`)
   ถ้าใช้ connection pooler ได้เลย โค้ดปิด prepared statements ไว้แล้ว
2. สร้าง bucket ที่ Cloudflare R2 หรือ Supabase Storage เปิดให้อ่านแบบ public แล้วสร้าง access key แบบ S3
3. ตั้ง environment variables ตาม `.env.example` ในหน้า settings ของโฮสต์
4. รัน `npm run db:migrate` และ `npm run user:create` จากเครื่องตัวเอง โดยชี้ `DATABASE_URL` ไปที่ฐานข้อมูลจริง
5. Deploy

## ความปลอดภัยและแบ็กอัป

- ห้าม commit ไฟล์ `.env*` (มีใน `.gitignore` แล้ว ยกเว้น `.env.example`)
- ทุกหน้าและทุก server action ของหลังบ้านตรวจ session เอง ไม่ได้พึ่ง middleware อย่างเดียว
- ยังไม่มีการจำกัดจำนวนครั้งที่ล็อกอินผิด ควรใช้รหัสผ่านยาวและเดายาก
- Neon แผนฟรีย้อนข้อมูลได้แค่ 6 ชั่วโมง ควร `pg_dump "$DATABASE_URL" > backup.sql` เป็นประจำ

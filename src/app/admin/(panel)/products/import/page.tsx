import Link from "next/link";
import { requireUser } from "@/lib/auth";
import ImportForm from "./ImportForm";

export default async function ImportProductsPage() {
  await requireUser();
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/products" className="text-sm text-blue-600">‹ กลับไปรายการสินค้า</Link>
      <h1 className="text-2xl font-bold">นำเข้าสินค้าจากไฟล์</h1>

      <section className="space-y-3 rounded-lg bg-white p-6 text-sm shadow">
        <p>
          รองรับไฟล์ Excel (.xlsx) และ CSV แถวแรกต้องเป็นหัวคอลัมน์{" "}
          <a href="/admin/products/import/template" download className="text-blue-600 underline">ดาวน์โหลดไฟล์ตัวอย่าง</a>
        </p>
        <table className="w-full text-left">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="p-2">หัวคอลัมน์</th>
              <th className="p-2">ความหมาย</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b"><td className="p-2">SKU *</td><td className="p-2">ใช้จับคู่สินค้า ถ้ามีอยู่แล้วจะอัปเดต ถ้ายังไม่มีจะเพิ่มใหม่</td></tr>
            <tr className="border-b"><td className="p-2">ชื่อสินค้า</td><td className="p-2">บังคับสำหรับสินค้าใหม่</td></tr>
            <tr className="border-b"><td className="p-2">ราคาขาย</td><td className="p-2">บังคับสำหรับสินค้าใหม่</td></tr>
            <tr className="border-b"><td className="p-2">บาร์โค้ด, ราคาทุน, รายละเอียด</td><td className="p-2">ไม่บังคับ</td></tr>
            <tr><td className="p-2">จำนวนรับเข้า</td><td className="p-2">จำนวนที่<strong>บวกเพิ่ม</strong>เข้าสต็อก (สินค้าใหม่ = ยอดเริ่มต้น)</td></tr>
          </tbody>
        </table>
        <ul className="list-disc space-y-1 pl-5 text-gray-600">
          <li>สินค้าที่มีอยู่แล้ว ช่องที่เว้นว่างจะไม่ทับข้อมูลเดิม</li>
          <li>ถ้ามีแถวไหนผิด ระบบจะไม่นำเข้าเลยสักแถว และแสดงรายการที่ต้องแก้</li>
          <li>ครั้งละไม่เกิน 5,000 แถว และไฟล์ไม่เกิน 5 MB</li>
        </ul>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <ImportForm />
      </section>
    </div>
  );
}

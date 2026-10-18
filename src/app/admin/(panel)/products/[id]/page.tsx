import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime, MOVEMENT_LABELS } from "@/lib/format";
import { stockQty } from "@/lib/stock";
import { fileUrl } from "@/lib/storage";
import DeleteButton from "../../../DeleteButton";
import { addStockMovement, deleteProduct, updateProduct } from "../actions";
import ProductForm from "../ProductForm";
import StockForm from "../StockForm";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ imageError?: string }>;
}) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { imageError } = await searchParams;

  const [row] = await db.select({ product: products, stock: stockQty }).from(products).where(eq(products.id, id));
  if (!row) notFound();
  const { product, stock } = row;

  const movements = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.productId, id))
    .orderBy(desc(stockMovements.createdAt), desc(stockMovements.id))
    .limit(50);

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/products" className="text-sm text-blue-600">‹ กลับไปรายการสินค้า</Link>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-lg">
          คงเหลือ <span className={`text-2xl font-bold ${stock <= 0 ? "text-red-600" : ""}`}>{stock}</span> ชิ้น
        </p>
      </div>

      {imageError && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          บันทึกสินค้าแล้ว แต่อัปโหลดรูปไม่สำเร็จ ลองเลือกรูปใหม่อีกครั้ง
        </p>
      )}

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">ปรับสต็อก</h2>
        <StockForm action={addStockMovement.bind(null, id)} />
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">ข้อมูลสินค้า</h2>
        <ProductForm action={updateProduct.bind(null, id)} product={product} imageUrl={fileUrl(product.imagePath)} />
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">ประวัติเข้า-ออก (50 รายการล่าสุด)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-600">
              <tr>
                <th className="p-2">วันที่</th>
                <th className="p-2">ประเภท</th>
                <th className="p-2 text-right">จำนวน</th>
                <th className="p-2">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="p-2 whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                  <td className="p-2">{MOVEMENT_LABELS[m.type]}</td>
                  <td className={`p-2 text-right font-medium ${m.quantity < 0 ? "text-red-600" : "text-green-700"}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="p-2">
                    {m.orderId ? (
                      <Link href={`/admin/orders/${m.orderId}`} className="text-blue-600 hover:underline">
                        คำสั่งซื้อ #{m.orderId}
                      </Link>
                    ) : (
                      m.note ?? "-"
                    )}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">ยังไม่มีการเคลื่อนไหว</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-6 shadow">
        <h2 className="mb-2 text-lg font-semibold text-red-700">ลบสินค้า</h2>
        <p className="mb-4 text-sm text-gray-600">ลบได้เฉพาะสินค้าที่ยังไม่เคยอยู่ในคำสั่งซื้อ ประวัติสต็อกและรูปจะถูกลบไปด้วย</p>
        <DeleteButton action={deleteProduct.bind(null, id)} confirmText={`ลบ "${product.name}" ถาวร?`} label="ลบสินค้านี้" />
      </section>
    </div>
  );
}

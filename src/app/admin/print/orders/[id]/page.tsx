import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, orderItems, orders, products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/format";
import { shop } from "@/lib/shop";
import PrintButton from "./PrintButton";

export const metadata = { title: "พิมพ์เอกสาร" };

export default async function PrintOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const isDelivery = (await searchParams).type === "delivery";

  const [row] = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, id));
  if (!row) notFound();
  const { order, customer } = row;

  const items = await db
    .select({ item: orderItems, name: products.name, sku: products.sku })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id))
    .orderBy(orderItems.id);
  const totalQty = items.reduce((sum, { item }) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-2 p-4 print:hidden">
        <Link href={`/admin/orders/${id}`} className="text-sm text-blue-600">‹ กลับไปคำสั่งซื้อ</Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`?type=receipt`} className={!isDelivery ? "font-semibold" : "text-blue-600"}>ใบเสร็จ</Link>
          <Link href={`?type=delivery`} className={isDelivery ? "font-semibold" : "text-blue-600"}>ใบส่งของ</Link>
          <PrintButton />
        </div>
      </div>

      <article className="relative mx-auto max-w-[210mm] bg-white p-10 text-sm shadow print:max-w-none print:p-0 print:shadow-none">
        {order.status === "cancelled" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded border-4 border-red-500 px-6 py-2 text-5xl font-bold text-red-500 opacity-40">ยกเลิก</span>
          </div>
        )}

        <header className="mb-6 flex justify-between gap-6 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold">{shop.name}</h1>
            {shop.address && <p className="whitespace-pre-line text-gray-700">{shop.address}</p>}
            {shop.phone && <p className="text-gray-700">โทร {shop.phone}</p>}
            {shop.taxId && <p className="text-gray-700">เลขประจำตัวผู้เสียภาษี {shop.taxId}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">{isDelivery ? "ใบส่งของ" : "ใบเสร็จรับเงิน"}</h2>
            <p>เลขที่ #{String(order.id).padStart(6, "0")}</p>
            <p>วันที่ {formatDateTime(order.createdAt)}</p>
          </div>
        </header>

        <section className="mb-6">
          <p className="font-semibold">{isDelivery ? "ส่งถึง" : "ลูกค้า"}</p>
          {customer ? (
            <>
              <p>{customer.name}</p>
              {customer.address && <p className="whitespace-pre-line">{customer.address}</p>}
              {customer.phone && <p>โทร {customer.phone}</p>}
            </>
          ) : (
            <p>ลูกค้าทั่วไป</p>
          )}
        </section>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y bg-gray-50 text-left print:bg-transparent">
              <th className="p-2 w-10">#</th>
              <th className="p-2">รายการ</th>
              <th className="p-2 text-right">จำนวน</th>
              {!isDelivery && <th className="p-2 text-right">ราคา/หน่วย</th>}
              {!isDelivery && <th className="p-2 text-right">จำนวนเงิน</th>}
            </tr>
          </thead>
          <tbody>
            {items.map(({ item, name, sku }, i) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">
                  {name}
                  <span className="ml-2 text-xs text-gray-500">{sku}</span>
                </td>
                <td className="p-2 text-right">{item.quantity}</td>
                {!isDelivery && <td className="p-2 text-right">{formatMoney(item.unitPrice)}</td>}
                {!isDelivery && (
                  <td className="p-2 text-right">
                    {formatMoney((Math.round(Number(item.unitPrice) * 100) * item.quantity) / 100)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {isDelivery ? (
              <tr>
                <td colSpan={2} className="p-2 text-right font-semibold">รวม</td>
                <td className="p-2 text-right font-semibold">{totalQty} ชิ้น</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={4} className="p-2 text-right font-semibold">ยอดรวมทั้งสิ้น</td>
                <td className="p-2 text-right text-base font-bold">{formatMoney(order.total)}</td>
              </tr>
            )}
          </tfoot>
        </table>

        {order.note && <p className="mt-4 whitespace-pre-line">หมายเหตุ: {order.note}</p>}

        <footer className="mt-16 grid grid-cols-2 gap-16 text-center">
          <div>
            <div className="border-b border-dotted border-gray-500 pb-8" />
            <p className="mt-2">{isDelivery ? "ผู้ส่งของ" : "ผู้รับเงิน"}</p>
          </div>
          <div>
            <div className="border-b border-dotted border-gray-500 pb-8" />
            <p className="mt-2">{isDelivery ? "ผู้รับของ" : "ลูกค้า"}</p>
          </div>
        </footer>
      </article>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, orderItems, orders, products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/format";
import StatusBadge from "../../../StatusBadge";
import { updateOrderStatus } from "../actions";
import StatusForm from "../StatusForm";
import { secondaryButtonClass } from "../../../styles";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

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

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/orders" className="text-sm text-blue-600">‹ กลับไปรายการคำสั่งซื้อ</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">คำสั่งซื้อ #{order.id}</h1>
        <StatusBadge status={order.status} />
        <div className="ml-auto flex gap-2">
          <Link href={`/admin/print/orders/${order.id}?type=receipt`} target="_blank" className={secondaryButtonClass}>
            พิมพ์ใบเสร็จ
          </Link>
          <Link href={`/admin/print/orders/${order.id}?type=delivery`} target="_blank" className={secondaryButtonClass}>
            พิมพ์ใบส่งของ
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow text-sm space-y-1">
          <h2 className="mb-2 text-lg font-semibold">ข้อมูล</h2>
          <p>วันที่: {formatDateTime(order.createdAt)}</p>
          <p>
            ลูกค้า:{" "}
            {customer ? (
              <Link href={`/admin/customers/${customer.id}`} className="text-blue-600 hover:underline">{customer.name}</Link>
            ) : (
              "-"
            )}
          </p>
          {customer?.phone && <p>โทร: {customer.phone}</p>}
          {customer?.address && <p className="whitespace-pre-line">ที่อยู่: {customer.address}</p>}
          {order.note && <p className="whitespace-pre-line">หมายเหตุ: {order.note}</p>}
        </section>
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 text-lg font-semibold">สถานะ</h2>
          {order.status === "cancelled" ? (
            <p className="text-sm text-gray-600">คำสั่งซื้อนี้ถูกยกเลิกและคืนสต็อกแล้ว</p>
          ) : (
            <StatusForm action={updateOrderStatus.bind(null, id)} status={order.status} />
          )}
        </section>
      </div>

      <section className="overflow-x-auto rounded-lg bg-white p-6 shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="p-2">สินค้า</th>
              <th className="p-2 text-right">ราคา ณ ตอนขาย</th>
              <th className="p-2 text-right">จำนวน</th>
              <th className="p-2 text-right">รวม</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ item, name, sku }) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">
                  <Link href={`/admin/products/${item.productId}`} className="text-blue-600 hover:underline">{name}</Link>
                  <div className="text-xs text-gray-500">{sku}</div>
                </td>
                <td className="p-2 text-right">{formatMoney(item.unitPrice)}</td>
                <td className="p-2 text-right">{item.quantity}</td>
                <td className="p-2 text-right">{formatMoney((Math.round(Number(item.unitPrice) * 100) * item.quantity) / 100)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="p-2 text-right font-semibold">ยอดรวม</td>
              <td className="p-2 text-right text-lg font-bold">{formatMoney(order.total)}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}

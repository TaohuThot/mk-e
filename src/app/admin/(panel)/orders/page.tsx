import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, orderStatus, type OrderStatus } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney, ORDER_STATUS_LABELS } from "@/lib/format";
import StatusBadge from "../../StatusBadge";
import { buttonClass } from "../../ui";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser();
  const { status } = await searchParams;
  const filter = orderStatus.enumValues.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;

  const rows = await db
    .select({ order: orders, customerName: customers.name })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(filter ? eq(orders.status, filter) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">คำสั่งซื้อ</h1>
        <Link href="/admin/orders/new" className={buttonClass}>+ สร้างคำสั่งซื้อ</Link>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/orders" className={`rounded-full px-3 py-1 ${!filter ? "bg-gray-800 text-white" : "bg-white"}`}>ทั้งหมด</Link>
        {orderStatus.enumValues.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`rounded-full px-3 py-1 ${filter === s ? "bg-gray-800 text-white" : "bg-white"}`}>
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3">เลขที่</th>
              <th className="p-3">วันที่</th>
              <th className="p-3">ลูกค้า</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3 text-right">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ order, customerName }) => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">#{order.id}</Link>
                </td>
                <td className="p-3 whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                <td className="p-3">{customerName ?? "-"}</td>
                <td className="p-3"><StatusBadge status={order.status} /></td>
                <td className="p-3 text-right">{formatMoney(order.total)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">ยังไม่มีคำสั่งซื้อ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

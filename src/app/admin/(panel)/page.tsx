import Link from "next/link";
import { and, count, desc, eq, gte, ne, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/format";
import { stockQty } from "@/lib/stock";
import StatusBadge from "../StatusBadge";

const LOW_STOCK = 5;

export default async function DashboardPage() {
  await requireUser();
  // เริ่มวันตามเวลาไทย
  const todayStart = sql`date_trunc('day', now() at time zone 'Asia/Bangkok') at time zone 'Asia/Bangkok'`;

  const [[productCount], [customerCount], [today], lowStock, recentOrders] = await Promise.all([
    db.select({ n: count() }).from(products),
    db.select({ n: count() }).from(customers),
    db
      .select({ n: count(), revenue: sum(orders.total) })
      .from(orders)
      .where(and(gte(orders.createdAt, todayStart), ne(orders.status, "cancelled"))),
    db
      .select({ id: products.id, name: products.name, sku: products.sku, stock: stockQty })
      .from(products)
      .where(sql`${stockQty} <= ${LOW_STOCK}`)
      .orderBy(stockQty, products.name)
      .limit(10),
    db
      .select({ order: orders, customerName: customers.name })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ]);

  const cards = [
    { label: "สินค้าทั้งหมด", value: productCount.n.toLocaleString("th-TH"), href: "/admin/products" },
    { label: "ลูกค้า", value: customerCount.n.toLocaleString("th-TH"), href: "/admin/customers" },
    { label: "คำสั่งซื้อวันนี้", value: today.n.toLocaleString("th-TH"), href: "/admin/orders" },
    { label: "ยอดขายวันนี้", value: formatMoney(today.revenue ?? 0), href: "/admin/orders" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ภาพรวม</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-lg bg-white p-4 shadow hover:shadow-md">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">สินค้าใกล้หมด (≤ {LOW_STOCK})</h2>
          <ul className="divide-y text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <Link href={`/admin/products/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link>
                <span className={p.stock <= 0 ? "font-semibold text-red-600" : "text-amber-600"}>{p.stock}</span>
              </li>
            ))}
            {lowStock.length === 0 && <li className="py-2 text-gray-500">ไม่มีสินค้าใกล้หมด</li>}
          </ul>
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">คำสั่งซื้อล่าสุด</h2>
          <ul className="divide-y text-sm">
            {recentOrders.map(({ order, customerName }) => (
              <li key={order.id} className="flex items-center justify-between gap-2 py-2">
                <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                  #{order.id} {customerName ? `· ${customerName}` : ""}
                </Link>
                <span className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  {formatMoney(order.total)}
                </span>
              </li>
            ))}
            {recentOrders.length === 0 && <li className="py-2 text-gray-500">ยังไม่มีคำสั่งซื้อ</li>}
          </ul>
          <p className="mt-2 text-xs text-gray-400">อัปเดตล่าสุด {formatDateTime(new Date())}</p>
        </section>
      </div>
    </div>
  );
}

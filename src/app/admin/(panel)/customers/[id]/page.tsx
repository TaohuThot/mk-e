import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney, ORDER_STATUS_LABELS } from "@/lib/format";
import DeleteButton from "../../../DeleteButton";
import { deleteCustomer, updateCustomer } from "../actions";
import CustomerForm from "../CustomerForm";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const customer = await db.query.customers.findFirst({ where: eq(customers.id, id) });
  if (!customer) notFound();
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/customers" className="text-sm text-blue-600">‹ กลับไปรายชื่อลูกค้า</Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        <Link href={`/admin/orders/new?customer=${id}`} className="text-blue-600 hover:underline">+ สร้างคำสั่งซื้อให้ลูกค้านี้</Link>
      </div>

      <section className="rounded-lg bg-white p-6 shadow">
        <CustomerForm action={updateCustomer.bind(null, id)} customer={customer} />
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">คำสั่งซื้อ</h2>
        <ul className="divide-y text-sm">
          {customerOrders.map((o) => (
            <li key={o.id} className="flex justify-between py-2">
              <Link href={`/admin/orders/${o.id}`} className="text-blue-600 hover:underline">
                #{o.id} · {formatDateTime(o.createdAt)}
              </Link>
              <span>{ORDER_STATUS_LABELS[o.status]} · {formatMoney(o.total)}</span>
            </li>
          ))}
          {customerOrders.length === 0 && <li className="py-2 text-gray-500">ยังไม่มีคำสั่งซื้อ</li>}
        </ul>
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-6 shadow">
        <h2 className="mb-2 text-lg font-semibold text-red-700">ลบลูกค้า</h2>
        <p className="mb-4 text-sm text-gray-600">คำสั่งซื้อเดิมจะยังอยู่ แต่จะไม่แสดงชื่อลูกค้า</p>
        <DeleteButton action={deleteCustomer.bind(null, id)} confirmText={`ลบลูกค้า "${customer.name}"?`} label="ลบลูกค้านี้" />
      </section>
    </div>
  );
}

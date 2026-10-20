import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import OrderForm from "../OrderForm";

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  await requireUser();
  const customerId = Number((await searchParams).customer) || undefined;
  const customerList = await db
    .select({ id: customers.id, name: customers.name, phone: customers.phone })
    .from(customers)
    .orderBy(asc(customers.name));

  return (
    <div className="max-w-4xl space-y-4">
      <Link href="/admin/orders" className="text-sm text-blue-600">‹ กลับไปรายการคำสั่งซื้อ</Link>
      <h1 className="text-2xl font-bold">สร้างคำสั่งซื้อ</h1>
      <div className="rounded-lg bg-white p-6 shadow">
        <OrderForm customers={customerList} defaultCustomerId={customerId} />
      </div>
    </div>
  );
}

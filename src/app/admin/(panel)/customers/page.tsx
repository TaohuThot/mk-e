import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { buttonClass, inputClass } from "../../ui";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser();
  const term = ((await searchParams).q ?? "").trim();
  const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;

  const rows = await db
    .select()
    .from(customers)
    .where(term ? or(ilike(customers.name, pattern), ilike(customers.phone, pattern), ilike(customers.email, pattern)) : undefined)
    .orderBy(desc(customers.createdAt))
    .limit(100);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">ลูกค้า</h1>
        <Link href="/admin/customers/new" className={buttonClass}>+ เพิ่มลูกค้า</Link>
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={term} placeholder="ค้นหาชื่อ / เบอร์โทร / อีเมล" className={inputClass} />
        <button className={buttonClass}>ค้นหา</button>
      </form>
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3">ชื่อ</th>
              <th className="p-3">เบอร์โทร</th>
              <th className="p-3">อีเมล</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/admin/customers/${c.id}`} className="font-medium text-blue-600 hover:underline">{c.name}</Link>
                </td>
                <td className="p-3">{c.phone ?? "-"}</td>
                <td className="p-3">{c.email ?? "-"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">ไม่พบลูกค้า</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { stockQty } from "@/lib/stock";
import { fileUrl } from "@/lib/storage";
import { buttonClass, inputClass } from "../../ui";

const PAGE_SIZE = 50;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireUser();
  const { q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number.parseInt(page) || 1);
  const term = q.trim();
  const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
  const where = term
    ? or(ilike(products.name, pattern), ilike(products.sku, pattern), eq(products.barcode, term))
    : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        price: products.price,
        thumbnailPath: products.thumbnailPath,
        stock: stockQty,
      })
      .from(products)
      .where(where)
      .orderBy(desc(products.updatedAt))
      .limit(PAGE_SIZE)
      .offset((pageNum - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(products).where(where),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => `/admin/products?${new URLSearchParams({ q: term, page: String(p) })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">สินค้า ({total})</h1>
        <Link href="/admin/products/new" className={buttonClass}>+ เพิ่มสินค้า</Link>
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={term} placeholder="ค้นหาชื่อ / SKU / สแกนบาร์โค้ด" autoFocus className={inputClass} />
        <button className={buttonClass}>ค้นหา</button>
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3">รูป</th>
              <th className="p-3">ชื่อสินค้า</th>
              <th className="p-3">SKU</th>
              <th className="p-3">บาร์โค้ด</th>
              <th className="p-3 text-right">ราคา</th>
              <th className="p-3 text-right">คงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const thumb = fileUrl(p.thumbnailPath);
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" loading="lazy" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-gray-200" />
                    )}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-blue-600 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-3">{p.sku}</td>
                  <td className="p-3">{p.barcode ?? "-"}</td>
                  <td className="p-3 text-right">{formatMoney(p.price)}</td>
                  <td className={`p-3 text-right font-semibold ${p.stock <= 0 ? "text-red-600" : p.stock <= 5 ? "text-amber-600" : ""}`}>
                    {p.stock}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">ไม่พบสินค้า</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          {pageNum > 1 && <Link href={pageHref(pageNum - 1)} className="text-blue-600">‹ ก่อนหน้า</Link>}
          <span>หน้า {pageNum} / {pages}</span>
          {pageNum < pages && <Link href={pageHref(pageNum + 1)} className="text-blue-600">ถัดไป ›</Link>}
        </div>
      )}
    </div>
  );
}

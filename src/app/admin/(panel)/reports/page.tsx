import Link from "next/link";
import { and, desc, eq, gte, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { buttonClass, inputClass, labelClass } from "../../styles";

const TZ = "Asia/Bangkok";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// วันที่ปัจจุบันตามเวลาไทยในรูปแบบ YYYY-MM-DD
function todayBangkok(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

function monthStart(monthsAgo: number) {
  const [y, m] = todayBangkok().split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 - monthsAgo, 1));
  return d.toISOString().slice(0, 10);
}

const thMonth = new Intl.DateTimeFormat("th-TH", { month: "short", year: "numeric", timeZone: "UTC" });
const thDay = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" });

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const period = sp.period === "month" ? "month" : "day";
  const from = sp.from && DATE_RE.test(sp.from) ? sp.from : period === "month" ? monthStart(11) : todayBangkok(-29);
  const to = sp.to && DATE_RE.test(sp.to) ? sp.to : todayBangkok();

  // ช่วงเวลาตามเวลาไทย: ตั้งแต่ 00:00 ของวัน from ถึงก่อน 00:00 ของวันถัดจาก to
  const start = sql`(${from}::date)::timestamp at time zone ${TZ}`;
  const end = sql`(${to}::date + 1)::timestamp at time zone ${TZ}`;
  const inRange = and(gte(orders.createdAt, start), lt(orders.createdAt, end), ne(orders.status, "cancelled"));

  const lineRevenue = sql`${orderItems.quantity} * ${orderItems.unitPrice}`;
  const lineCost = sql`${orderItems.quantity} * ${orderItems.unitCost}`;
  // กำไรคิดเฉพาะรายการที่มีราคาทุน
  const lineProfit = sql`case when ${orderItems.unitCost} is null then 0 else ${orderItems.quantity} * (${orderItems.unitPrice} - ${orderItems.unitCost}) end`;
  // ใช้ sql.raw (period ผ่าน whitelist แล้ว) เพราะ GROUP BY ต้องเป็น expression เดียวกับ SELECT ทุกตัวอักษร
  // ถ้าส่งเป็น parameter เลข $n จะต่างกันแล้ว Postgres จะไม่ยอม
  const bucket = sql<string>`to_char(date_trunc('${sql.raw(period)}', ${orders.createdAt} at time zone '${sql.raw(TZ)}'), 'YYYY-MM-DD')`;

  const [[summary], [itemSummary], buckets, top] = await Promise.all([
    db
      .select({ orderCount: sql<number>`count(*)::int`, revenue: sql<string>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(inRange),
    db
      .select({
        qty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
        cost: sql<string>`coalesce(sum(${lineCost}), 0)`,
        profit: sql<string>`coalesce(sum(${lineProfit}), 0)`,
        missingCost: sql<number>`count(*) filter (where ${orderItems.unitCost} is null)::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(inRange),
    db
      .select({
        bucket,
        orderCount: sql<number>`count(distinct ${orders.id})::int`,
        revenue: sql<string>`coalesce(sum(${lineRevenue}), 0)`,
        profit: sql<string>`coalesce(sum(${lineProfit}), 0)`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(inRange)
      .groupBy(bucket)
      .orderBy(desc(bucket)),
    db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        qty: sql<number>`sum(${orderItems.quantity})::int`,
        revenue: sql<string>`sum(${lineRevenue})`,
        profit: sql<string>`sum(${lineProfit})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(inRange)
      .groupBy(products.id, products.name, products.sku)
      .orderBy(desc(sql`sum(${orderItems.quantity})`), desc(sql`sum(${lineRevenue})`))
      .limit(10),
  ]);

  const maxRevenue = Math.max(1, ...buckets.map((b) => Number(b.revenue)));
  const revenue = Number(summary.revenue);
  const profit = Number(itemSummary.profit);
  const formatBucket = (b: string) => (period === "month" ? thMonth : thDay).format(new Date(`${b}T00:00:00Z`));

  const cards = [
    { label: "ยอดขาย", value: formatMoney(revenue) },
    { label: "จำนวนคำสั่งซื้อ", value: summary.orderCount.toLocaleString("th-TH") },
    { label: "สินค้าที่ขายได้", value: `${itemSummary.qty.toLocaleString("th-TH")} ชิ้น` },
    { label: "กำไรขั้นต้น", value: formatMoney(profit) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">รายงานยอดขาย</h1>

      <form className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow">
        <div>
          <label htmlFor="period" className={labelClass}>แสดงเป็น</label>
          <select id="period" name="period" defaultValue={period} className={inputClass}>
            <option value="day">รายวัน</option>
            <option value="month">รายเดือน</option>
          </select>
        </div>
        <div>
          <label htmlFor="from" className={labelClass}>ตั้งแต่</label>
          <input id="from" name="from" type="date" defaultValue={from} className={inputClass} />
        </div>
        <div>
          <label htmlFor="to" className={labelClass}>ถึง</label>
          <input id="to" name="to" type="date" defaultValue={to} className={inputClass} />
        </div>
        <button className={buttonClass}>ดูรายงาน</button>
        <div className="flex gap-3 text-sm">
          <Link href={`/admin/reports?period=day&from=${todayBangkok()}&to=${todayBangkok()}`} className="text-blue-600">วันนี้</Link>
          <Link href="/admin/reports?period=day" className="text-blue-600">30 วันล่าสุด</Link>
          <Link href={`/admin/reports?period=day&from=${monthStart(0)}`} className="text-blue-600">เดือนนี้</Link>
          <Link href="/admin/reports?period=month" className="text-blue-600">12 เดือนล่าสุด</Link>
        </div>
      </form>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      {itemSummary.missingCost > 0 && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          มี {itemSummary.missingCost} รายการที่ขายตอนสินค้ายังไม่ได้ใส่ราคาทุน กำไรขั้นต้นจึงไม่รวมรายการเหล่านั้น
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">ยอดขาย{period === "month" ? "รายเดือน" : "รายวัน"}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-600">
                <tr>
                  <th className="p-2">{period === "month" ? "เดือน" : "วันที่"}</th>
                  <th className="p-2 text-right">คำสั่งซื้อ</th>
                  <th className="p-2">ยอดขาย</th>
                  <th className="p-2 text-right">กำไร</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((b) => (
                  <tr key={b.bucket} className="border-b last:border-0">
                    <td className="p-2 whitespace-nowrap">{formatBucket(b.bucket)}</td>
                    <td className="p-2 text-right">{b.orderCount}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 rounded bg-blue-500" style={{ width: `${(Number(b.revenue) / maxRevenue) * 100}%`, minWidth: 2, maxWidth: "60%" }} />
                        <span className="whitespace-nowrap">{formatMoney(b.revenue)}</span>
                      </div>
                    </td>
                    <td className="p-2 text-right">{formatMoney(b.profit)}</td>
                  </tr>
                ))}
                {buckets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">ไม่มียอดขายในช่วงนี้</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">สินค้าขายดี 10 อันดับ</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-600">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">สินค้า</th>
                  <th className="p-2 text-right">ขายได้</th>
                  <th className="p-2 text-right">ยอดขาย</th>
                  <th className="p-2 text-right">กำไร</th>
                </tr>
              </thead>
              <tbody>
                {top.map((p, i) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">
                      <Link href={`/admin/products/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link>
                      <div className="text-xs text-gray-500">{p.sku}</div>
                    </td>
                    <td className="p-2 text-right">{p.qty}</td>
                    <td className="p-2 text-right">{formatMoney(p.revenue)}</td>
                    <td className="p-2 text-right">{formatMoney(p.profit)}</td>
                  </tr>
                ))}
                {top.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">ไม่มียอดขายในช่วงนี้</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

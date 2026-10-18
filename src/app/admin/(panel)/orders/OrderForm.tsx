"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { formatMoney } from "@/lib/format";
import { searchProducts, type ProductSearchResult } from "../products/actions";
import { createOrder } from "./actions";
import { FormMessage, inputClass, labelClass, SubmitButton, useFormAction } from "../../ui";

type Line = ProductSearchResult & { quantity: number };
type Props = { customers: { id: number; name: string; phone: string | null }[]; defaultCustomerId?: number };

export default function OrderForm({ customers, defaultCustomerId }: Props) {
  const { state, onSubmit, pending } = useFormAction(createOrder);
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  // คำค้นล่าสุด ใช้ทิ้งผลค้นหาเก่าที่ตอบกลับมาช้ากว่าคำค้นใหม่
  const latestQuery = useRef("");

  useEffect(() => {
    latestQuery.current = query;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const found = await searchProducts(query);
        if (latestQuery.current === query) setResults(found);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function addLine(product: ProductSearchResult) {
    const inCart = lines.find((l) => l.id === product.id)?.quantity ?? 0;
    if (inCart >= product.stock) {
      setNotice(`"${product.name}" สต็อกไม่พอ (คงเหลือ ${product.stock})`);
      return;
    }
    setNotice(null);
    setLines((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) return prev.map((l) => (l.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function pick(product: ProductSearchResult) {
    addLine(product);
    setQuery("");
    searchRef.current?.focus();
  }

  // เครื่องสแกนบาร์โค้ดจะพิมพ์รหัสแล้วกด Enter: ล้างช่องทันทีเพื่อรอสแกนชิ้นถัดไป
  // ถ้ารหัสตรงกับบาร์โค้ด/SKU ให้เพิ่มเลย ถ้าไม่ตรงให้แสดงผลค้นหาแทน
  async function onSearchEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setQuery("");
    const found = await searchProducts(q);
    const exact = found.find((p) => p.barcode === q || p.sku === q);
    if (exact) addLine(exact);
    else if (found.length === 0) setNotice(`ไม่พบสินค้า "${q}"`);
    else if (latestQuery.current === "") {
      setQuery(q);
      setResults(found);
    }
  }

  const totalSatang = lines.reduce((sum, l) => sum + Math.round(Number(l.price) * 100) * l.quantity, 0);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormMessage state={state} />
      <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ productId: l.id, quantity: l.quantity })))} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="customerId" className={labelClass}>ลูกค้า</label>
          <select id="customerId" name="customerId" defaultValue={defaultCustomerId ?? ""} className={inputClass}>
            <option value="">— ไม่ระบุ (ลูกค้าหน้าร้าน) —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.phone ? ` (${c.phone})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>สถานะ</label>
          <select id="status" name="status" defaultValue="paid" className={inputClass}>
            <option value="paid">ชำระแล้ว</option>
            <option value="pending">รอชำระเงิน</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <label htmlFor="search" className={labelClass}>เพิ่มสินค้า (สแกนบาร์โค้ด หรือพิมพ์ชื่อ/SKU)</label>
        <input
          id="search"
          ref={searchRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setNotice(null);
          }}
          onKeyDown={onSearchEnter}
          autoComplete="off"
          autoFocus
          className={inputClass}
        />
        {notice && <p className="mt-1 text-sm text-red-600">{notice}</p>}
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => pick(p)}
                  disabled={p.stock <= 0}
                  className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-blue-50 disabled:opacity-40"
                >
                  <span>{p.name} <span className="text-gray-500">({p.sku})</span></span>
                  <span>{formatMoney(p.price)} · คงเหลือ {p.stock}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="p-2">สินค้า</th>
              <th className="p-2 text-right">ราคา</th>
              <th className="p-2 text-right">จำนวน</th>
              <th className="p-2 text-right">รวม</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b">
                <td className="p-2">{l.name}<div className="text-xs text-gray-500">คงเหลือ {l.stock}</div></td>
                <td className="p-2 text-right">{formatMoney(l.price)}</td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    min={1}
                    max={l.stock}
                    value={l.quantity}
                    onChange={(e) => {
                      const quantity = Math.max(1, Math.floor(Number(e.target.value) || 1));
                      setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, quantity } : x)));
                    }}
                    className="w-20 rounded border px-2 py-1 text-right"
                  />
                </td>
                <td className="p-2 text-right">{formatMoney((Math.round(Number(l.price) * 100) * l.quantity) / 100)}</td>
                <td className="p-2 text-right">
                  <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.id !== l.id))} className="text-red-600">
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">ยังไม่มีสินค้า</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="p-2 text-right font-semibold">ยอดรวม</td>
              <td className="p-2 text-right text-lg font-bold">{formatMoney(totalSatang / 100)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <label htmlFor="note" className={labelClass}>หมายเหตุ</label>
        <textarea id="note" name="note" rows={2} className={inputClass} />
      </div>

      <SubmitButton pending={pending}>บันทึกคำสั่งซื้อ</SubmitButton>
    </form>
  );
}

"use client";
import Link from "next/link";
import { useActionState } from "react";
import { importProducts } from "./actions";
import { SubmitButton } from "../../../ui";

export default function ImportForm() {
  const [state, formAction, pending] = useActionState(importProducts, undefined);
  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input name="file" type="file" accept=".xlsx,.csv" required className="block text-sm" />
        <SubmitButton pending={pending}>นำเข้า</SubmitButton>
      </form>

      {state?.ok === true && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          นำเข้าสำเร็จ: เพิ่มสินค้าใหม่ {state.created} รายการ, อัปเดต {state.updated} รายการ, รับเข้าสต็อกรวม {state.stockAdded} ชิ้น
          <div className="mt-2">
            <Link href="/admin/products" className="font-medium text-green-900 underline">ไปที่รายการสินค้า</Link>
          </div>
        </div>
      )}
      {state?.ok === false && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          <p className="mb-2 font-medium">ยังไม่ได้นำเข้า เพราะพบข้อผิดพลาด {state.errors.length} จุด (แก้ไฟล์แล้วอัปโหลดใหม่):</p>
          <ul className="list-disc space-y-1 pl-5">
            {state.errors.slice(0, 30).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          {state.errors.length > 30 && <p className="mt-2">...และอีก {state.errors.length - 30} จุด</p>}
        </div>
      )}
    </div>
  );
}

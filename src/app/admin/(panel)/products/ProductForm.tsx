"use client";
import { useState } from "react";
import type { Product } from "@/db/schema";
import { FormMessage, inputClass, labelClass, SubmitButton, useFormAction, type FormState } from "../../ui";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  product?: Product;
  imageUrl?: string | null;
};

export default function ProductForm({ action, product, imageUrl }: Props) {
  const { state, onSubmit, pending } = useFormAction(action);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="name" className={labelClass}>ชื่อสินค้า *</label>
          <input id="name" name="name" required maxLength={255} defaultValue={product?.name} className={inputClass} />
        </div>
        <div>
          <label htmlFor="sku" className={labelClass}>SKU *</label>
          <input id="sku" name="sku" required maxLength={100} defaultValue={product?.sku} className={inputClass} />
        </div>
        <div>
          <label htmlFor="barcode" className={labelClass}>บาร์โค้ด</label>
          <input id="barcode" name="barcode" maxLength={100} defaultValue={product?.barcode ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="price" className={labelClass}>ราคาขาย (บาท) *</label>
          <input id="price" name="price" type="number" min="0" step="0.01" required defaultValue={product?.price ?? ""} className={inputClass} />
        </div>
        {!product && (
          <div>
            <label htmlFor="initialStock" className={labelClass}>จำนวนเริ่มต้น</label>
            <input id="initialStock" name="initialStock" type="number" min="0" step="1" defaultValue="0" className={inputClass} />
          </div>
        )}
        <div className="md:col-span-2">
          <label htmlFor="description" className={labelClass}>รายละเอียด</label>
          <textarea id="description" name="description" rows={4} defaultValue={product?.description ?? ""} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="image" className={labelClass}>รูปสินค้า (แปลงเป็น WebP อัตโนมัติ, ไม่เกิน 10 MB)</label>
          <div className="flex items-start gap-4">
            {(preview || imageUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview ?? imageUrl!} alt="" className="h-32 w-32 rounded border object-cover" />
            )}
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </div>
        </div>
      </div>
      <SubmitButton pending={pending}>{product ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}</SubmitButton>
    </form>
  );
}

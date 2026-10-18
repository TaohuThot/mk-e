"use client";
import type { Customer } from "@/db/schema";
import { FormMessage, inputClass, labelClass, SubmitButton, useFormAction, type FormState } from "../../ui";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  customer?: Customer;
};

export default function CustomerForm({ action, customer }: Props) {
  const { state, onSubmit, pending } = useFormAction(action);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="name" className={labelClass}>ชื่อลูกค้า *</label>
          <input id="name" name="name" required maxLength={255} defaultValue={customer?.name} className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>เบอร์โทร</label>
          <input id="phone" name="phone" type="tel" maxLength={50} defaultValue={customer?.phone ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>อีเมล</label>
          <input id="email" name="email" type="email" maxLength={255} defaultValue={customer?.email ?? ""} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="address" className={labelClass}>ที่อยู่</label>
          <textarea id="address" name="address" rows={3} defaultValue={customer?.address ?? ""} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="note" className={labelClass}>หมายเหตุ</label>
          <textarea id="note" name="note" rows={2} defaultValue={customer?.note ?? ""} className={inputClass} />
        </div>
      </div>
      <SubmitButton pending={pending}>{customer ? "บันทึกการแก้ไข" : "เพิ่มลูกค้า"}</SubmitButton>
    </form>
  );
}

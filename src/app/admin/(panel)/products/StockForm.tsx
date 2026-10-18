"use client";
import { useEffect, useRef } from "react";
import { FormMessage, inputClass, labelClass, SubmitButton, useFormAction, type FormState } from "../../ui";

type Props = { action: (prev: FormState, formData: FormData) => Promise<FormState> };

export default function StockForm({ action }: Props) {
  const { state, onSubmit, pending } = useFormAction(action);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="type" className={labelClass}>ประเภท</label>
          <select id="type" name="type" className={inputClass} defaultValue="in">
            <option value="in">รับเข้า (+)</option>
            <option value="out">จ่ายออก (−)</option>
            <option value="adjust">ตรวจนับ (ตั้งยอดตามที่นับได้)</option>
          </select>
        </div>
        <div>
          <label htmlFor="quantity" className={labelClass}>จำนวน</label>
          <input id="quantity" name="quantity" type="number" min="0" step="1" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="note" className={labelClass}>หมายเหตุ</label>
          <input id="note" name="note" className={inputClass} />
        </div>
      </div>
      <SubmitButton pending={pending}>บันทึกสต็อก</SubmitButton>
    </form>
  );
}

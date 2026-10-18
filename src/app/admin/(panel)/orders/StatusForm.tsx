"use client";
import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/format";
import { FormMessage, inputClass, SubmitButton, useFormAction, type FormState } from "../../ui";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  status: OrderStatus;
};

export default function StatusForm({ action, status }: Props) {
  const { state, onSubmit, pending } = useFormAction(action);
  return (
    <form
      onSubmit={(e) => {
        const next = new FormData(e.currentTarget).get("status");
        if (next === "cancelled" && !confirm("ยกเลิกคำสั่งซื้อและคืนสต็อก? เปลี่ยนกลับไม่ได้")) {
          e.preventDefault();
          return;
        }
        onSubmit(e);
      }}
      className="space-y-2"
    >
      <FormMessage state={state} />
      <div className="flex gap-2">
        <select name="status" defaultValue={status} className={inputClass}>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <SubmitButton pending={pending}>อัปเดต</SubmitButton>
      </div>
    </form>
  );
}

"use client";
import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import { buttonClass } from "./styles";
import type { FormState } from "./styles";

export type { FormState };
export { buttonClass, dangerButtonClass, inputClass, labelClass, secondaryButtonClass } from "./styles";

// React 19 ล้างค่าในฟอร์มหลัง action ทำงานทุกครั้ง แม้จะคืน error กลับมา
// hook นี้ส่งฟอร์มเองผ่าน onSubmit เพื่อให้ค่าที่ผู้ใช้กรอกยังอยู่เมื่อบันทึกไม่สำเร็จ
export function useFormAction(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [transitionPending, startTransition] = useTransition();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  };
  return { state, onSubmit, pending: isPending || transitionPending };
}

export function SubmitButton({
  children,
  className = buttonClass,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  className?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "กำลังบันทึก..." : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state?.error) return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{state.ok}</p>;
  return null;
}

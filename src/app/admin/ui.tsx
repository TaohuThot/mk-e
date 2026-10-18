"use client";
import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";

export type FormState = { error?: string; ok?: string } | undefined;

export const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
export const labelClass = "mb-1 block text-sm font-medium text-gray-700";
export const buttonClass =
  "rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50";
export const secondaryButtonClass =
  "rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50";
export const dangerButtonClass =
  "rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50";

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

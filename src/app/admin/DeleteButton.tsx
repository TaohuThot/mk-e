"use client";
import { useActionState } from "react";
import { dangerButtonClass, FormMessage, type FormState } from "./ui";

type Props = {
  action: (prev: FormState) => Promise<FormState>;
  confirmText: string;
  label?: string;
};

export default function DeleteButton({ action, confirmText, label = "ลบ" }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className="space-y-2"
    >
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={dangerButtonClass}>
        {pending ? "กำลังลบ..." : label}
      </button>
    </form>
  );
}

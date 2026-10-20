"use client";
import { login } from "./actions";
import { FormMessage, inputClass, labelClass, SubmitButton, useFormAction } from "../ui";

export default function LoginForm() {
  const { state, onSubmit, pending } = useFormAction(login);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label htmlFor="email" className={labelClass}>อีเมล</label>
        <input id="email" name="email" type="email" required autoComplete="username" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>รหัสผ่าน</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </div>
      <SubmitButton pending={pending} className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        เข้าสู่ระบบ
      </SubmitButton>
    </form>
  );
}

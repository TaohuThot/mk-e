// ค่าคลาส Tailwind ที่ใช้ร่วมกัน แยกจาก ui.tsx (ที่เป็น client) เพื่อให้ server component import ได้
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

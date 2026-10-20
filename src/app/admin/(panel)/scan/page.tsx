import { requireUser } from "@/lib/auth";
import ScanForm from "./ScanForm";

export default async function ScanPage() {
  await requireUser();
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">สแกนบาร์โค้ด</h1>
      <p className="text-sm text-gray-600">
        ใช้เครื่องสแกนบาร์โค้ดแบบ USB/Bluetooth ได้เลย (ทำงานเหมือนพิมพ์แล้วกด Enter)
        หรือใช้กล้องมือถือถ้าเบราว์เซอร์รองรับ
      </p>
      <div className="rounded-lg bg-white p-6 shadow">
        <ScanForm />
      </div>
    </div>
  );
}

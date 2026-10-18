import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createCustomer } from "../actions";
import CustomerForm from "../CustomerForm";

export default async function NewCustomerPage() {
  await requireUser();
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/customers" className="text-sm text-blue-600">‹ กลับไปรายชื่อลูกค้า</Link>
      <h1 className="text-2xl font-bold">เพิ่มลูกค้า</h1>
      <div className="rounded-lg bg-white p-6 shadow">
        <CustomerForm action={createCustomer} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createProduct } from "../actions";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  await requireUser();
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/products" className="text-sm text-blue-600">‹ กลับไปรายการสินค้า</Link>
      <h1 className="text-2xl font-bold">เพิ่มสินค้า</h1>
      <div className="rounded-lg bg-white p-6 shadow">
        <ProductForm action={createProduct} />
      </div>
    </div>
  );
}

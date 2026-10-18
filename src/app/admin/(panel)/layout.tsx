import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "MyShop หลังบ้าน" };

const nav = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/scan", label: "สแกนบาร์โค้ด" },
  { href: "/admin/products", label: "สินค้า / สต็อก" },
  { href: "/admin/orders", label: "คำสั่งซื้อ" },
  { href: "/admin/customers", label: "ลูกค้า" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-gray-100 md:flex">
      <aside className="bg-gray-800 text-white md:min-h-screen md:w-56 md:shrink-0">
        <div className="p-4 text-xl font-semibold">MyShop หลังบ้าน</div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded px-3 py-2 hover:bg-gray-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-gray-700 p-4 text-sm md:block">
          <p className="mb-2 truncate text-gray-300">{user.name}</p>
          <form action={logout}>
            <button className="text-gray-400 hover:text-white">ออกจากระบบ</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
      <form action={logout} className="p-4 text-center md:hidden">
        <button className="text-sm text-gray-500">ออกจากระบบ ({user.name})</button>
      </form>
    </div>
  );
}

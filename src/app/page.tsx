import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
import Home from "./Home/HomeContent";
import { listPublicProducts } from "@/lib/storefront";

// ดึงสินค้าจากฐานข้อมูลทุกครั้งที่เปิดหน้า สต็อกจะได้ตรงเสมอ
export const dynamic = "force-dynamic";

export default async function page() {
  const { products } = await listPublicProducts({ limit: 8 });
  return (
    <>
      <Navbar />
      <Home products={products} />
      <Footer />
    </>
  );
}

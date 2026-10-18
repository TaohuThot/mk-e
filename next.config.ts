import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // รูปสินค้าส่งผ่าน server action ค่าเริ่มต้น 1 MB ไม่พอสำหรับรูปจากมือถือ
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;

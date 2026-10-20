// ข้อมูลร้านที่พิมพ์บนหัวใบเสร็จ/ใบส่งของ ตั้งค่าใน .env
export const shop = {
  name: process.env.SHOP_NAME || "MyShop",
  address: process.env.SHOP_ADDRESS || "",
  phone: process.env.SHOP_PHONE || "",
  taxId: process.env.SHOP_TAX_ID || "",
};

const money = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });
const dateTime = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

export const formatMoney = (value: string | number) => money.format(Number(value));
export const formatDateTime = (value: Date) => dateTime.format(value);

export const MOVEMENT_LABELS = {
  in: "รับเข้า",
  out: "จ่ายออก",
  adjust: "ปรับยอด",
  sale: "ขาย",
  return: "คืนสต็อก",
} as const;

export const ORDER_STATUS_LABELS = {
  pending: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  shipped: "จัดส่งแล้ว",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
} as const;

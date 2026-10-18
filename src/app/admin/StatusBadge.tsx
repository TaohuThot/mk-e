import type { OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/format";

const colors: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-600",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status]}`}>{ORDER_STATUS_LABELS[status]}</span>;
}

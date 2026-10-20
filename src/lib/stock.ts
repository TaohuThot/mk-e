import "server-only";
import { sql } from "drizzle-orm";
import { stockMovements } from "@/db/schema";

// ใช้เป็น subquery: คงเหลือของสินค้าแต่ละตัว
export const stockQty = sql<number>`coalesce((
  select sum(${stockMovements.quantity}) from ${stockMovements}
  where ${stockMovements.productId} = "products"."id"
), 0)::int`;

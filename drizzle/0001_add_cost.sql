ALTER TABLE "order_items" ADD COLUMN "unit_cost" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost" numeric(12, 2);
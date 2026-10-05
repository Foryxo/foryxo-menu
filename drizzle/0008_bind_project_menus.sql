-- Backfill only unambiguous legacy projects. Businesses with multiple menus
-- require an explicit project→menu assignment and receive no implicit QR quota.
UPDATE "projects" AS "project"
SET "menu_id" = "single_menu"."menu_id"
FROM (
  SELECT "business_id", min("id") AS "menu_id"
  FROM "menus"
  GROUP BY "business_id"
  HAVING count(*) = 1
) AS "single_menu"
WHERE "project"."business_id" = "single_menu"."business_id"
  AND "project"."menu_id" IS NULL;
--> statement-breakpoint
CREATE INDEX "project_menu_idx" ON "projects" USING btree ("menu_id");

UPDATE "price_catalog"
SET
  "default_price" = 40000,
  "customer_label_fa" = 'QR دائمی هر میز',
  "customer_label_en" = 'Permanent QR per table',
  "unit" = 'per_table'
WHERE "key" = 'addon.table_qr';

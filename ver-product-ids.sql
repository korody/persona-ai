-- Ver todos os produtos com seus IDs do Memberkit
SELECT 
  id,
  product_name,
  memberkit_product_id,
  product_url,
  memberkit_url,
  product_type
FROM avatar_products
ORDER BY product_name;

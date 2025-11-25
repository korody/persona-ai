-- Verificar TODOS os produtos que você tem registrados
SELECT 
  up.user_id,
  up.product_id,
  up.created_at,
  ap.product_name,
  ap.memberkit_url,
  ap.product_url
FROM user_products up
LEFT JOIN avatar_products ap ON ap.memberkit_product_id = up.product_id
WHERE up.user_id = (SELECT id FROM auth.users WHERE email = 'marko@persona.cx' LIMIT 1)
ORDER BY up.created_at DESC;

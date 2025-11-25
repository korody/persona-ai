-- ============================================
-- VERIFICAR SISTEMA DE MARKETING
-- ============================================

-- 1. Verificar se as funções RPC existem
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_active_campaign', 'get_recommended_products');

-- 2. Verificar produtos disponíveis
SELECT 
  id,
  product_name,
  product_type,
  product_price_brl,
  element,
  is_available,
  is_featured,
  memberkit_url,
  memberkit_product_id,
  created_at
FROM avatar_products
WHERE avatar_slug = 'mestre-ye'
ORDER BY is_featured DESC, created_at DESC;

-- 3. Contar produtos por status
SELECT 
  is_available,
  is_featured,
  COUNT(*) as total
FROM avatar_products
WHERE avatar_slug = 'mestre-ye'
GROUP BY is_available, is_featured;

-- 4. Testar função get_recommended_products
SELECT * FROM get_recommended_products('mestre-ye', NULL, 5);

-- 5. Verificar campanhas ativas
SELECT * FROM avatar_campaigns
WHERE avatar_slug = 'mestre-ye'
  AND is_active = true
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW());

-- 6. Testar função get_active_campaign
SELECT * FROM get_active_campaign('mestre-ye');

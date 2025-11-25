-- Verificar TODAS as campanhas (sem filtros)
SELECT 
  id,
  campaign_name,
  is_active,
  start_date,
  end_date,
  priority,
  avatar_slug,
  created_at
FROM avatar_campaigns
ORDER BY created_at DESC;

-- Testar a função get_active_campaign com debug
SELECT * FROM get_active_campaign('mestre-ye');

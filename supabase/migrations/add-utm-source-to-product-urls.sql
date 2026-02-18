-- Migration: Adicionar utm_source=digital-mestre-ye em todos os links de vendas
-- Data: 2026-02-18
-- Descrição: Adiciona parâmetro de rastreamento UTM em todos os URLs de produtos e campanhas

BEGIN;

-- Atualizar URLs de campanhas (avatar_campaigns)
UPDATE avatar_campaigns
SET campaign_url = CASE
  WHEN campaign_url LIKE '%qigongbrasil.com%' AND campaign_url NOT LIKE '%utm_source%'
  THEN CONCAT(campaign_url, '?utm_source=digital-mestre-ye')
  ELSE campaign_url
END
WHERE campaign_url IS NOT NULL
  AND campaign_url LIKE '%qigongbrasil.com%'
  AND campaign_url NOT LIKE '%utm_source%';

-- Atualizar URLs de produtos (avatar_products - product_url)
UPDATE avatar_products
SET product_url = CASE
  WHEN product_url LIKE '%qigongbrasil.com%' AND product_url NOT LIKE '%utm_source%'
  THEN CONCAT(product_url, '?utm_source=digital-mestre-ye')
  ELSE product_url
END
WHERE product_url IS NOT NULL
  AND product_url LIKE '%qigongbrasil.com%'
  AND product_url NOT LIKE '%utm_source%';

COMMIT;

-- Verificar as mudanças
SELECT 'Campanhas atualizadas:' as tipo, COUNT(*) as total
FROM avatar_campaigns
WHERE campaign_url LIKE '%utm_source=digital-mestre-ye%';

SELECT 'Produtos atualizados:' as tipo, COUNT(*) as total
FROM avatar_products
WHERE product_url LIKE '%utm_source=digital-mestre-ye%';

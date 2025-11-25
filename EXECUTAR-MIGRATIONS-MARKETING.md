# Migrations para Executar no Supabase Dashboard

Execute estas migrations na ordem abaixo no Supabase Dashboard > SQL Editor:

## 1. Renomear memberkit_product_id para memberkit_course_id
**Arquivo:** `supabase/migrations/rename-memberkit-product-id-to-course-id.sql`

```sql
-- Renomear memberkit_product_id para memberkit_course_id na tabela avatar_portfolio
ALTER TABLE avatar_portfolio 
RENAME COLUMN memberkit_product_id TO memberkit_course_id;

-- Atualizar índice
DROP INDEX IF EXISTS idx_avatar_portfolio_memberkit_product_id;
CREATE INDEX IF NOT EXISTS idx_avatar_portfolio_memberkit_course_id 
ON avatar_portfolio(memberkit_course_id);
```

## 2. Atualizar função get_recommended_products
**Arquivo:** `supabase/migrations/fix-marketing-functions-portfolio.sql`

Esta migration:
- ✅ Atualiza `get_recommended_products` para usar `avatar_portfolio` (não `avatar_products`)
- ✅ Atualiza para retornar `memberkit_course_id` (não `memberkit_product_id`)

## Ordem de Execução

1. **PRIMEIRO:** Execute `rename-memberkit-product-id-to-course-id.sql`
2. **SEGUNDO:** Execute `fix-marketing-functions-portfolio.sql`

## Verificação

Após executar, teste:

```sql
-- Deve retornar produtos com memberkit_course_id
SELECT * FROM get_recommended_products('mestre-ye', NULL, 10);

-- Deve mostrar a coluna memberkit_course_id
SELECT 
  product_name,
  memberkit_course_id,
  product_url
FROM avatar_portfolio
WHERE avatar_slug = 'mestre-ye'
  AND memberkit_course_id IS NOT NULL;
```

## Mudanças no Código TypeScript

✅ Já implementadas:
- `components/admin/product-manager.tsx` - usa `memberkit_course_id`
- `types/marketing.ts` - interface `AvatarProduct` atualizada
- `lib/helpers/exercise-recommendations.ts` - busca `product_url` via JOIN
- `lib/chat/build-context.ts` - passa `avatarSlug` para formatExercisesContext

## Resultado Final

Quando a IA recomendar exercícios, ela vai:
1. Identificar qual curso contém os exercícios
2. Buscar o `product_url` correspondente em `avatar_portfolio` via `memberkit_course_id`
3. Adicionar ao final da resposta: "Caso você ainda não tenha acesso a esses exercícios do [NOME DO PRODUTO], você pode adquirir através deste link: [PRODUCT_URL]. Caso tenha alguma dúvida, fale com nosso time em comercial@qigongbrasil.com"

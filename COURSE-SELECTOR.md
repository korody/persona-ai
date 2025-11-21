# Course Selector - Controle de Cursos para Recomendações

## 📋 Visão Geral

O **Course Selector** permite controlar quais cursos do Memberkit são incluídos nas recomendações do avatar. Útil para:

- Excluir cursos não relacionados a Qi Gong (playlists, vídeos teóricos, etc.)
- Focar recomendações em cursos de prática
- Melhorar precisão das recomendações do avatar
- Gerenciar quais exercícios aparecem na busca semântica

## 🎯 Funcionalidades

- ✅ Visualizar todos os cursos com estatísticas (total, categorizados, com embeddings)
- ✅ Habilitar/desabilitar cursos individualmente com toggle switch
- ✅ Atualizações em tempo real com UI otimista
- ✅ Filtro automático na busca semântica (apenas cursos habilitados)
- ✅ Resumo: X/Y cursos habilitados, X/Y exercícios ativos

## 📂 Arquivos Criados

### Componentes
- `components/admin/course-selector.tsx` - Interface visual com tabela e switches
- Integrado em `components/admin/sync-dashboard.tsx`

### API Routes
- `app/api/admin/memberkit/courses/route.ts` - GET lista de cursos com stats
- `app/api/admin/memberkit/courses/toggle/route.ts` - POST habilitar/desabilitar curso

### Migrações
- `supabase/migrations/add-enabled-column.sql` - Adiciona coluna `enabled BOOLEAN`
- `supabase/migrations/20241204_update_match_exercises_enabled.sql` - Atualiza `match_exercises()`

### Helpers
- `lib/helpers/exercise-recommendations.ts` - Atualizado com filtro `.eq('enabled', true)`

### Scripts
- `scripts/apply-migrations.ts` - Testa se migrações foram aplicadas

## 🚀 Como Aplicar as Migrações

### Opção 1: Dashboard do Supabase (Recomendado)

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Crie uma **New query**

#### Migração 1: Adicionar coluna `enabled`

Cole e execute:
```sql
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_exercises_enabled ON exercises(enabled);
UPDATE exercises SET enabled = true WHERE enabled IS NULL;
COMMENT ON COLUMN exercises.enabled IS 'Whether this exercise should be included in avatar recommendations';
```

#### Migração 2: Atualizar função `match_exercises`

Cole e execute:
```sql
CREATE OR REPLACE FUNCTION match_exercises(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  memberkit_course_id text,
  memberkit_course_slug text,
  memberkit_section_id text,
  memberkit_lesson_id text,
  title text,
  description text,
  url text,
  exercise_position integer,
  duration_minutes integer,
  level text,
  element text,
  organs text[],
  benefits text[],
  indications text[],
  contraindications text[],
  tags text[],
  is_active boolean,
  enabled boolean,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.memberkit_course_id,
    e.memberkit_course_slug,
    e.memberkit_section_id,
    e.memberkit_lesson_id,
    e.title,
    e.description,
    e.url,
    e."position" as exercise_position,
    e.duration_minutes,
    e.level,
    e.element,
    e.organs,
    e.benefits,
    e.indications,
    e.contraindications,
    e.tags,
    e.is_active,
    e.enabled,
    e.created_at,
    e.updated_at,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM exercises e
  WHERE 
    e.embedding IS NOT NULL
    AND e.is_active = true
    AND e.enabled = true
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_exercises IS 'Busca semântica de exercícios usando embeddings OpenAI. Retorna apenas exercícios de cursos habilitados (enabled=true) e ativos (is_active=true).';
```

### Opção 2: Linha de Comando (Supabase CLI)

Se tiver o Supabase CLI instalado:

```bash
supabase db push
```

Isso aplicará todas as migrações da pasta `supabase/migrations/`.

## ✅ Verificar se Funcionou

Execute o script de teste:

```bash
pnpm test-migrations
```

Você deve ver:
```
✅ Coluna enabled existe!
✅ Exercícios habilitados: 404
✅ Exercícios desabilitados: 0
✅ Função match_exercises funcionando!
```

## 🎨 Como Usar a Interface

1. Acesse `/admin/avatars/mestre-ye/train`
2. Clique na aba **Memberkit** (4ª aba)
3. Role até a seção **Course Selector**
4. Veja a lista de todos os cursos com:
   - Switch para habilitar/desabilitar
   - Total de exercícios
   - Quantos estão categorizados
   - Quantos têm embeddings
   - Barra de progresso

### Exemplo de Uso

**Cenário**: Você quer excluir cursos de "Playlists" e "Teoria" das recomendações:

1. Localize o curso "Playlists Qi Gong" na tabela
2. Clique no switch para desabilitá-lo (toggle off)
3. Repita para "Teoria e Filosofia"
4. ✅ Agora esses exercícios não aparecerão mais nas recomendações!

O avatar irá recomendar apenas exercícios de cursos habilitados.

## 🔧 Como Funciona (Técnico)

### Fluxo de Dados

```
1. User clica no switch
   ↓
2. CourseSelector atualiza UI (otimista)
   ↓
3. POST /api/admin/memberkit/courses/toggle
   ↓
4. UPDATE exercises SET enabled = false WHERE memberkit_course_slug = 'curso-x'
   ↓
5. Busca semântica usa WHERE enabled = true
```

### Busca Semântica (Avatar)

Quando o usuário pergunta algo, o sistema:

1. Gera embedding da pergunta
2. Chama `match_exercises(embedding)`
3. Função SQL filtra:
   - `embedding IS NOT NULL` (tem que estar categorizado)
   - `is_active = true` (exercício ativo)
   - `enabled = true` ⬅️ **NOVO: apenas cursos habilitados**
4. Retorna top 3-5 exercícios mais relevantes

### Estrutura de Dados

**Tabela: exercises**
```sql
id                    uuid
title                 text
memberkit_course_slug text
enabled               boolean  -- NOVO
is_active             boolean
embedding             vector(1536)
duration_minutes      integer
level                 text
element               text
... outros campos
```

**Índice criado:**
```sql
idx_exercises_enabled ON exercises(enabled)
```

Isso torna queries com `WHERE enabled = true` muito rápidas.

## 📊 Estatísticas do Course Selector

O componente mostra em tempo real:

- **Cursos Habilitados**: Quantos cursos estão ativos
- **Exercícios Ativos**: Quantos exercícios no total dos cursos habilitados
- **Por curso**:
  - Total de exercícios
  - Categorizados (com metadata)
  - Com embeddings (prontos para busca semântica)
  - % de progresso

## 🐛 Troubleshooting

### "Column 'enabled' does not exist"

➡️ Migração 1 não foi aplicada. Execute manualmente no SQL Editor.

### "Function match_exercises returned wrong type"

➡️ Migração 2 não foi aplicada. A função precisa retornar a coluna `enabled`.

### Cursos desabilitados ainda aparecem

➡️ Cache do frontend. Faça hard refresh (Ctrl+Shift+R) ou limpe cache do navegador.

### Switch não atualiza

➡️ Verifique o console do navegador. Pode ser erro de permissão ou network.

## 🎯 Próximos Passos (Sugestões)

- [ ] Adicionar botões "Selecionar Todos" / "Deselecionar Todos"
- [ ] Filtrar cursos por nome (search box)
- [ ] Exportar/importar configuração de cursos (JSON)
- [ ] Habilitar/desabilitar exercícios individualmente (granular)
- [ ] Analytics: quais cursos são mais recomendados
- [ ] Preview: ver quais exercícios serão desabilitados antes de confirmar

## 📝 Notas de Desenvolvimento

- Coluna `enabled` tem **default true** para compatibilidade retroativa
- Todos os 404 exercícios já existentes ficam `enabled = true` automaticamente
- `CourseSelector` usa **optimistic UI** para melhor UX
- Em caso de erro na API, state é revertido (rollback)
- Toasts do Sonner mostram feedback visual

## 🔗 Links Relacionados

- [Memberkit Sync Tab](components/admin/memberkit-sync-tab.tsx)
- [Exercise Recommendations Helper](lib/helpers/exercise-recommendations.ts)
- [Match Exercises Function](supabase/migrations/20241120_create_match_exercises_function.sql)

---

**Status**: ✅ Feature completa, aguardando aplicação das migrações
**Criado em**: 04/12/2024
**Versão**: 1.0.0

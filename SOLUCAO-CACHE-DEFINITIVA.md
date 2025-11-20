# 🔧 Solução Definitiva: Recriar Tabelas via Dashboard

## Problema Identificado
O Supabase PostgREST não reconhece tabelas criadas via SQL Editor direto. As tabelas existem no PostgreSQL mas não aparecem no cache da API.

## ✅ Solução que FUNCIONA

### Passo 1: Criar tabela principal via Table Editor
1. Acesse: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/editor
2. Clique em **"New table"** (botão verde)
3. Configure:
   - **Name:** `avatar_knowledge_base`
   - **Description:** "Knowledge base for avatar training"
   - Enable RLS: ✅ SIM

### Passo 2: Adicionar colunas manualmente
Clique em "Add column" para cada coluna:

| Column Name | Type | Default | Nullable | Primary | Foreign Key |
|------------|------|---------|----------|---------|-------------|
| id | uuid | gen_random_uuid() | ❌ No | ✅ Yes | - |
| avatar_id | uuid | - | ❌ No | ❌ No | avatars.id |
| title | text | - | ❌ No | ❌ No | - |
| content | text | - | ❌ No | ❌ No | - |
| content_type | text | 'article' | ❌ No | ❌ No | - |
| tags | text[] | ARRAY[]::text[] | ✅ Yes | ❌ No | - |
| embedding | vector(1536) | - | ✅ Yes | ❌ No | - |
| is_active | boolean | true | ❌ No | ❌ No | - |
| created_at | timestamptz | now() | ❌ No | ❌ No | - |
| updated_at | timestamptz | now() | ❌ No | ❌ No | - |
| created_by | uuid | - | ❌ No | ❌ No | auth.users.id |

**⚠️ IMPORTANTE:** O tipo `vector(1536)` só funciona se a extensão `pgvector` estiver habilitada.

### Passo 3: Habilitar pgvector (se necessário)
1. Acesse: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/database/extensions
2. Procure por "vector"
3. Se não estiver habilitada, clique em "Enable"
4. Aguarde 30 segundos

### Passo 4: Configurar RLS Policies
No SQL Editor, execute:

```sql
-- Policy para service_role ter acesso total
CREATE POLICY "Service role has full access to avatar_knowledge_base"
ON avatar_knowledge_base
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy para usuários autenticados lerem conhecimento ativo
CREATE POLICY "Authenticated users can read active knowledge"
ON avatar_knowledge_base
FOR SELECT
TO authenticated
USING (is_active = true);
```

### Passo 5: Testar acesso via API
Execute:
```bash
npx tsx --env-file=.env.local scripts/diagnose-supabase.ts
```

Deve mostrar:
```
✅ avatar_knowledge_base: Acessível
```

---

## 🚀 Alternativa RÁPIDA: Usar API do Supabase Management

Se criar via UI for muito trabalhoso, podemos usar a Management API para forçar reload:

```bash
curl -X POST 'https://api.supabase.com/v1/projects/kfkhdfnkwhljhhjcvbqp/database/reload-schema' \
  -H 'Authorization: Bearer SEU_ACCESS_TOKEN_AQUI'
```

**Problema:** Requer Personal Access Token que você precisa gerar em:
https://supabase.com/dashboard/account/tokens

---

## 🤔 Por que isso acontece?

O Supabase tem **2 camadas separadas:**
1. **PostgreSQL** - Banco de dados real (onde as tabelas EXISTEM)
2. **PostgREST API** - Camada REST com cache (que NÃO VÊ as tabelas)

Quando você cria tabelas via:
- ✅ **Table Editor (UI)** → PostgREST é notificado automaticamente
- ❌ **SQL Editor** → PostgREST NÃO é notificado (cache não atualiza)

## 📝 Recomendação

**Opção A (Recomendada):** Recr tabela via Table Editor do Dashboard
- Mais trabalhoso
- 100% garantido de funcionar
- Supabase gerencia tudo automaticamente

**Opção B:** Aguardar mais tempo (pode levar 24-48h)
- Sem esforço
- Incerto quando vai funcionar
- Não recomendado para produção

**Opção C:** Deletar e recriar via migration oficial
- Usar `supabase migration new create_knowledge_tables`
- Aplicar via CLI
- Mais profissional mas requer setup do CLI local

# ⚠️ MIGRAÇÃO PARA PROJETO QUIZ-MTC-MESTREYE

## 📋 PASSOS NECESSÁRIOS

### 1. Obter Credenciais do Projeto Quiz

Acesse: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/settings/api

Copie:
- **Project URL**: https://kfkhdfnkwhljhhjcvbqp.supabase.co
- **anon/public key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- **service_role key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### 2. Atualizar .env.local

Substituir as credenciais do persona-ai pelas do quiz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kfkhdfnkwhljhhjcvbqp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<COLE AQUI A ANON KEY DO QUIZ>
SUPABASE_SERVICE_ROLE_KEY=<COLE AQUI A SERVICE ROLE KEY DO QUIZ>
```

### 3. Executar Migration no Supabase

1. Acesse: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/sql
2. Abra: `supabase/migrations/complete-avatar-training-schema.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em RUN

### 4. Instalar Dependências

```bash
pnpm add pdf-parse mammoth langchain @langchain/textsplitters
pnpm add -D @types/pdf-parse
```

### 5. Estrutura Criada

O schema SQL criará:

**Tabelas:**
- ✅ `avatar_knowledge_base` - Documentos e materiais
- ✅ `knowledge_chunks` - Chunks com embeddings (RAG)
- ✅ `avatar_conversation_examples` - Exemplos few-shot
- ✅ `avatar_prompt_versions` - Versões do prompt
- ✅ `user_memory` - Memória sobre cada usuário
- ✅ `user_communication_preferences` - Preferências de resposta
- ✅ `conversation_feedback` - Avaliações (thumbs up/down)
- ✅ `learned_patterns` - Aprendizado coletivo
- ✅ `highlighted_conversations` - Conversas importantes

**Funções:**
- ✅ `search_knowledge()` - Busca vetorial (RAG)
- ✅ `update_updated_at_column()` - Trigger para timestamps

**Índices:**
- ✅ ivfflat para busca vetorial otimizada
- ✅ GIN para arrays (tags)
- ✅ B-tree para FK e filtros

### 6. Próximos Passos

Após executar a migration:

1. ✅ Criar biblioteca RAG (`lib/rag/`)
2. ✅ Criar API routes (`app/api/avatar-training/`)
3. ✅ Criar interface admin (`app/admin/avatars/[slug]/train/`)
4. ✅ Integrar com chat existente

## 🎯 Por que quiz-mtc-mestreye?

**Benefícios:**
- ✅ `quiz_leads` já está lá (integração direta)
- ✅ `whatsapp_logs` para histórico
- ✅ Centralização de dados
- ✅ Menos complexidade de sincronização

**Estrutura Final:**
```
quiz-mtc-mestreye (kfkhdfnkwhljhhjcvbqp)
├── Quiz Leads ---------> Integração com Persona
├── WhatsApp Logs ------> Histórico de conversas
├── Avatars ------------> Mestre Ye + futuros
├── Conversations ------> Chat do Persona
├── Messages -----------> Histórico
├── Knowledge Base -----> RAG System
├── User Memory --------> Personalização
└── Subscription Plans -> Billing
```

## ⚠️ IMPORTANTE

Após fazer a migração, vou precisar:
- Copiar os 3 knowledge entries do persona-ai para o quiz
- Atualizar todos os scripts de teste
- Testar RAG no projeto correto
- Verificar se subscription_plans precisa ser recriado

---

**Cole as credenciais do projeto quiz aqui para eu atualizar tudo automaticamente:**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

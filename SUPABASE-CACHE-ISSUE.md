# 🔧 Problema de Cache do Supabase - Avatar Knowledge Base

## 🚨 Situação Atual

As tabelas do sistema de aprendizado foram criadas com sucesso no banco de dados PostgreSQL, mas a **API PostgREST do Supabase não reconhece essas tabelas** devido ao cache do schema.

### Erro Observado:
```
Error: Could not find the table 'public.avatar_knowledge_base' in the schema cache
Code: PGRST205
```

### O que funciona:
✅ Tabelas existem no banco (confirmado via SQL direto)
✅ Inserção manual via SQL funciona perfeitamente
✅ Estrutura do RAG está implementada corretamente

### O que não funciona:
❌ Supabase JS Client não consegue acessar as tabelas
❌ Busca RAG via API retorna erro PGRST205
❌ Admin APIs de knowledge não funcionam

---

## 🔄 Soluções (em ordem de preferência)

### Solução 1: Reiniciar Projeto Supabase ⭐ RECOMENDADO
**Mais rápida e efetiva**

1. Acesse: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/settings/general
2. Role até "Danger Zone"
3. Clique em **"Pause project"**
4. Aguarde ~30 segundos
5. Clique em **"Resume project"**
6. Aguarde 1-2 minutos para o projeto reiniciar
7. **Teste**: Execute `npx tsx --env-file=.env.local scripts/test-rag.ts`

### Solução 2: Aguardar Propagação Natural ⏰
**Requer paciência**

- O cache pode atualizar automaticamente em **2-6 horas**
- Não requer ação, mas é lento
- Verifique periodicamente executando o teste RAG

### Solução 3: Recriar Schema via Dashboard UI 🎨
**Alternativa se Solução 1 não funcionar**

1. Acesse: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/editor
2. No SQL Editor, execute:
```sql
-- Apagar tabelas problemáticas
DROP TABLE IF EXISTS avatar_knowledge_base CASCADE;
DROP TABLE IF EXISTS avatar_conversation_examples CASCADE;
DROP TABLE IF EXISTS avatar_prompt_versions CASCADE;
DROP TABLE IF EXISTS user_memory CASCADE;
DROP TABLE IF EXISTS user_communication_preferences CASCADE;
DROP TABLE IF EXISTS conversation_feedback CASCADE;
DROP TABLE IF EXISTS learned_patterns CASCADE;
DROP TABLE IF EXISTS highlighted_conversations CASCADE;
DROP FUNCTION IF EXISTS match_knowledge CASCADE;
```

3. Aguarde 30 segundos
4. Execute novamente todo o conteúdo de `avatar-learning-schema.sql`
5. Teste com: `npx tsx --env-file=.env.local scripts/test-rag.ts`

### Solução 4: Upgrade para Supabase Pro + Connection Pooler 💰
**Solução permanente para projetos grandes**

- Permite conexão PostgreSQL direta (bypass da API REST)
- Requer upgrade do plano (US$ 25/mês)
- Implementação via `pg` ou `postgres.js`

---

## ✅ Como Verificar se o Problema Foi Resolvido

Execute o teste RAG:
```bash
npx tsx --env-file=.env.local scripts/test-rag.ts
```

**Sucesso:**
```
✅ Avatar found: Mestre Ye
✅ Adding knowledge about back pain...
✅ Knowledge added with ID: xxx-xxx-xxx
✅ Searching for similar content...
✅ Found 1 results with similarity > 0.7
```

**Ainda com problema:**
```
❌ Error: Could not find the table 'public.avatar_knowledge_base' in the schema cache
```

---

## 🔓 Reabilitando o RAG Após Resolução

Quando o cache estiver atualizado, edite `app/api/chat/route.ts`:

```typescript
// ANTES (desabilitado):
console.log('RAG temporarily disabled - waiting for Supabase cache refresh')
const relevantKnowledge: any[] = []
const knowledgeContext = ''

// DEPOIS (reabilitado):
console.log('Searching knowledge base...')
const relevantKnowledge = await searchKnowledge(userContent, avatar.id, {
  matchThreshold: 0.75,
  matchCount: 3
})
const knowledgeContext = formatKnowledgeContext(relevantKnowledge)
```

---

## 📝 Contexto Técnico

### Por que isso acontece?
O Supabase usa **PostgREST** para expor o banco PostgreSQL como API REST. O PostgREST mantém um **cache do schema** em memória para performance. Quando criamos tabelas via SQL direto (fora do Dashboard UI), o cache não é atualizado automaticamente.

### Por que a solução de "reload schema" não funcionou?
```sql
NOTIFY pgrst, 'reload schema';
```
Este comando funciona apenas quando você tem acesso direto ao processo PostgREST, mas no Supabase Cloud, esse processo é gerenciado internamente.

### Arquivos Relacionados
- `avatar-learning-schema.sql` - Schema completo das tabelas
- `lib/ai/rag.ts` - Implementação do sistema RAG
- `app/api/chat/route.ts` - Integração RAG no chat
- `scripts/test-rag.ts` - Script de teste
- `supabase-rag-function.sql` - Função de busca vetorial

---

## 🎯 Próximos Passos

1. **Escolha uma solução** (recomendo #1: Pausar/Resumir projeto)
2. **Teste** com o script de teste RAG
3. **Reabilite** o código do RAG em `app/api/chat/route.ts`
4. **Verifique** no chat que o Mestre Ye usa conhecimento da base
5. **Prossiga** com tarefas pendentes:
   - Sistema de memória de usuário
   - Sistema de feedback e aprendizado coletivo
   - População da knowledge base via admin UI

---

## 📞 Suporte

Se o problema persistir após todas as soluções:
- Supabase Discord: https://discord.supabase.com
- Supabase Docs: https://supabase.com/docs/guides/api#reloading-the-schema-cache

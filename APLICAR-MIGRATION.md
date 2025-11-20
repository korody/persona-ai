# 🚀 Como Aplicar a Migration

## Método 1: Via SQL Editor (RECOMENDADO - Mais Simples)

1. **Acesse o SQL Editor:**
   https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/sql/new

2. **Copie o conteúdo do arquivo:**
   `supabase/migrations/20251115_create_avatar_learning_tables.sql`

3. **Cole no SQL Editor e clique em "Run"**

4. **Aguarde a execução** (~5-10 segundos)

5. **Verifique se funcionou:**
   - Execute: `npx tsx --env-file=.env.local scripts/diagnose-supabase.ts`
   - Deve mostrar: `✅ avatar_knowledge_base: Acessível`

---

## Método 2: Via Supabase CLI (SE quiser instalar o CLI)

### Instalar Scoop (gerenciador de pacotes do Windows):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### Instalar Supabase CLI:
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Linkar ao projeto:
```powershell
supabase link --project-ref kfkhdfnkwhljhhjcvbqp
```

### Aplicar migration:
```powershell
supabase db push
```

---

## ✅ Verificação Pós-Migration

Execute o diagnóstico:
```bash
npx tsx --env-file=.env.local scripts/diagnose-supabase.ts
```

**Sucesso esperado:**
```
✅ avatars: Acessível
✅ avatar_knowledge_base: Acessível
✅ avatar_conversation_examples: Acessível
✅ avatar_prompt_versions: Acessível
✅ user_memory: Acessível
✅ conversation_feedback: Acessível
✅ learned_patterns: Acessível
✅ conversations: Acessível
✅ messages: Acessível
```

---

## 🎯 Próximos Passos Após Migration Funcionar

1. **Reabilitar RAG** em `app/api/chat/route.ts`
2. **Popular conhecimento** com o script de teste
3. **Testar no chat** perguntando sobre dor nas costas
4. **Verificar logs** mostrando "Found X relevant knowledge items"

---

## 📝 Recomendação

**USE O MÉTODO 1** (SQL Editor) - é mais rápido e garante que o PostgREST será notificado quando você criar as tabelas através do Dashboard.

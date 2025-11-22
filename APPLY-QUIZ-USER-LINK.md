# 🔗 APLICAR VINCULAÇÃO QUIZ → USUÁRIO

## ✅ O que foi implementado

### 1. **Migration SQL** (`supabase/migrations/add-user-id-to-quiz-leads.sql`)
- ✅ Adiciona campo `user_id` na tabela `quiz_leads`
- ✅ Cria índices otimizados (user_id, email, telefone)
- ✅ Trigger automático para vincular quiz no signup (prioridade: telefone → email)
- ✅ Função helper `get_user_quiz_lead(user_id)` para busca otimizada

### 2. **Lógica no Chat** (`app/api/chat/route.ts`)
- ✅ Busca híbrida: user_id → telefone → email
- ✅ Vinculação automática no primeiro acesso
- ✅ Logs para debug de vinculação

### 3. **Helper de Normalização** (`lib/helpers/phone-normalizer.ts`)
- ✅ Normalização de telefones (remove formatação, adiciona +55)
- ✅ Geração de variações para busca flexível
- ✅ Validação de formato brasileiro

---

## 🚀 PASSO A PASSO PARA APLICAR

### **1. Aplicar Migration no Supabase**

1. Acesse: [Supabase SQL Editor](https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql)
2. Cole o conteúdo do arquivo: `supabase/migrations/add-user-id-to-quiz-leads.sql`
3. Clique em **Run** (Execute)

**Verificar se aplicou:**
```sql
-- Ver estrutura da tabela quiz_leads
\d quiz_leads

-- Ver índices criados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'quiz_leads';

-- Ver triggers
SELECT tgname, tgtype, tgisinternal 
FROM pg_trigger 
WHERE tgrelid = 'quiz_leads'::regclass;
```

---

### **2. (OPCIONAL) Vincular Dados Históricos**

Se você tem usuários já cadastrados e quizzes não vinculados, rode:

```sql
-- Ver quantos seriam vinculados
SELECT COUNT(*) as total_a_vincular
FROM quiz_leads ql
JOIN auth.users u ON (
  (u.phone IS NOT NULL AND ql.telefone = u.phone)
  OR (ql.email = u.email)
)
WHERE ql.user_id IS NULL;

-- Aplicar vinculação
UPDATE quiz_leads ql
SET user_id = u.id,
    updated_at = NOW()
FROM auth.users u
WHERE ql.user_id IS NULL
  AND (
    (u.phone IS NOT NULL AND ql.telefone = u.phone) -- Prioridade 1: telefone
    OR (ql.email = u.email) -- Prioridade 2: email
  );

-- Confirmar
SELECT 
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as vinculados,
  COUNT(*) FILTER (WHERE user_id IS NULL) as nao_vinculados
FROM quiz_leads;
```

---

### **3. Testar a Vinculação**

#### **Teste 1: Novo Cadastro (Trigger Automático)**
```sql
-- Criar usuário de teste (será vinculado automaticamente pelo trigger)
-- Certifique-se de ter um quiz_leads com o mesmo email/telefone antes

-- Verificar vinculação após signup
SELECT 
  u.id as user_id,
  u.email,
  u.phone,
  ql.id as quiz_id,
  ql.elemento_principal,
  ql.user_id as quiz_vinculado_a
FROM auth.users u
LEFT JOIN quiz_leads ql ON ql.user_id = u.id
WHERE u.email = 'teste@example.com';
```

#### **Teste 2: Chat API (Vinculação On-Demand)**
```sql
-- Criar quiz sem vínculo
INSERT INTO quiz_leads (email, nome, telefone, elemento_principal, diagnostico_resumo)
VALUES ('marko@persona.cx', 'Marko Teste', '5511987654321', 'FOGO', 'Teste de vinculação');

-- Agora envie mensagem no chat
-- O código vai buscar por user_id → telefone → email e vincular automaticamente

-- Verificar vinculação após enviar mensagem
SELECT * FROM quiz_leads WHERE email = 'marko@persona.cx';
```

---

## 🎯 COMO FUNCIONA AGORA

### **Fluxo 1: Usuário faz Quiz ANTES de se cadastrar**
1. Quiz criado → `quiz_leads` (user_id = NULL)
2. Usuário se cadastra → Trigger `link_quiz_to_new_user()` busca por telefone/email
3. Quiz vinculado automaticamente → `quiz_leads.user_id` = novo user_id
4. Chat usa diagnóstico imediatamente

### **Fluxo 2: Usuário faz Quiz DEPOIS de se cadastrar**
1. Usuário cadastrado → `auth.users`
2. Quiz criado → `quiz_leads` (user_id = NULL)
3. Primeiro acesso ao chat → API busca por email/telefone e vincula
4. Chat usa diagnóstico

### **Fluxo 3: Usuário muda de email**
1. Quiz já vinculado por `user_id` → continua funcionando ✅
2. Não depende mais apenas de email

---

## 📊 QUERIES ÚTEIS

### Ver status de vinculação
```sql
SELECT 
  COUNT(*) as total_quizzes,
  COUNT(user_id) as vinculados,
  COUNT(*) - COUNT(user_id) as nao_vinculados
FROM quiz_leads;
```

### Ver quizzes de um usuário
```sql
SELECT * FROM get_user_quiz_lead('user-uuid-aqui');
```

### Ver usuários sem quiz
```sql
SELECT u.id, u.email, u.phone
FROM auth.users u
LEFT JOIN quiz_leads ql ON ql.user_id = u.id
WHERE ql.id IS NULL;
```

### Ver quizzes sem usuário
```sql
SELECT id, email, telefone, elemento_principal, created_at
FROM quiz_leads
WHERE user_id IS NULL
ORDER BY created_at DESC;
```

---

## ✅ VALIDAÇÃO FINAL

Depois de aplicar, execute:

```sql
-- 1. Verificar se coluna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_leads' AND column_name = 'user_id';

-- 2. Verificar se trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'on_user_created_link_quiz';

-- 3. Verificar se função existe
SELECT proname FROM pg_proc WHERE proname = 'link_quiz_to_new_user';

-- 4. Contar vinculações
SELECT 
  CASE 
    WHEN user_id IS NOT NULL THEN 'Vinculado'
    ELSE 'Não vinculado'
  END as status,
  COUNT(*) as total
FROM quiz_leads
GROUP BY status;
```

---

## 🔧 TROUBLESHOOTING

### Problema: Trigger não está funcionando
```sql
-- Re-criar trigger
DROP TRIGGER IF EXISTS on_user_created_link_quiz ON auth.users;
CREATE TRIGGER on_user_created_link_quiz
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_quiz_to_new_user();
```

### Problema: Telefones não estão dando match
- Verifique formato no banco: `SELECT DISTINCT telefone FROM quiz_leads LIMIT 10;`
- Compare com auth.users: `SELECT DISTINCT phone FROM auth.users LIMIT 10;`
- Use normalização se necessário

### Problema: Múltiplos quizzes vinculados ao mesmo usuário
```sql
-- Ver duplicatas
SELECT user_id, COUNT(*) as total
FROM quiz_leads
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Manter apenas o mais recente (se quiser)
DELETE FROM quiz_leads
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM quiz_leads
    WHERE user_id IS NOT NULL
  ) t WHERE rn > 1
);
```

---

## 🎉 PRONTO!

Agora o sistema está com vinculação sólida:
- ✅ Prioridade: telefone > email
- ✅ Trigger automático no signup
- ✅ Fallback no primeiro acesso ao chat
- ✅ Resistente a mudanças de email
- ✅ Performance otimizada com índices

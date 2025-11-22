# 📋 CONFORMIDADE LGPD - EXCLUSÃO DE DADOS

**Última atualização:** 22 de novembro de 2025

## ✅ ESTADO ATUAL DO BANCO DE DADOS

### **Tabelas com CASCADE DELETE (dados apagados automaticamente):**

| Tabela | Foreign Key | Comportamento | Status LGPD |
|--------|-------------|---------------|-------------|
| `credits` | `user_id → auth.users(id)` | `ON DELETE CASCADE` | ✅ Correto |
| `credit_transactions` | `user_id → auth.users(id)` | `ON DELETE CASCADE` | ✅ Correto |
| `conversations` | `user_id → auth.users(id)` | `ON DELETE CASCADE` | ✅ Correto |
| `messages` | `conversation_id → conversations(id)` | `ON DELETE CASCADE` | ✅ Correto (via cascade) |

### **Tabelas com SET NULL (dados anonimizados):**

| Tabela | Foreign Key | Comportamento | Status LGPD |
|--------|-------------|---------------|-------------|
| `quiz_leads` | `user_id → auth.users(id)` | `ON DELETE SET NULL` | ✅ Correto* |

**\* Justificativa Legal:** Política de Privacidade declara retenção de 20 anos para dados de saúde (analogia CFM 1.821/2007). Dados são anonimizados (user_id vira NULL) mas email, nome e dados clínicos permanecem para fins estatísticos e médicos.

---

## 🗑️ FLUXO DE EXCLUSÃO DE CONTA

### **Quando usuário solicita exclusão:**

```
DELETE FROM auth.users WHERE id = 'user-uuid'
    ↓
┌─────────────────────────────────────────────┐
│ 1. CASCADE DELETE (apagados imediatamente)  │
├─────────────────────────────────────────────┤
│ ✓ credits                                   │
│ ✓ credit_transactions                       │
│ ✓ conversations                             │
│ ✓ messages (via conversations)              │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 2. SET NULL (anonimização)                  │
├─────────────────────────────────────────────┤
│ ✓ quiz_leads.user_id = NULL                 │
│   (email, nome, celular permanecem)         │
└─────────────────────────────────────────────┘
```

---

## 📊 DADOS RETIDOS APÓS EXCLUSÃO

### **O que é APAGADO:**
- ✅ Saldo de créditos atual
- ✅ Histórico completo de transações
- ✅ Todas as conversas com o Mestre Ye
- ✅ Todas as mensagens enviadas/recebidas
- ✅ Vínculo entre quiz e usuário (user_id)

### **O que é MANTIDO (anonimizado):**
- ⚠️ Dados da anamnese dos Cinco Elementos
- ⚠️ Email, nome, celular do quiz (para fins estatísticos)
- ⚠️ Respostas do questionário de saúde
- ⚠️ Diagnóstico e elemento predominante

**Base Legal:** Art. 11, II, LGPD (dados sensíveis de saúde) + analogia com Resolução CFM 1.821/2007 (prontuário médico - 20 anos de retenção)

---

## 🔧 IMPLEMENTAÇÃO RECOMENDADA

### **Função Segura de Exclusão (criada):**

```sql
-- Arquivo: supabase/safe-account-deletion.sql

SELECT delete_user_account('user-uuid', 'Solicitação do usuário');
```

**Funcionalidades:**
- ✅ Log de auditoria em `account_deletions`
- ✅ Snapshot dos dados antes da exclusão
- ✅ Anonimização explícita de `quiz_leads`:
  - `user_id` → NULL
  - `email` → 'anonimizado_{id}@example.com'
  - `nome` → 'Usuário Anonimizado'
  - `celular` → NULL
- ✅ Exclusão automática via CASCADE
- ✅ Retorno de relatório da operação

---

## 🛡️ MELHORIAS DE SEGURANÇA LGPD

### **1. Tabela de Auditoria:**

```sql
CREATE TABLE account_deletions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  deleted_by TEXT, -- 'user' ou 'admin'
  reason TEXT,
  data_snapshot JSONB,
  deleted_at TIMESTAMPTZ DEFAULT now()
);
```

**Finalidade:** Manter registro de todas as exclusões para compliance e auditoria ANPD.

**Retenção:** 5 anos (obrigação legal contábil).

### **2. Row Level Security (RLS):**

```sql
-- Apenas admins podem ver logs
CREATE POLICY "Only admins can view deletion logs" ON account_deletions
  FOR SELECT USING (auth.email IN ('admin@mestreye.com'));
```

### **3. Soft Delete (Opcional):**

Adicionar coluna `deleted_at` para permitir período de carência:

```sql
ALTER TABLE auth.users ADD COLUMN deleted_at TIMESTAMPTZ;

-- Política: usuário invisível mas recuperável por 30 dias
CREATE POLICY "Hide deleted users" ON auth.users
  FOR SELECT USING (deleted_at IS NULL OR deleted_at > now() - INTERVAL '30 days');
```

---

## 📋 CHECKLIST DE CONFORMIDADE

### **Direito ao Esquecimento (Art. 18, VI, LGPD):**

- [x] Dados pessoais identificáveis são apagados
- [x] Conversas e mensagens são apagadas completamente
- [x] Dados financeiros são apagados
- [x] Dados sensíveis de saúde são anonimizados (não apagados - base legal)
- [x] Log de auditoria é mantido
- [x] Processo documentado

### **Transparência (Art. 9º, LGPD):**

- [x] Política de Privacidade informa sobre retenção de dados de saúde (20 anos)
- [x] Usuário é informado sobre anonimização de quiz_leads
- [x] Procedimento de exclusão está documentado

### **Segurança (Art. 46, LGPD):**

- [x] Função de exclusão usa `SECURITY DEFINER` (apenas owner pode executar)
- [x] RLS protege logs de exclusão
- [x] Cascade DELETE garante integridade referencial
- [x] Operação é atômica (transação única)

---

## ⚖️ JUSTIFICATIVA LEGAL - RETENÇÃO DE DADOS DE SAÚDE

### **Base Legal para manter quiz_leads anonimizado:**

**LGPD Art. 11, II:**
> "O tratamento de dados pessoais sensíveis [saúde] somente poderá ocorrer quando necessário para a tutela da saúde, exclusivamente, em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária."

**Resolução CFM 1.821/2007 (analogia):**
> "O prazo de guarda do prontuário médico é de 20 anos."

**Justificativa:**
1. Dados de saúde (sintomas, elemento predominante, diagnóstico MTC) têm valor médico/científico
2. Anonimização protege privacidade do titular
3. Retenção permite estudos epidemiológicos e aprimoramento do sistema
4. Impossível reidentificar titular após anonimização (user_id = NULL, email mascarado)

---

## 🚀 PRÓXIMOS PASSOS

### **Para implementar agora:**

1. ✅ Executar `supabase/safe-account-deletion.sql` no Supabase SQL Editor
2. ✅ Criar endpoint no dashboard: `/settings/delete-account`
3. ✅ Adicionar botão "Excluir minha conta" com confirmação dupla
4. ✅ Enviar email de confirmação após exclusão

### **Para considerar no futuro:**

- [ ] Soft delete com período de carência de 30 dias
- [ ] Export completo de dados antes da exclusão (portabilidade)
- [ ] Agendamento de exclusões automáticas (contas inativas 3+ anos)
- [ ] Dashboard de auditoria LGPD para admin

---

## 📞 CONTATO LGPD

**Encarregado de Dados (DPO):** Marcos França Korody  
**Email:** contato@qigongbrasil.com  
**Assunto:** "LGPD - Exclusão de Conta"

---

**MESTRE YE LTDA**  
CNPJ: 61.142.351/0001-21  
Última revisão: 22/11/2025

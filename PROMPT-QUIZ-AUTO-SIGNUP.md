# 🔐 IMPLEMENTAR AUTO-SIGNUP NO QUIZ

## 📋 CONTEXTO

Atualmente o quiz salva os dados do lead no `quiz_leads`, mas o usuário precisa se cadastrar manualmente depois no Persona-AI. Queremos **eliminar essa fricção** criando o usuário automaticamente durante o quiz.

## 🎯 OBJETIVO

Quando o usuário finaliza o quiz, queremos:
1. ✅ Criar usuário automaticamente no `auth.users` (Supabase)
2. ✅ Salvar `quiz_leads` já com `user_id` vinculado
3. ✅ Redirecionar para o chat **já autenticado**
4. ✅ Evitar duplicação (verificar se email já existe)

---

## 🔧 IMPLEMENTAÇÃO

### **1. Adicionar Variável de Ambiente**

No arquivo `.env` do projeto do quiz, adicione:

```bash
# Supabase (já existe)
NEXT_PUBLIC_SUPABASE_URL=https://kfkhdfnkwhljhhjcvbqp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ← Certifique-se que tem esta

# URLs
PERSONA_AI_URL=https://persona-ai.vercel.app  # URL do chat (produção)
# PERSONA_AI_URL=http://localhost:3000  # Para testar local
```

---

### **2. Instalar Dependência (se não tiver)**

```bash
npm install @supabase/supabase-js
# ou
pnpm add @supabase/supabase-js
```

---

### **3. Atualizar API `/api/submit`**

**Substitua** a função `finalizarQuiz` no backend do quiz por esta versão:

```javascript
// api/submit.js (Express) ou pages/api/submit.ts (Next.js)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const personaAiUrl = process.env.PERSONA_AI_URL || 'https://persona-ai.vercel.app'

// Cliente admin (pode criar usuários)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { lead, respostas } = req.body
    
    console.log('📥 Recebido:', { email: lead.EMAIL, nome: lead.NOME })

    // ============================================
    // 1️⃣ VERIFICAR SE USUÁRIO JÁ EXISTE
    // ============================================
    
    let userId = null
    let isNewUser = false
    
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser?.users?.find(u => u.email === lead.EMAIL)
    
    if (userExists) {
      console.log('✅ Usuário já existe:', userExists.id)
      userId = userExists.id
      isNewUser = false
    } else {
      // ============================================
      // 2️⃣ CRIAR NOVO USUÁRIO (sem senha - magic link only)
      // ============================================
      
      console.log('🆕 Criando novo usuário...')
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: lead.EMAIL,
        email_confirm: true, // Confirma email automaticamente
        user_metadata: {
          full_name: lead.NOME,
          phone: lead.CELULAR // Formato E.164: +5511987654321
        }
      })
      
      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError)
        throw new Error(`Erro ao criar usuário: ${createError.message}`)
      }
      
      userId = newUser.user.id
      isNewUser = true
      
      console.log('✅ Usuário criado:', userId)
      console.log('   Email:', lead.EMAIL)
      console.log('   Telefone:', lead.CELULAR)
      console.log('   Créditos criados automaticamente pelo trigger')
    }

    // ============================================
    // 3️⃣ PROCESSAR RESPOSTAS DO QUIZ (sua lógica atual)
    // ============================================
    
    const diagnostico = calcularDiagnostico(respostas) // Sua função existente
    
    // ============================================
    // 4️⃣ SALVAR QUIZ_LEADS JÁ COM USER_ID
    // ============================================
    
    const { data: quizData, error: quizError } = await supabaseAdmin
      .from('quiz_leads')
      .insert({
        user_id: userId, // ← VINCULAÇÃO AUTOMÁTICA!
        email: lead.EMAIL,
        nome: lead.NOME,
        telefone: lead.CELULAR,
        elemento_principal: diagnostico.elementoPrincipal,
        diagnostico_resumo: diagnostico.resumo,
        contagem_elementos: diagnostico.contagemElementos,
        intensidade_calculada: diagnostico.intensidade,
        // ... resto dos campos do diagnóstico
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (quizError) {
      console.error('❌ Erro ao salvar quiz:', quizError)
      throw new Error(`Erro ao salvar diagnóstico: ${quizError.message}`)
    }
    
    console.log('✅ Quiz salvo com user_id:', userId)

    // ============================================
    // 5️⃣ GERAR LINK DE AUTENTICAÇÃO (Magic Link)
    // ============================================
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: lead.EMAIL,
      options: {
        redirectTo: `${personaAiUrl}/chat`
      }
    })
    
    if (linkError) {
      console.error('❌ Erro ao gerar link:', linkError)
      // Não falha - retorna URL sem token
      return res.json({
        success: true,
        user_id: userId,
        is_new_user: isNewUser,
        diagnostico: diagnostico.elementoPrincipal,
        redirect_url: `${personaAiUrl}/chat`
      })
    }
    
    // Extrair token do magic link
    const magicUrl = new URL(linkData.properties.action_link)
    const token = magicUrl.searchParams.get('token')
    const tokenHash = magicUrl.searchParams.get('token_hash')
    
    console.log('🔑 Token gerado:', token ? 'SIM' : 'NÃO')

    // ============================================
    // 6️⃣ RETORNAR SUCESSO COM URL DE REDIRECT
    // ============================================
    
    return res.json({
      success: true,
      user_id: userId,
      is_new_user: isNewUser,
      diagnostico: diagnostico.elementoPrincipal,
      redirect_url: `${personaAiUrl}/auth/callback?token_hash=${tokenHash}&type=magiclink&next=/chat`,
      message: isNewUser 
        ? 'Usuário criado com sucesso! Redirecionando para o chat...'
        : 'Bem-vindo de volta! Redirecionando...'
    })
    
  } catch (error) {
    console.error('❌ ERRO:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      detalhes: 'Erro ao processar quiz'
    })
  }
}

// ============================================
// HELPER: Calcular Diagnóstico (sua função atual)
// ============================================

function calcularDiagnostico(respostas) {
  // COLE AQUI SUA LÓGICA ATUAL DE CÁLCULO
  // Retornar algo como:
  return {
    elementoPrincipal: 'FOGO',
    resumo: 'Você tem...',
    contagemElementos: { RIM: 2, FÍGADO: 1, BAÇO: 3, CORAÇÃO: 5, PULMÃO: 1 },
    intensidade: 5,
    // ... outros campos
  }
}
```

---

### **4. Atualizar Front-end do Quiz**

No `QuizMTC` React component, na função `finalizarQuiz`:

```javascript
const finalizarQuiz = async () => {
  setProcessando(true);
  
  try {
    // ... preparação do payload (já existe)
    
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Quiz salvo!');
      console.log('   User ID:', result.user_id);
      console.log('   Novo usuário?', result.is_new_user);
      console.log('   Diagnóstico:', result.diagnostico);
      
      setStep('resultado');
      
      // ⏰ Aguardar 2 segundos e redirecionar JÁ AUTENTICADO
      setTimeout(() => {
        console.log('🔄 Redirecionando para chat autenticado...');
        window.location.href = result.redirect_url; // ← Com token!
      }, 2000);
      
    } else {
      throw new Error(result.error || 'Erro desconhecido');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    setErro(`Erro ao enviar quiz: ${error.message}`);
  } finally {
    setProcessando(false);
  }
};
```

---

### **5. Atualizar Callback do Supabase (Persona-AI)**

No projeto Persona-AI, certifique-se que o callback está configurado:

**Arquivo: `app/auth/callback/route.ts`**

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/chat'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Se falhar, redireciona para login
  return NextResponse.redirect(new URL('/login', request.url))
}
```

---

## 🧪 TESTAR

### **Teste 1: Novo Usuário**

```bash
# 1. Preencha quiz com email novo
# 2. Finalize quiz
# 3. Verifique logs:
   ✅ "Criando novo usuário..."
   ✅ "Usuário criado: uuid-xxx"
   ✅ "Quiz salvo com user_id: uuid-xxx"
   ✅ "Token gerado: SIM"
# 4. Deve redirecionar para chat JÁ LOGADO
```

### **Teste 2: Usuário Existente**

```bash
# 1. Preencha quiz com email que já existe
# 2. Finalize quiz
# 3. Verifique logs:
   ✅ "Usuário já existe: uuid-xxx"
   ✅ "Quiz salvo com user_id: uuid-xxx"
# 4. Deve redirecionar para chat JÁ LOGADO
```

### **Teste 3: Verificar Vinculação**

```sql
-- No Supabase SQL Editor
SELECT 
  u.id as user_id,
  u.email,
  u.user_metadata->>'full_name' as nome,
  u.user_metadata->>'phone' as telefone,
  ql.elemento_principal,
  ql.user_id as quiz_vinculado,
  c.balance as creditos
FROM auth.users u
LEFT JOIN quiz_leads ql ON ql.user_id = u.id
LEFT JOIN credits c ON c.user_id = u.id
WHERE u.email = 'teste@exemplo.com';
```

**Deve retornar:**
- ✅ user_id preenchido
- ✅ quiz_vinculado = user_id (matching)
- ✅ creditos = 20 (criado pelo trigger)

---

## 🎯 RESULTADO FINAL

### **Antes:**
```
Quiz → Salva quiz_leads (sem user_id) → 
Usuário vai no Persona-AI → Se cadastra → 
Vinculação por email (trigger ou chat)
```

### **Depois:**
```
Quiz → Cria user + salva quiz_leads (com user_id) → 
Redireciona JÁ LOGADO → Chat funciona imediatamente ✅
```

---

## ✅ CHECKLIST

- [ ] `SUPABASE_SERVICE_ROLE_KEY` nas variáveis de ambiente
- [ ] `PERSONA_AI_URL` configurada
- [ ] Atualizar `/api/submit` com criação de usuário
- [ ] Atualizar front-end com `redirect_url`
- [ ] Testar com email novo (deve criar usuário)
- [ ] Testar com email existente (não deve duplicar)
- [ ] Verificar créditos criados automaticamente
- [ ] Verificar vinculação quiz → user_id

---

## 🚨 IMPORTANTE

### **Segurança:**
- ✅ Use `SUPABASE_SERVICE_ROLE_KEY` **APENAS no backend**
- ✅ Nunca exponha service role key no front-end
- ✅ Valide dados do lead antes de criar usuário

### **Duplicação:**
- ✅ Sempre verifique se email já existe
- ✅ Se existir, reutilize user_id
- ✅ Evite criar múltiplos users para mesmo email

### **UX:**
- ✅ Mensagem diferente para novo vs. existente
- ✅ "Conta criada!" vs. "Bem-vindo de volta!"
- ✅ Sempre redirecionar para chat (autenticado)

---

## 🎉 PRONTO!

Agora o quiz cria usuário automaticamente e redireciona já autenticado! 

**Experiência do usuário:**
1. Faz quiz (4min)
2. Cai direto no chat
3. Já logado
4. Diagnóstico já vinculado
5. Créditos já disponíveis
6. **ZERO fricção!** ✨

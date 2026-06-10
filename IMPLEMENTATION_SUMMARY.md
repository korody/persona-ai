# Course-Aware Exercise Recommendations — Implementation Summary

## ✅ O que foi implementado

### 1. **Migration de Banco de Dados** 
📁 `supabase/migrations/create-hub-exercise-courses-junction.sql`

**O que faz:**
- Cria junction table `hub_exercise_courses` para vincular exercícios a cursos (permite multi-curso)
- Popula automaticamente usando `memberkit_course_id` existente em `hub_exercises`
- Cria view `hub_exercises_with_courses` para debug
- Cria função RPC `get_exercises_by_course()` para queries otimizadas

**Resultado:** 
```
Saúde e Longevidade com Qi Gong          → 95 exercícios
Qi Gong Toda Semana com Mestre Ye        → 77 exercícios
Longevidade & Independência com Qi Gong  → 57 exercícios
[...]
```

✅ **JÁ EXECUTADA NO SUPABASE**

---

### 2. **Detecção de Intenção de Curso**
📁 `lib/helpers/course-intent-detection.ts` (NOVO)

**Funcionalidade:**
- Detecta quando o usuário menciona um curso específico (ex: "Do curso Longevidade e Independência")
- Suporta múltiplas formas (variações, abreviações, aliases)
- Retorna: `{ courseId, courseName, courseSlug, confidence }`
- Funções exportadas:
  - `detectCourseIntent(message)` — detecta curso na mensagem
  - `formatCourseContext(course)` — formata contexto para o prompt

**Exemplos de detecção:**
```
✓ "Me passa um exercício do curso Longevidade e Independência"
✓ "No curso saúde e longevidade, qual exercício..."
✓ "Longevidade independência com qi gong"
✗ "Qual exercício você recomenda?" (sem menção de curso)
```

---

### 3. **Busca de Exercícios Filtrada por Curso**
📁 `lib/helpers/exercise-recommendations.ts` (ATUALIZADO)

**4 funções atualizadas para aceitar `courseId` opcional:**

```typescript
// Antes
searchExercisesByAnamnese(quizLead, { matchCount: 3 })

// Depois
searchExercisesByAnamnese(quizLead, { matchCount: 3, courseId: 12345 })
```

**Funções:**
1. `searchExercisesByAnamnese()` — por elemento MTC
2. `searchExercisesBySymptoms()` — por sintomas
3. `searchExercisesBySemantic()` — por embedding (semantic search)
4. `searchIntroductoryExercises()` — para iniciantes

Todas agora filtram por `memberkit_course_id` quando `courseId` é fornecido.

---

### 4. **Integração no Chat Route**
📁 `app/api/chat/route.ts` (ATUALIZADO)

**Fluxo completo:**
```
1. Usuário envia mensagem
   ↓
2. detectCourseIntent() → identifica se mencionou um curso
   ↓
3. Se detectado: passa courseId para TODAS as buscas de exercícios
   ↓
4. formatCourseContext() → adiciona contexto ao system prompt
   → "O aluno está perguntando especificamente sobre: X"
   → "NÃO recomende exercícios de outros cursos"
   ↓
5. Claude API responde com exercícios APENAS do curso mencionado
```

**Logs esperados:**
```
🎓 Detecting course intent...
✅ Course detected: "Longevidade & Independência com Qi Gong" (id: 12345, confidence: high)

🎯 Found symptoms in message: [ansiedade, insônia]
🧘 Searching for relevant exercises...
   → Filtrando apenas exercícios do curso 12345
   ✓ searchExercisesBySymptoms(symptoms, { courseId: 12345 })

✅ Found 3 relevant exercises to recommend
```

---

## 🧪 Como Testar

### **Pré-requisito:**
- Migration já foi executada no Supabase ✅
- Servidor Next.js iniciando (pode ter erro de build com KaTeX fonts — é pre-existente)

### **Teste 1: Via UI (Recomendado)**
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Quando estiver ready em http://localhost:3000

# Terminal 2 (opcional): Ver logs em tempo real
tail -f .next/server.log
```

**Na interface:**
1. Acesse http://localhost:3000
2. Faça login com um usuário (crie de teste se needed)
3. Mande ao Mestre Ye:
   ```
   Me passa um exercício do curso Longevidade e Independência com Qi Gong para ansiedade
   ```

**Resultado esperado:**
- ✅ Avatar reconhece o curso
- ✅ Recomenda APENAS exercícios de "Longevidade & Independência com Qi Gong"
- ✅ Filtra por sintoma (ansiedade) dentro daquele curso
- ✅ Retorna 3 exercícios máximo com links

---

### **Teste 2: Variações de Menção de Curso**

Teste essas variações para validar robustez:

```
1. "Quero aprender exercícios do curso longevidade e independência"
   → Deve detectar: "Longevidade & Independência com Qi Gong"

2. "No curso Saúde & Longevidade, qual exercício é bom para dor nas costas?"
   → Deve detectar: "Saúde e Longevidade com Qi Gong"

3. "Me mostra um exercício de qi gong" (sem mencionar curso)
   → Não deve filtrar por curso (usa busca genérica)

4. "Do curso de longevidade, qual é melhor para o zumbido?"
   → Deve detectar com confidence: "medium" ou "low"
```

---

### **Teste 3: Sem Menção de Curso (Regressão)**

```
"Tenho ansiedade e insônia, me recomenda um exercício"
```

**Esperado:**
- ❌ Nenhum curso detectado
- ✅ Busca TODOS os exercícios (sem filtro)
- ✅ Retorna os mais relevantes (elemento MTC + sintomas)

---

## 🔍 Verificações Rápidas no Supabase

```sql
-- 1. Quantos exercícios por curso?
SELECT course_name, COUNT(*) as total
FROM hub_courses c
LEFT JOIN hub_exercise_courses ec ON ec.course_id = c.memberkit_course_id
GROUP BY course_name
ORDER BY total DESC;

-- 2. Exercícios do curso "Longevidade & Independência"
SELECT e.title, e.element, e.duration_minutes
FROM hub_exercises e
JOIN hub_exercise_courses ec ON ec.exercise_id = e.id
JOIN hub_courses c ON c.memberkit_course_id = ec.course_id
WHERE c.course_name LIKE '%Longevidade%Independência%'
LIMIT 10;

-- 3. Testar função RPC
SELECT * FROM get_exercises_by_course(
  p_course_id := 12345,  -- substitua pelo ID real
  p_element := 'AGUA',
  p_match_count := 5
);
```

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────┐
│   chat/route.ts (POST /api/chat)        │
│                                         │
│  1. detectCourseIntent(userMessage)     │
│     ↓                                   │
│  2. courseId = detectedCourse.courseId  │
│     ↓                                   │
│  3. searchExercises(..., { courseId })  │
│     ↓                                   │
│  4. formatCourseContext() → prompt      │
│     ↓                                   │
│  5. Claude API com contexto             │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  exercise-recommendations.ts            │
│                                         │
│  searchExercisesBySymptoms(..., {       │
│    courseId  ← novo filtro              │
│  })                                     │
│                                         │
│  if (courseId) {                        │
│    .eq('memberkit_course_id', id)       │
│  }                                      │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Supabase                               │
│                                         │
│  hub_exercises                          │
│  hub_exercise_courses (junction)        │
│  hub_courses                            │
└─────────────────────────────────────────┘
```

---

## ⚠️ Limitações & Próximos Passos

### **Limitações Atuais:**
1. ❌ Só detecta cursos **mencionados explicitamente** na mensagem
   - Não detecta baseado em contexto da conversa anterior
   - Solução futura: guardar `selected_course_id` na conversa

2. ❌ Aliases fixos no código
   - Solução futura: gerenciar aliases em tabela Supabase

3. ⚠️ Build do Next.js com erro de KaTeX fonts (Windows/Turbopack)
   - Não é causado por essas mudanças
   - Solução: rodar em Linux/Mac ou contornar Turbopack

### **Próximos Passos (Roadmap):**
1. [ ] Guardar `selected_course_id` na conversa quando detectado
2. [ ] Detectar mudança de curso na conversa ("Agora muda de curso")
3. [ ] Admin dashboard para gerenciar aliases de cursos
4. [ ] Telemetria: qual curso é mais consultado
5. [ ] Recomendação de "próximo exercício" dentro do mesmo curso
6. [ ] Paths otimizados: `/api/courses/{courseId}/exercises`

---

## 📝 Notas de Implementação

- **Sem breaking changes**: Todas as funções são backward-compatible
- **Course filtering**: Feito em nível de Supabase (mais eficiente)
- **Fallback**: Se especificou curso mas não encontrou, tenta sem filtro
- **Confidência**: Retorna "high"/"medium"/"low" para rastreabilidade
- **RLS habilitado**: Junction table protegida por Row Level Security

---

**Status:** ✅ Implementação Completa | 🧪 Aguardando Testes | 🚀 Pronto para Deploy

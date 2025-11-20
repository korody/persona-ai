# Sistema de Aprendizado Multi-Camada para Avatares

Este sistema permite que avatares de IA aprendam de 3 formas diferentes:

## 🎯 Arquitetura em 3 Camadas

### **Camada 1: Conhecimento Base (Admin)**
Gerenciado por administradores na interface `/admin/training`

#### 1.1 System Prompt
- Define personalidade e expertise do avatar
- Versionamento automático
- Pode reverter para versões anteriores

#### 1.2 Base de Conhecimento (RAG)
- Documentos, artigos, guias, exercícios
- Busca semântica usando embeddings
- Categorização por tags
- Tipos: `article`, `faq`, `guide`, `exercise`

#### 1.3 Exemplos de Conversas (Few-shot Learning)
- Pares pergunta/resposta ideais
- Categorização por tipo de interação
- Score de qualidade (1-5)

### **Camada 2: Perfil Individual do Usuário**
Aprendizado personalizado durante conversas

#### 2.1 Memória Pessoal
```typescript
{
  memory_type: 'preference' | 'health_info' | 'goal' | 'pattern',
  key: string,  // ex: 'elemento_principal', 'dor_recorrente'
  value: string,
  confidence_score: 0-1
}
```

#### 2.2 Preferências de Comunicação
- Estilo de resposta (formal/casual/técnico)
- Tamanho preferido (conciso/detalhado)
- Tom (empático/direto/motivacional)
- Uso de emojis

### **Camada 3: Aprendizado Coletivo**
Feedback dos usuários vira conhecimento base

#### 3.1 Sistema de Feedback
- Rating 1-5 estrelas
- Comentários textuais
- Tipos: helpful, not_helpful, inaccurate, perfect

#### 3.2 Padrões Aprendidos
```typescript
{
  context_summary: "Quando usuário relata dor nas costas...",
  action_taken: "Perguntar sobre postura e estresse",
  success_rate: 0.85,  // Taxa de sucesso
  positive_feedback_count: 34,
  negative_feedback_count: 6
}
```

#### 3.3 Conversas Destacadas
- High-rated conversations (4-5 estrelas)
- Admin pode revisar e aprovar para treinamento
- Status: pending → reviewed → approved_for_training

---

## 📁 Estrutura de Arquivos

### Banco de Dados
```
avatar-learning-schema.sql          # Schema completo do sistema
```

### APIs
```
app/api/admin/
├── knowledge/route.ts              # CRUD base de conhecimento
├── examples/route.ts               # CRUD exemplos de conversas
└── prompts/route.ts                # Gerenciar system prompts
```

### Interface Admin
```
app/admin/training/page.tsx         # Página de gerenciamento
```

---

## 🚀 Como Usar

### 1. Aplicar Schema no Banco
```sql
psql -U postgres -d sua_database < avatar-learning-schema.sql
```

### 2. Acessar Interface Admin
Navegue para: `http://localhost:3000/admin/training`

### 3. Configurar Conhecimento Base

#### a) Editar System Prompt
```
Tab: "Prompt do Sistema"
- Cole o prompt do seu GPT customizado
- Clique em "Salvar Prompt"
- Sistema cria versão automática
```

#### b) Adicionar Documentos (Futuro - RAG)
```
Tab: "Base de Conhecimento"
- Clique em "Adicionar Documento"
- Título, conteúdo, tipo, tags
- Sistema gera embeddings automáticos
```

#### c) Adicionar Exemplos
```
Tab: "Exemplos de Conversas"
- Pergunta do usuário
- Resposta ideal do avatar
- Categoria e score de qualidade
```

---

## 🔄 Fluxo de Aprendizado

### Durante uma Conversa

1. **Sistema busca conhecimento relevante** (RAG)
   - Embedding da pergunta do usuário
   - Busca docs similares na base
   - Injeta no contexto da IA

2. **Sistema carrega memórias do usuário**
   - Preferências anteriores
   - Informações de saúde
   - Objetivos e padrões

3. **IA gera resposta** com contexto completo

4. **Sistema extrai novas memórias**
   - Detecta informações importantes
   - Atualiza perfil do usuário

5. **Usuário dá feedback** (opcional)
   - Rating da resposta
   - Comentário

6. **Sistema atualiza padrões aprendidos**
   - Incrementa counters
   - Recalcula success_rate

### Processo de Aprovação (Admin)

1. **Conversas com alto rating** vão para review
2. **Admin revisa** conversas destacadas
3. **Admin aprova** para virar conhecimento base
4. **Sistema extrai** padrões efetivos
5. **Padrões aprovados** viram exemplos

---

## 🛠️ Próximos Passos

### Implementar RAG (Busca Semântica)
```typescript
// TODO: Integrar OpenAI Embeddings
import { OpenAI } from 'openai'

async function generateEmbedding(text: string) {
  const openai = new OpenAI()
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  })
  return response.data[0].embedding
}

// Buscar conhecimento relevante
async function searchKnowledge(query: string, avatarId: string) {
  const queryEmbedding = await generateEmbedding(query)
  
  // Busca vetorial no Supabase
  const { data } = await supabase.rpc('match_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 3,
    avatar_id: avatarId
  })
  
  return data
}
```

### Implementar Extração de Memórias
```typescript
// TODO: Usar IA para extrair informações
async function extractMemories(conversation: Message[]) {
  const prompt = `
    Analise esta conversa e extraia informações importantes sobre o usuário:
    - Preferências de comunicação
    - Informações de saúde
    - Objetivos
    - Padrões de comportamento
    
    Retorne em JSON.
  `
  
  // Usar IA para extrair
  const memories = await extractWithAI(conversation, prompt)
  
  // Salvar no banco
  for (const memory of memories) {
    await saveUserMemory(userId, avatarId, memory)
  }
}
```

### Implementar Sistema de Feedback
```typescript
// TODO: Adicionar botões de feedback nas mensagens
<MessageActions>
  <Button onClick={() => rateMessage(messageId, 5)}>
    👍 Útil
  </Button>
  <Button onClick={() => rateMessage(messageId, 1)}>
    👎 Não útil
  </Button>
</MessageActions>
```

---

## 📊 Métricas e Dashboard (Futuro)

### KPIs para Acompanhar
- Taxa de sucesso por categoria
- Satisfação média dos usuários
- Evolução do conhecimento base
- Padrões mais efetivos
- Usuários mais engajados

### Reports
- Conversas por rating
- Tópicos mais discutidos
- Gaps de conhecimento
- Sugestões de melhorias

---

## 🔒 Segurança

### RLS (Row Level Security)
- Usuários só veem suas próprias memórias
- Apenas admins editam conhecimento base
- Feedback vinculado ao usuário correto

### Validação
- System prompts têm limite de tamanho
- Feedback requer autenticação
- Rate limiting para prevenir abuse

---

## 💡 Casos de Uso

### Exemplo 1: Novo Usuário
1. Usuário: "Estou com dor nas costas há semanas"
2. Sistema busca docs sobre dor nas costas
3. IA responde com conhecimento da base
4. Sistema salva: `{key: 'queixa_principal', value: 'dor nas costas'}`
5. Próximas conversas já sabem dessa informação

### Exemplo 2: Usuário Recorrente
1. Sistema carrega: "Elemento Madeira, prefere respostas técnicas"
2. IA ajusta tom e recomendações
3. Usuário dá feedback 5 estrelas
4. Sistema marca conversa para review
5. Admin aprova → vira exemplo de qualidade

### Exemplo 3: Aprendizado Coletivo
1. 50 usuários relatam ansiedade + insônia
2. IA recomenda exercício de respiração
3. 85% dão feedback positivo
4. Sistema detecta padrão efetivo
5. Admin aprova → vira conhecimento base

---

## 🎓 Resumo

Este sistema permite que seus avatares:

✅ **Tenham conhecimento base rico** (prompt + docs + exemplos)
✅ **Aprendam sobre cada usuário** (preferências + histórico)
✅ **Evoluam com feedback** (padrões que funcionam)
✅ **Sejam replicáveis** (copiar conhecimento entre avatares)

**Próximo passo:** Migrar o prompt do seu GPT customizado para a interface admin!

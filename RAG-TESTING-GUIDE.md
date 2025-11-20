# 🚀 RAG Implementado - Como Testar

## ✅ O que foi implementado:

1. **Função SQL para busca vetorial** (`supabase-rag-function.sql`)
2. **Biblioteca RAG** (`lib/ai/rag.ts`) com:
   - Geração de embeddings (OpenAI)
   - Busca semântica
   - Adicionar/atualizar conhecimento
3. **Integração no chat** - busca automática de conhecimento relevante
4. **API atualizada** - embeddings automáticos ao adicionar docs

---

## 📋 Próximos Passos:

### 1. Aplicar Função SQL no Supabase

**Copie e execute no SQL Editor:**
```sql
-- Arquivo: supabase-rag-function.sql
```

### 2. Configurar OpenAI API Key

Adicione no arquivo `.env.local`:
```env
OPENAI_API_KEY=sk-...sua-chave-aqui...
```

### 3. Testar Adicionando Conhecimento

Acesse: `http://localhost:3000/admin/training`

**Tab "Base de Conhecimento"** → Clique em "Adicionar Documento"

Exemplo de documento:
```
Título: Exercícios para Elemento Madeira
Tipo: exercise
Conteúdo: 
O Elemento Madeira está relacionado ao fígado e vesícula biliar.
Quando desbalanceado, causa irritabilidade, dores musculares e tensão.

Exercícios recomendados:
1. Torção de coluna sentado (5 min)
2. Alongamento lateral (3 min cada lado)
3. Respiração profunda com expiração lenta (10 min)

Tags: madeira, fígado, tensão, irritabilidade
```

### 4. Testar o RAG

**Converse com o Mestre Ye:**
```
Usuário: "Estou com muita tensão muscular e irritabilidade"
```

**O que acontece nos bastidores:**
1. Sistema gera embedding da pergunta
2. Busca docs similares (>75% similarity)
3. Injeta conhecimento no contexto
4. Claude responde usando o conhecimento

**Resposta esperada:**
> "Percebo que você está relatando tensão muscular e irritabilidade.
> Segundo a MTC, esses sintomas indicam um desequilíbrio do Elemento Madeira...
> [Cita os exercícios do documento]"

---

## 🔍 Como Funciona:

### Fluxo do RAG:

```
Usuário pergunta
    ↓
[1] Gera embedding da pergunta (OpenAI)
    ↓
[2] Busca docs similares no banco (pgvector)
    ↓
[3] Formata contexto com top 3 docs
    ↓
[4] Injeta no system prompt
    ↓
[5] Claude responde com conhecimento
```

### Estrutura do Prompt Final:

```
[System Prompt Base do Avatar]
+
[Contexto do Quiz do Usuário]
+
[Conhecimento Relevante (RAG)]
=
Prompt Completo para Claude
```

---

## 📊 Exemplo Real:

### Documento na Base:
```json
{
  "title": "Dor nas Costas - Perspectiva MTC",
  "content": "Dores lombares são frequentemente...",
  "tags": ["dor-costas", "rim", "agua"],
  "embedding": [0.123, -0.456, ...] // 1536 dimensões
}
```

### Query do Usuário:
```
"Tenho dor lombar há semanas"
```

### Similaridade:
```
✓ "Dor nas Costas - Perspectiva MTC" → 87% similar
✓ "Exercícios para Elemento Água" → 76% similar
✗ "Alimentação Elemento Fogo" → 42% similar (descartado)
```

### Contexto Injetado:
```
CONHECIMENTO BASE RELEVANTE:

[Documento 1: Dor nas Costas - Perspectiva MTC]
Tipo: article
Conteúdo: Dores lombares são frequentemente...
Tags: dor-costas, rim, agua
Relevância: 87.0%

---

[Documento 2: Exercícios para Elemento Água]
...
```

---

## 🎯 Próximas Melhorias:

### Implementado ✅
- [x] Geração de embeddings
- [x] Busca vetorial
- [x] Integração automática no chat
- [x] API de gerenciamento

### TODO 📝
- [ ] Interface para adicionar docs na admin
- [ ] Upload de arquivos (PDF, TXT)
- [ ] Chunking de documentos longos
- [ ] Cache de embeddings
- [ ] Analytics de uso de conhecimento

---

## 🐛 Troubleshooting:

### Erro: "OPENAI_API_KEY not configured"
→ Adicione a chave no `.env.local`

### Erro: "match_knowledge does not exist"
→ Execute `supabase-rag-function.sql` no SQL Editor

### RAG não está trazendo resultados
→ Verifique se há documentos com `is_active = true`
→ Reduza o `matchThreshold` para 0.6

### Embeddings não são gerados
→ Verifique se a OpenAI API key está válida
→ Check os logs do servidor

---

## 💡 Dicas:

**Bons documentos para adicionar:**
- ✓ Artigos sobre sintomas e diagnósticos
- ✓ Exercícios específicos por elemento
- ✓ FAQs comuns
- ✓ Guias de tratamento

**Estrutura ideal:**
- Título claro e descritivo
- Conteúdo objetivo (200-500 palavras)
- Tags relevantes
- Exemplos práticos

**Tags sugeridas:**
- Elementos: `madeira`, `fogo`, `terra`, `metal`, `agua`
- Sintomas: `dor-costas`, `ansiedade`, `insonia`, `tensao`
- Tipos: `diagnostico`, `exercicio`, `alimentacao`, `emocional`

---

Pronto para testar! 🎉

# 🗺️ Roadmap de Desenvolvimento - Persona AI

**Última atualização**: 20 de novembro de 2025

---

## 📊 Visão Geral do Sistema

Sistema de IA conversacional com avatar "Mestre Ye" especializado em Medicina Tradicional Chinesa (MTC) usando RAG (Retrieval-Augmented Generation) e diagnóstico personalizado por anamnese.

---

## 🎯 Camadas de Conhecimento

### ✅ 1. System Prompt - Personalidade do Avatar
- **Status**: PRODUÇÃO ⭐⭐⭐⭐⭐
- **Localização**: `avatars.system_prompt`
- **Conteúdo**: Biografia, filosofia MTC, tom de voz, regras de segurança
- **Configurações**: `temperature`, `max_tokens`

### ✅ 2. Anamnese Individual (Diagnóstico MTC)
- **Status**: PRODUÇÃO ⭐⭐⭐⭐⭐
- **Fonte**: Quiz de 12 perguntas
- **Dados**: Elemento principal, intensidade (0-12), elementos secundários (score > 2)
- **Mapeamento**: 5 elementos MTC + 30 variações de órgãos (BAÇO→TERRA)
- **Uso**: Priorização RAG (Primário > Secundário > Geral)

### ✅ 3. RAG - Base de Conhecimento Proprietária
- **Status**: PRODUÇÃO ⭐⭐⭐⭐⭐
- **Total**: 57 chunks processados
- **Distribuição**: METAL(14), ÁGUA(8), TERRA(4), MADEIRA(3), FOGO(1), N/A(27)
- **Tecnologia**: OpenAI embeddings (1536d), cosine similarity, threshold 30%
- **Processamento**: 100% automático (extração YAML, splitting, embeddings)
- **Metadata**: Elemento, órgãos, sintomas físicos/emocionais

### ⚠️ 4. Few-Shot Learning (Exemplos de Conversa)
- **Status**: TABELA CRIADA, VAZIA ⚠️
- **Funcionalidade**: Top 3 exemplos similares, ensina tom/estilo
- **Próximo passo**: Popular com 20-30 exemplos de qualidade

### ✅ 5. Claude 3.5 Sonnet - Conhecimento Base
- **Status**: ATIVO ⭐⭐⭐⭐
- **Modelo**: `claude-3-5-sonnet-20241022`
- **Conhecimento**: MTC geral, 5 elementos, acupuntura, fitoterapia
- **Limitações**: Não conhece "Método Ye Xin" específico, corte abril/2024

### ⚙️ 6. API Plataforma de Cursos do Expert
- **Status**: NÃO IMPLEMENTADO ⚙️
- **Prioridade**: 🎯 **PRÓXIMA IMPLEMENTAÇÃO**
- **Objetivo**: Conectar IA à plataforma de cursos
- **Funcionalidades**:
  - Buscar cursos por tema/elemento
  - Referenciar exercícios específicos com links diretos
  - Recomendar módulos baseados na anamnese
  - Gerar URLs para aulas/vídeos demonstrativos
- **Dados necessários da API**:
  - ID do curso
  - Título e descrição
  - Módulos e aulas
  - Elemento MTC associado
  - Tags/categorias
  - URLs de acesso
  - Thumbnails/previews
- **Exemplo de uso**:
  ```
  Usuário: "Como fortalecer o baço?"
  IA: "Recomendo o Módulo 3: 'Fortalecimento do Elemento Terra'
       do curso 'Método Ye Xin Completo'.
       [Link direto: https://plataforma.com/curso/123/modulo/3]
       
       Exercício prático: 'Massagem do Baço' (5 minutos diários)
       [Vídeo demonstrativo: https://plataforma.com/video/456]"
  ```
- **Armazenamento**: Cache local em `platform_courses` (a criar)
- **Integração**: RAG híbrido (conhecimento + cursos)

### ⚙️ 7. User Memory (Memória de Conversas)
- **Status**: TABELA CRIADA, NÃO USADA ⚙️
- **Objetivo**: Lembrar contexto entre conversas
- **Exemplos**: "Na última vez você mencionou...", preferências, restrições
- **Armazenamento**: `user_memory`
- **Extração**: Automática via LLM

### ⚙️ 8. Communication Preferences
- **Status**: TABELA CRIADA, NÃO USADA ⚙️
- **Configurações**: Comprimento (curta/média/longa), formalidade (0-100), emojis, idioma
- **Armazenamento**: `user_communication_preferences`

### ⚙️ 9. Conversation Feedback (Aprendizado Contínuo)
- **Status**: TABELA CRIADA, NÃO USADA ⚙️
- **Objetivo**: Thumbs up/down para melhorar respostas
- **Funcionalidades**:
  - Coletar avaliações dos usuários
  - Identificar respostas de alta qualidade
  - Converter boas respostas em examples
- **Armazenamento**: `conversation_feedback`

### ⚙️ 10. Learned Patterns (Inteligência Coletiva)
- **Status**: TABELA CRIADA, NÃO USADA ⚙️
- **Objetivo**: Detectar padrões entre usuários
- **Exemplos**: "90% dos usuários BAÇO perguntam sobre alimentação"
- **Armazenamento**: `learned_patterns`

### ❌ 11. Web Search / Internet Access
- **Status**: NÃO IMPLEMENTADO ❌
- **Opções**: Tavily API (~$5-10/mês), Perplexity API, Brave Search
- **Casos de uso**: Estudos científicos recentes, validação de informações

---

## 🔄 Fluxo de Consulta Atual

```
1. Mensagem do Usuário
   ↓
2. Gerar embedding (OpenAI 1536d)
   ↓
3. Buscar anamnese do usuário
   ↓
4. RAG Search (prioriza elemento do diagnóstico)
   → Top 5 chunks (threshold 30%)
   → Ordem: Primário ⭐ > Secundário ⚠️ > Geral 📄
   ↓
5. Few-Shot Search (se houver exemplos)
   → Top 3 mais similares
   ↓
6. Montar contexto enriquecido:
   - System Prompt
   - Dados da anamnese
   - Base de conhecimento RAG
   - Exemplos de conversa
   - Conhecimento base do Claude
   ↓
7. Enviar para Claude 3.5 Sonnet
   ↓
8. Retornar resposta personalizada
   ↓
9. Salvar no histórico
```

---

## 📋 Ordem de Implementação (Roadmap)

### ✅ **Fase 1: Fundação RAG** (COMPLETA)
- [x] Sistema de chunks com embeddings
- [x] Busca vetorial com similaridade
- [x] Integração com anamnese
- [x] Mapeamento de elementos MTC
- [x] Processamento automático de documentos
- [x] Interface de treinamento

### 🚧 **Fase 2: Enriquecimento de Contexto** (EM ANDAMENTO)

#### 🎯 Prioridade 1: API Plataforma de Cursos (3-5 dias)
- [ ] Mapear endpoints da API da plataforma
- [ ] Criar schema da tabela `platform_courses`
- [ ] Implementar cache de cursos
- [ ] Criar função de busca híbrida (RAG + Cursos)
- [ ] Adicionar formatação de links nas respostas
- [ ] Testar integração com casos reais

#### 📝 Prioridade 2: Few-Shot Examples (1-2 dias)
- [ ] Criar 20-30 exemplos de conversas de qualidade
- [ ] Focar em casos comuns por elemento:
  - TERRA: Alimentação, digestão
  - METAL: Respiração, pele
  - ÁGUA: Energia vital, medos
  - MADEIRA: Emoções, irritabilidade
  - FOGO: Sono, ansiedade
- [ ] Popular tabela `avatar_conversation_examples`
- [ ] Testar busca semântica de examples

#### 🧠 Prioridade 3: User Memory Básica (2-3 dias)
- [ ] Implementar extração automática de informações
- [ ] Definir campos-chave para memória:
  - Nome preferido
  - Condições de saúde mencionadas
  - Práticas regulares
  - Alimentos/restrições
- [ ] Integrar memória no contexto do chat
- [ ] Criar UI para visualizar/editar memória

#### 📊 Prioridade 4: Sistema de Feedback (2-3 dias)
- [ ] Adicionar botões thumbs up/down nas mensagens
- [ ] Salvar feedback em `conversation_feedback`
- [ ] Criar dashboard de feedback para admin
- [ ] Implementar conversão automática: feedback positivo → example

### 📋 **Fase 3: Balanceamento e Otimização** (PLANEJADO)

#### 📚 Balancear Chunks RAG (1 dia)
- [ ] Upload de mais conteúdo FOGO (meta: 10 chunks)
- [ ] Upload de mais conteúdo MADEIRA (meta: 10 chunks)
- [ ] Upload de mais conteúdo TERRA (meta: 10 chunks)
- [ ] Manter METAL e ÁGUA bem distribuídos

#### ⚙️ Communication Preferences (2 dias)
- [ ] Criar UI para preferências de comunicação
- [ ] Implementar adaptação de respostas
- [ ] Testar variações de tom/tamanho

#### 🧪 Learned Patterns (3-4 dias)
- [ ] Análise de padrões em conversas
- [ ] Detecção de correlações elemento-pergunta
- [ ] Dashboard de insights coletivos
- [ ] Auto-sugestão de novos RAG chunks

### 🔮 **Fase 4: Expansão Avançada** (FUTURO)

#### 🌐 Web Search (2-3 dias)
- [ ] Integrar Tavily/Perplexity API
- [ ] Criar filtros para fontes científicas
- [ ] Adicionar citações automáticas

#### 🖼️ Multimodal (Análise de Imagens)
- [ ] Análise de língua (diagnóstico MTC)
- [ ] Análise de pele/rosto
- [ ] Upload e processamento de imagens

#### 🎙️ Áudio Bidirecional
- [ ] Text-to-Speech (Mestre Ye responde em voz)
- [ ] Speech-to-Text (usuário fala)
- [ ] Integração com chamadas de voz

#### 👥 Sessões em Grupo
- [ ] Chat em grupo assistido por IA
- [ ] Moderação automática
- [ ] Síntese de discussões

---

## 📊 Métricas Atuais

| Métrica | Valor | Status |
|---------|-------|--------|
| **Chunks RAG** | 57 | ✅ Operacional |
| **Documentos processados** | 15 | ✅ 100% automático |
| **Elementos cobertos** | 5/5 | ⚠️ Desbalanceado |
| **Few-shot examples** | 0 | ❌ Vazio |
| **Threshold similaridade** | 30% | ✅ Otimizado |
| **Embedding dimensions** | 1536 | ✅ OpenAI padrão |

---

## 🛠️ Stack Técnico

| Componente | Tecnologia |
|------------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **LLM** | Claude 3.5 Sonnet (Anthropic) |
| **Embeddings** | OpenAI text-embedding-3-small |
| **Vector Search** | Client-side cosine similarity |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage (knowledge-base bucket) |
| **Deployment** | Vercel |

---

## 📝 Notas Importantes

1. **Chunks desbalanceados**: METAL(14), ÁGUA(8) vs FOGO(1), MADEIRA(3) → Priorizar upload
2. **Few-shot vazio**: Sistema pronto, aguardando exemplos
3. **Anamnese é fundamental**: Todo o sistema de priorização depende do quiz
4. **Processamento automático**: Novos uploads geram chunks sem intervenção
5. **API Cursos**: Próxima implementação prioritária para recomendações específicas

---

## 🎯 Próximos Passos (Ordem de Execução)

1. **API Plataforma de Cursos** (3-5 dias) 🎯 **AGORA**
2. **Popular Few-Shot Examples** (1-2 dias)
3. **User Memory Básica** (2-3 dias)
4. **Balancear Chunks RAG** (1 dia)
5. **Sistema de Feedback** (2-3 dias)

---

**Status Geral**: 🟢 **Sistema Core Funcional** | 🟡 **Faltam camadas avançadas**

**Última revisão**: 20/11/2025

# 🧘 Sistema de Recomendação de Exercícios - Mestre Ye

## 📋 Visão Geral

O Mestre Ye agora possui integração completa com a plataforma Memberkit, permitindo recomendar automaticamente exercícios personalizados de Qi Gong do Método Ye Xin durante as conversas.

## 🎯 Como Funciona

### 1. Busca Inteligente de Exercícios

O sistema busca exercícios de três formas diferentes, em ordem de prioridade:

#### 🔍 **Busca por Sintomas (Prioridade 1)**
- Detecta sintomas mencionados pelo usuário na mensagem
- Palavras-chave mapeadas:
  - **ansiedade**: ansiedade, nervosismo, preocupação, estresse
  - **insônia**: insônia, dificuldade para dormir, sono
  - **dor_lombar**: dor na lombar, dor nas costas, lombar, coluna
  - **dor_pescoço**: dor no pescoço, cervical, torcicolo
  - **dor_ombro**: dor no ombro, ombro
  - **dor_joelho**: dor no joelho, joelho
  - **fadiga**: fadiga, cansaço, exaustão
  - **digestão**: digestão, estômago, má digestão
  - **pressão_alta**: pressão alta, hipertensão
  - **zumbido**: zumbido, ouvido
  - **dor_cabeça**: dor de cabeça, enxaqueca, cefaleia

#### 🌳 **Busca por Elemento (Prioridade 2)**
- Se não encontrar por sintomas E usuário tiver anamnese completa
- Busca exercícios do elemento principal identificado no quiz
- Elementos: ÁGUA, FOGO, MADEIRA, METAL, TERRA

#### 📚 **Base de Dados**
- 404 exercícios sincronizados do Memberkit
- Metadados em português para melhor matching
- Campos indexados: element, level, indications, tags

### 2. Contexto no Sistema Prompt

Os exercícios encontrados são adicionados ao contexto do Claude como:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧘 EXERCÍCIOS RECOMENDADOS DO MÉTODO YE XIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com base no perfil do usuário (Elemento: ÁGUA, Intensidade: 8), recomendamos:

1. **Ba Duan Jin - Carregar o Céu**
   - Elemento: ÁGUA
   - Nível: INICIANTE
   - Duração: 5 minutos
   - Benefícios: Alonga coluna, Libera ombros
   - Indicações: ansiedade, tensão_superior
   - Link: https://memberkit.com.br/...

**IMPORTANTE:** Ao recomendar exercícios, sempre inclua o link direto para o vídeo.
Explique brevemente por que cada exercício é adequado para o caso específico do usuário.
```

### 3. Claude Integra Naturalmente

O Claude recebe as instruções:
- Mencionar exercícios naturalmente na conversa
- Sempre incluir links quando mencionar exercícios
- Explicar por que o exercício é adequado para o caso

## 🔄 Fluxo de Execução

```
1. Usuário envia mensagem
   ↓
2. Sistema extrai sintomas da mensagem
   ↓
3. Busca exercícios por sintomas (se encontrou)
   ↓
4. Se não encontrou E tem anamnese → Busca por elemento
   ↓
5. Formata exercícios no contexto
   ↓
6. Claude gera resposta incluindo exercícios
   ↓
7. Usuário recebe recomendação personalizada com links
```

## 📊 Dados Sincronizados

### Estrutura da Tabela `exercises`

```sql
- id (UUID)
- memberkit_course_id, memberkit_section_id, memberkit_lesson_id
- title, description, slug, url
- element (ÁGUA, FOGO, MADEIRA, METAL, TERRA)
- organs (array: PULMÃO, RIM, FÍGADO, CORAÇÃO, BAÇO)
- duration_minutes, level (INICIANTE, INTERMEDIÁRIO, AVANÇADO)
- tags, benefits, indications, contraindications (arrays)
- embedding (vector para busca semântica futura)
- is_active, position
- created_at, updated_at
```

### Sincronização

```bash
# Sincronizar exercícios do Memberkit
pnpm sync-memberkit
```

Resultado:
- ✅ 404 exercícios sincronizados
- ✅ 0 erros
- ✅ Metadados em português
- ✅ URLs diretos para Memberkit

## 💡 Exemplos de Uso

### Exemplo 1: Usuário com Ansiedade

**Usuário:**
> Estou com muita ansiedade, não consigo relaxar

**Sistema:**
1. Extrai sintoma: `ansiedade`
2. Busca exercícios com `indications=['ansiedade']`
3. Encontra 3 exercícios relevantes
4. Adiciona ao contexto do Claude

**Mestre Ye:**
> Entendo sua preocupação com a ansiedade. Na Medicina Tradicional Chinesa, 
> a ansiedade está relacionada ao desequilíbrio do elemento Fogo (Coração).
> 
> Recomendo começar com estes exercícios do Método Ye Xin:
> 
> 1. **Ba Duan Jin - Balançar a Cabeça**: Este exercício acalma o Fogo do Coração
>    [Acesse aqui](link)
> 
> 2. **Respiração 4/4 Tempos**: Técnica específica para acalmar a mente
>    [Acesse aqui](link)

### Exemplo 2: Usuário com Dor Lombar e Anamnese

**Contexto:**
- Usuário tem quiz completo
- Elemento principal: ÁGUA
- Intensidade: 8 (alta)

**Usuário:**
> Minha lombar está doendo muito

**Sistema:**
1. Extrai sintoma: `dor_lombar`
2. Busca exercícios com `indications=['dor_lombar']`
3. Prioriza exercícios do elemento ÁGUA (perfil do usuário)
4. Adiciona contexto personalizado

**Mestre Ye:**
> A dor lombar está diretamente relacionada ao elemento Água e aos Rins, 
> que já identificamos como o seu elemento principal em desequilíbrio.
> 
> Vou te recomendar exercícios específicos para fortalecer os Rins:
> 
> 1. **Yi Jin Jing - As Três Reverências**: Fortalece lombar e Rins
>    [Acesse aqui](link)
> 
> 2. **Ba Duan Jin - Segurar Ponta dos Pés**: Nutre o elemento Água
>    [Acesse aqui](link)

### Exemplo 3: Usuário Geral (sem sintoma específico)

**Usuário:**
> Quero começar a praticar Qi Gong

**Sistema:**
1. Não encontra sintomas específicos
2. Se tem anamnese, busca por elemento
3. Se não tem anamnese, não recomenda exercícios específicos

**Mestre Ye:**
> Que ótimo que você quer começar! O Qi Gong é uma prática milenar que 
> traz inúmeros benefícios.
> 
> Como você já fez a anamnese e identificamos que seu elemento principal 
> é a ÁGUA, recomendo começar com estes exercícios básicos...

## 🔧 Funções Principais

### `searchExercisesBySymptoms(symptoms, options)`
Busca exercícios que contenham os sintomas nas indicações.

### `searchExercisesByAnamnese(quizLead, options)`
Busca exercícios do elemento principal do usuário.

### `searchExercisesByElement(element, options)`
Busca exercícios de um elemento específico da MTC.

### `extractSymptomsFromMessage(message)`
Extrai sintomas da mensagem do usuário usando mapa de palavras-chave.

### `formatExercisesContext(exercises, quizLead)`
Formata exercícios para incluir no prompt do sistema.

## 📝 Metadados Customizados

Arquivo: `exercicios-metadata.json`

```json
{
  "version": "1.0.0",
  "lastSync": "2024-11-20T...",
  "exercicios": {
    "ba-duan-jin-peca-1": {
      "duration_minutes": 5,
      "level": "INICIANTE",
      "element": "FOGO",
      "benefits": ["Alonga coluna", "Libera ombros"],
      "indications": ["dor_pescoço", "dor_ombro", "tensão_superior"],
      "contraindications": ["Lesão aguda no ombro"]
    }
  }
}
```

## 🚀 Próximos Passos

- [ ] Gerar embeddings para busca semântica
- [ ] Adicionar filtros por nível de dificuldade
- [ ] Criar playlists automáticas de exercícios
- [ ] Tracking de exercícios praticados pelo usuário
- [ ] Progressão personalizada baseada em prática

## 📊 Métricas

- **Total de exercícios**: 404
- **Cursos integrados**: 28
- **Taxa de sucesso da sincronização**: 100%
- **Elementos cobertos**: 5 (ÁGUA, FOGO, MADEIRA, METAL, TERRA)
- **Níveis disponíveis**: 3 (INICIANTE, INTERMEDIÁRIO, AVANÇADO)

## 🔐 Segurança e Acesso

- Tabela `exercises` tem RLS habilitado
- Leitura pública apenas para exercícios ativos
- Escrita restrita a `service_role` (sync)
- URLs diretos para Memberkit (plataforma protegida)

## 🎓 Localização

**Estratégia Híbrida:**
- **Estrutura**: Inglês (element, level, indications)
- **Valores**: Português (ÁGUA, INICIANTE, ansiedade)
- **Motivo**: Melhor matching em conversas em português

## 📚 Referências

- Integração: `lib/memberkit/api.ts`
- Sync: `lib/memberkit/sync.ts`
- Repository: `lib/exercicios/repository.ts`
- Helpers: `lib/helpers/exercise-recommendations.ts`
- Migration: `supabase/migrations/create-exercicios-table.sql`

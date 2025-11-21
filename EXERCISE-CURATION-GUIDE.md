# 📝 Guia de Curadoria de Exercícios

## 🎯 Objetivo

Os exercícios são sincronizados automaticamente do Memberkit (404 exercícios), mas os **metadados** (elemento, nível, indicações, benefícios, etc.) precisam ser curados manualmente para que o Mestre Ye possa recomendar os exercícios corretamente.

## 📋 Processo de Curadoria

### 1. Listar Exercícios Disponíveis

```bash
# Ver todos os exercícios sem metadados
pnpm exec tsx --env-file=.env.local -c "
import { createAdminClient } from './lib/supabase/server.js';
const supabase = await createAdminClient();
const { data } = await supabase
  .from('exercises')
  .select('slug, title, url')
  .is('element', null)
  .order('title')
  .limit(50);
console.table(data);
"
```

### 2. Adicionar Metadados ao `exercicios-metadata.json`

Edite o arquivo `exercicios-metadata.json` na raiz do projeto:

```json
{
  "version": "1.0.0",
  "lastSync": null,
  "exercicios": {
    "slug-do-exercicio": {
      "duration_minutes": 10,
      "level": "INICIANTE",
      "element": "ÁGUA",
      "organs": ["RIM", "BEXIGA"],
      "benefits": [
        "Fortalece os rins",
        "Aumenta energia vital"
      ],
      "indications": [
        "fadiga",
        "dor_lombar",
        "fraqueza_pernas"
      ],
      "contraindications": [
        "Lesões graves na coluna"
      ]
    }
  }
}
```

### 3. Rodar Sincronização

```bash
pnpm sync-memberkit
```

Isso irá:
- Buscar todos os cursos do Memberkit
- Atualizar exercícios existentes
- Aplicar metadados do JSON aos exercícios correspondentes

## 📊 Campos Disponíveis

### **element** (Elemento MTC)
Valores permitidos:
- `ÁGUA` - Rins, Bexiga (medo, vitalidade, ossos)
- `FOGO` - Coração, Intestino Delgado (ansiedade, sono, circulação)
- `MADEIRA` - Fígado, Vesícula Biliar (raiva, tendões, visão)
- `METAL` - Pulmão, Intestino Grosso (tristeza, respiração, pele)
- `TERRA` - Baço, Estômago (preocupação, digestão, músculos)

### **level** (Nível de Dificuldade)
Valores permitidos:
- `INICIANTE` - Exercícios básicos, simples de executar
- `INTERMEDIÁRIO` - Requer alguma prática
- `AVANÇADO` - Requer domínio de fundamentos

### **organs** (Órgãos MTC)
Array com um ou mais órgãos:
- `PULMÃO`, `INTESTINO_GROSSO` (Metal)
- `RIM`, `BEXIGA` (Água)
- `FÍGADO`, `VESÍCULA_BILIAR` (Madeira)
- `CORAÇÃO`, `INTESTINO_DELGADO` (Fogo)
- `BAÇO`, `ESTÔMAGO` (Terra)

### **indications** (Sintomas/Indicações)
Array de sintomas para busca. Sintomas comuns:

**Emocionais:**
- `ansiedade`, `estresse`, `nervosismo`
- `insônia`, `sono_ruim`
- `raiva`, `irritação`
- `tristeza`, `melancolia`
- `preocupação`, `pensamento_excessivo`

**Físicos:**
- `dor_lombar`, `dor_coluna`
- `dor_pescoço`, `dor_ombro`
- `dor_joelho`, `dor_quadril`
- `dor_cabeça`, `enxaqueca`
- `fadiga`, `cansaço`, `falta_energia`
- `digestão`, `má_digestão`
- `pressão_alta`, `hipertensão`
- `zumbido`, `labirintite`
- `respiração_curta`, `falta_ar`

### **benefits** (Benefícios)
Array descritivo dos benefícios do exercício:
- "Fortalece os rins"
- "Melhora a circulação"
- "Alonga a coluna"
- "Acalma a mente"
- "Aumenta energia vital"

### **contraindications** (Contraindicações)
Array com situações onde o exercício não deve ser praticado:
- "Lesões agudas na coluna"
- "Hérnia de disco grave"
- "Gravidez avançada"
- "Pressão muito alta não controlada"

### **duration_minutes** (Duração)
Número inteiro com a duração aproximada em minutos.

## 🎯 Estratégia de Curadoria

### Prioridade 1: Exercícios Mais Populares
Comece pelos exercícios mais procurados:
1. Ba Duan Jin (8 Brocados)
2. Yi Jin Jing (Transformação dos Músculos e Tendões)
3. Respirações básicas
4. Wu Qin Xi (5 Animais)

### Prioridade 2: Por Sintoma
Cure exercícios focados em problemas comuns:
1. **Ansiedade/Estresse** → Elemento FOGO
2. **Dor Lombar** → Elemento ÁGUA
3. **Insônia** → Elemento FOGO
4. **Fadiga** → Elemento ÁGUA
5. **Digestão** → Elemento TERRA

### Prioridade 3: Por Nível
Garanta variedade em cada nível:
1. INICIANTE - Base sólida
2. INTERMEDIÁRIO - Progressão
3. AVANÇADO - Desafios

## 📝 Template de Curadoria

Use este template para curar novos exercícios:

```json
{
  "slug-do-exercicio": {
    "duration_minutes": 0,       // 👈 Minutos aproximados
    "level": "INICIANTE",        // 👈 INICIANTE | INTERMEDIÁRIO | AVANÇADO
    "element": "ÁGUA",           // 👈 ÁGUA | FOGO | MADEIRA | METAL | TERRA
    "organs": [],                // 👈 ["RIM", "PULMÃO", etc]
    "benefits": [],              // 👈 ["Benefício 1", "Benefício 2"]
    "indications": [],           // 👈 ["sintoma_1", "sintoma_2"]
    "contraindications": []      // 👈 ["Contraindicação 1"]
  }
}
```

## 🔍 Como Identificar o Slug

O slug é a última parte da URL do exercício:

```
https://memberkit.com.br/lessons/respiracao-la-sal
                                  ^^^^^^^^^^^^^^^^
                                    Este é o slug
```

Ou busque no banco:

```bash
pnpm exec tsx --env-file=.env.local scripts/check-exercises.ts
```

## ✅ Verificação

Após adicionar metadados e rodar `pnpm sync-memberkit`, verifique:

```bash
pnpm exec tsx --env-file=.env.local scripts/test-exercise-search.ts
```

Deve mostrar:
- ✅ Exercícios por elemento
- ✅ Exercícios por nível
- ✅ Exercícios por sintoma

## 📊 Status Atual

```bash
# Ver quantos exercícios têm metadados
SELECT 
  COUNT(*) FILTER (WHERE element IS NOT NULL) as com_metadados,
  COUNT(*) FILTER (WHERE element IS NULL) as sem_metadados,
  COUNT(*) as total
FROM exercises;
```

**Meta:** Curar pelo menos 50 exercícios essenciais para ter uma boa base de recomendações.

## 🎓 Exemplo Completo

```json
{
  "version": "1.0.0",
  "lastSync": null,
  "exercicios": {
    "ba-duan-jin-sustentar-o-ceu": {
      "duration_minutes": 5,
      "level": "INICIANTE",
      "element": "TERRA",
      "organs": ["BAÇO", "ESTÔMAGO"],
      "benefits": [
        "Alonga a coluna vertebral",
        "Estimula o Triplo Aquecedor",
        "Melhora a circulação de energia"
      ],
      "indications": [
        "digestão",
        "tensão_ombros",
        "fadiga"
      ],
      "contraindications": [
        "Lesões nos ombros"
      ]
    },
    "yi-jin-jing-as-tres-reverencias": {
      "duration_minutes": 8,
      "level": "INTERMEDIÁRIO",
      "element": "ÁGUA",
      "organs": ["RIM"],
      "benefits": [
        "Fortalece a região lombar",
        "Nutre os Rins",
        "Aumenta a flexibilidade da coluna"
      ],
      "indications": [
        "dor_lombar",
        "fadiga",
        "fraqueza_pernas"
      ],
      "contraindications": [
        "Hérnia de disco aguda",
        "Lesões graves na coluna"
      ]
    }
  }
}
```

## 🚀 Próximos Passos

1. **Identificar top 50 exercícios** mais importantes
2. **Curar metadados** de cada um
3. **Testar busca** com sintomas reais
4. **Validar recomendações** do Mestre Ye
5. **Expandir gradualmente** a base curada

---

**💡 Dica:** Comece pequeno! Cure 10-15 exercícios essenciais e teste. Depois expanda conforme necessidade dos usuários.

import type { QuizLead } from '@/lib/types/anamnese'

/**
 * Helpers para trabalhar com dados de anamnese
 */

export function getDescricaoQuadrante(quadrante: number): string {
  const descricoes: Record<number, string> = {
    1: 'Alta intensidade + Alta urgência',
    2: 'Alta intensidade + Baixa urgência',
    3: 'Baixa intensidade + Alta urgência',
    4: 'Baixa intensidade + Baixa urgência'
  }
  return descricoes[quadrante] || 'Quadrante indefinido'
}

export function getDescricaoIntensidade(intensidade: number): string {
  if (intensidade >= 4) return 'severa'
  if (intensidade >= 3) return 'moderada'
  return 'leve'
}

export function getElementosSecundarios(
  contagem: QuizLead['contagem_elementos'],
  elementoPrincipal: string
): string[] {
  if (!contagem || typeof contagem !== 'object') {
    return []
  }
  
  return Object.entries(contagem)
    .filter(([elem, score]) => 
      elem !== elementoPrincipal && score > 2
    )
    .sort(([, a], [, b]) => b - a)
    .map(([elem]) => elem)
}

export function getNomeElemento(elemento: string): string {
  const nomes: Record<string, string> = {
    'RIM': 'Água (Rins)',
    'FÍGADO': 'Madeira (Fígado)',
    'BAÇO': 'Terra (Baço)',
    'CORAÇÃO': 'Fogo (Coração)',
    'PULMÃO': 'Metal (Pulmões)'
  }
  return nomes[elemento] || elemento
}

export function getEmojiElemento(elemento: string): string {
  const emojis: Record<string, string> = {
    'RIM': '🌊',
    'FÍGADO': '🌳',
    'BAÇO': '🏔️',
    'CORAÇÃO': '🔥',
    'PULMÃO': '⚙️'
  }
  return emojis[elemento] || '✨'
}

export function buildAnamneseContext(anamnese: QuizLead): string {
  // Validar dados essenciais
  if (!anamnese || !anamnese.contagem_elementos || !anamnese.elemento_principal) {
    console.error('Anamnese incompleta:', anamnese)
    return buildNoAnamneseContext()
  }

  const elementosSecundarios = getElementosSecundarios(
    anamnese.contagem_elementos,
    anamnese.elemento_principal
  )
  
  const temElementosSecundarios = elementosSecundarios.length > 0
  
  // Type-safe access to contagem_elementos
  type ElementoKey = keyof QuizLead['contagem_elementos']
  
  const pontuacaoPrincipal = anamnese.contagem_elementos[anamnese.elemento_principal] || 0
  
  return `
ANAMNESE DOS 5 ELEMENTOS DO USUÁRIO:

📋 DADOS BÁSICOS:
- Nome: ${anamnese.nome || 'Não informado'}
- Perfil: ${anamnese.arquetipo || 'Não definido'}

🎯 DIAGNÓSTICO MTC:
- Elemento Principal: ${anamnese.elemento_principal} (${getNomeElemento(anamnese.elemento_principal)})
- Pontuação: ${pontuacaoPrincipal} pontos
- Código de Perfil: ${anamnese.codigo_perfil || 'N/A'}

📊 CONTAGEM POR ELEMENTO:
${Object.entries(anamnese.contagem_elementos)
  .sort(([, a], [, b]) => b - a)
  .map(([elem, score]) => `  ${getEmojiElemento(elem)} ${getNomeElemento(elem)}: ${score} pontos ${elem === anamnese.elemento_principal ? '⭐ PRINCIPAL' : score > 2 ? '⚠️ ATENÇÃO' : ''}`)
  .join('\n')}

📈 INTENSIDADE E URGÊNCIA:
- Intensidade das dores: ${anamnese.intensidade_calculada || 0}/5 (${getDescricaoIntensidade(anamnese.intensidade_calculada || 0)})
- Urgência para resolver: ${anamnese.urgencia_calculada || 0}/5
- Quadrante: ${anamnese.quadrante || 0} (${getDescricaoQuadrante(anamnese.quadrante || 0)})

${temElementosSecundarios ? `
⚠️ ELEMENTOS SECUNDÁRIOS AFETADOS:
${elementosSecundarios.map(elem => 
  `  ${getEmojiElemento(elem)} ${getNomeElemento(elem)} (${anamnese.contagem_elementos[elem as ElementoKey]} pontos)`
).join('\n')}

IMPORTANTE: Há múltiplos elementos desequilibrados. Considere abordagem integrada, 
mas PRIORIZE o elemento principal (${anamnese.elemento_principal}) nas primeiras semanas.
` : `
✅ FOCO ÚNICO:
Apenas o elemento ${anamnese.elemento_principal} está significativamente afetado.
Direcione todo o tratamento para este elemento.
`}

💡 COMO USAR ESSES DADOS:
1. Mencione naturalmente o elemento principal e sua pontuação
2. Use conhecimento específico deste elemento (busca RAG já filtrada)
3. Adapte a intensidade das práticas ao nível ${anamnese.intensidade_calculada || 0}/5
4. ${anamnese.quadrante === 1 ? 'Urgência ALTA: recomendar início imediato' : 'Seguir progressão gradual'}

EXEMPLO DE MENÇÃO NATURAL:
"Olá ${anamnese.nome || 'amigo'}! Analisando sua Anamnese, vejo que seu Elemento ${getNomeElemento(anamnese.elemento_principal)} 
está com ${pontuacaoPrincipal} pontos, indicando um desequilíbrio ${getDescricaoIntensidade(anamnese.intensidade_calculada || 0)}..."
`.trim()
}

export function buildNoAnamneseContext(): string {
  return `
⚠️ IMPORTANTE: Este usuário NÃO realizou a Anamnese dos 5 Elementos.

COMO PROCEDER:
1. Responda de forma útil baseado apenas na pergunta atual
2. Use o conhecimento da base MTC (RAG) para dar respostas de qualidade
3. Após 2-3 trocas de mensagens, sugira NATURALMENTE fazer a Anamnese
4. Explique o benefício: diagnóstico preciso + exercícios personalizados

EXEMPLO DE SUGESTÃO:
"Para dar orientações mais precisas para o SEU caso, recomendo fazer 
nossa Anamnese dos 5 Elementos (5 minutos). Assim posso identificar 
exatamente qual elemento precisa de atenção. Quer fazer?"

NÃO: ❌ Seja insistente ❌ Recuse ajudar ❌ Respostas genéricas demais
SIM: ✅ Seja útil ✅ Use conhecimento MTC ✅ Ofereça valor ✅ Sugira naturalmente
`.trim()
}

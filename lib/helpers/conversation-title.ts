// lib/helpers/conversation-title.ts

/**
 * Gera um título curto e descritivo para a conversa baseado na mensagem inicial
 * Usa palavras-chave e padrões comuns para criar títulos relevantes
 */
export function generateConversationTitle(firstMessage: string): string {
  // Limpar e normalizar
  const text = firstMessage.trim().toLowerCase()
  
  // Limitar tamanho
  if (text.length > 50) {
    return text.substring(0, 50).trim() + '...'
  }
  
  // Capitalizar primeira letra de cada palavra importante
  return text
    .split(' ')
    .map((word, index) => {
      // Manter minúsculas para palavras pequenas (exceto primeira)
      if (index > 0 && ['de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'a', 'o', 'para', 'com'].includes(word)) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Versão usando IA para gerar título mais inteligente (opcional, usa créditos)
 */
export function generateSmartTitle(firstMessage: string): string {
  const text = firstMessage.trim()
  
  // Padrões comuns
  const patterns = [
    { regex: /quero\s+(fazer|praticar|aprender)\s+(.+)/i, extract: (m: RegExpMatchArray) => m[2] },
    { regex: /(?:me\s+)?(?:ajuda|ajude|pode\s+ajudar).*com\s+(.+)/i, extract: (m: RegExpMatchArray) => `Ajuda: ${m[1]}` },
    { regex: /(?:estou|to)\s+(?:com|sentindo)\s+(.+)/i, extract: (m: RegExpMatchArray) => m[1] },
    { regex: /(?:como|o\s+que)\s+(?:fazer|faço)\s+(?:para|pra)\s+(.+)/i, extract: (m: RegExpMatchArray) => m[1] },
    { regex: /tenho\s+(.+)/i, extract: (m: RegExpMatchArray) => m[1] },
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern.regex)
    if (match) {
      const title = pattern.extract(match)
      return title.charAt(0).toUpperCase() + title.slice(1).substring(0, 50)
    }
  }

  // Fallback: pegar primeiras palavras significativas
  return generateConversationTitle(text)
}

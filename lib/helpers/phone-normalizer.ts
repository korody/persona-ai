// lib/helpers/phone-normalizer.ts
// Normalização de telefone para matching robusto

/**
 * Normaliza telefone removendo formatação e padronizando
 * Exemplos:
 * - "(11) 98765-4321" -> "5511987654321"
 * - "+55 11 9 8765-4321" -> "5511987654321"
 * - "11987654321" -> "5511987654321"
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '')
  
  // Se está vazio após limpeza, retorna null
  if (!cleaned) return null
  
  // Adicionar código do país (55) se não tiver
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  
  // Remover 9º dígito duplicado (erro comum)
  // Ex: 5511998765432 -> 5511987654321
  if (cleaned.length === 13 && cleaned.charAt(4) === '9' && cleaned.charAt(5) === '9') {
    cleaned = cleaned.slice(0, 4) + cleaned.slice(5)
  }
  
  // Validar tamanho final (deve ter 12 ou 13 dígitos)
  // 12: 55 + DDD (2) + número (8) - fixo
  // 13: 55 + DDD (2) + 9 + número (8) - celular
  if (cleaned.length < 12 || cleaned.length > 13) {
    return null
  }
  
  return cleaned
}

/**
 * Gera variações do telefone para busca mais flexível
 * Retorna array com: [normalizado, sem país, sem DDD]
 */
export function generatePhoneVariations(phone: string | null | undefined): string[] {
  const normalized = normalizePhone(phone)
  if (!normalized) return []
  
  const variations: string[] = [normalized]
  
  // Sem código do país (11987654321)
  if (normalized.startsWith('55')) {
    variations.push(normalized.slice(2))
  }
  
  // Sem 9º dígito (5511987654321 -> 551187654321)
  if (normalized.length === 13 && normalized.charAt(4) === '9') {
    variations.push(normalized.slice(0, 4) + normalized.slice(5))
  }
  
  return [...new Set(variations)] // Remove duplicatas
}

/**
 * Verifica se dois telefones são iguais após normalização
 */
export function phonesMatch(phone1: string | null | undefined, phone2: string | null | undefined): boolean {
  const normalized1 = normalizePhone(phone1)
  const normalized2 = normalizePhone(phone2)
  
  if (!normalized1 || !normalized2) return false
  
  return normalized1 === normalized2
}

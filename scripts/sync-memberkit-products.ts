/**
 * Sync Memberkit Products
 * Sincroniza os cursos do Memberkit para a tabela avatar_products
 * Preenche o campo memberkit_product_id com o ID do curso
 */

import 'dotenv/config'
import { syncProducts } from '../lib/memberkit/sync'

async function main() {
  const avatarSlug = 'mestre-ye'
  
  console.log('?? Iniciando sincronização de produtos do Memberkit...\n')
  
  try {
    const result = await syncProducts(avatarSlug)
    
    if (result.errors.length === 0) {
      console.log('? Sincronização concluída com sucesso!')
      process.exit(0)
    } else {
      console.log('??  Sincronização concluída com erros')
      process.exit(1)
    }
  } catch (error) {
    console.error('? Erro fatal:', error)
    process.exit(1)
  }
}

main()

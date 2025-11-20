/**
 * Script para adicionar colunas temperature e max_tokens na tabela avatars
 * Como não temos acesso a funções RPC customizadas, vamos usar uma API route
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function addColumns() {
  console.log('🔧 Adicionando colunas via API route...\n')
  
  const response = await fetch('http://localhost:3002/api/admin/migrate-avatar-columns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  const result = await response.json()
  console.log('📝 Resultado:', result)
}

addColumns()

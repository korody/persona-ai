/**
 * Força reload do schema cache do PostgREST
 */

async function reloadCache() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

  console.log('\n🔄 RECARREGANDO CACHE DO POSTGREST\n')
  console.log('='.repeat(70))

  try {
    // Método 1: NOTIFY via SQL
    const response1 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: "NOTIFY pgrst, 'reload schema';" })
    })

    console.log('📡 NOTIFY enviado:', response1.status)

    // Método 2: Endpoint de reload (se existir)
    const response2 = await fetch(`${SUPABASE_URL}/rest/`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'handling=strict'
      }
    })

    console.log('🔄 Schema reload:', response2.status)

    // Aguardar 3 segundos
    console.log('\n⏳ Aguardando 3 segundos...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    console.log('\n✅ Cache deve estar atualizado agora!\n')
    console.log('💡 Se ainda houver erros, aguarde 1 minuto e tente novamente.')
    console.log('   O PostgREST recarrega o cache automaticamente a cada minuto.\n')

  } catch (error: any) {
    console.error('❌ Erro:', error.message)
  }
}

reloadCache().catch(console.error)

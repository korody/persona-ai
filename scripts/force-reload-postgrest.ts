import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function forceReload() {
  console.log('🔄 Forçando reload do schema do PostgREST...\n')

  try {
    // Método 1: Via NOTIFY
    const { error: notifyError } = await supabase.rpc('exec', {
      sql: "NOTIFY pgrst, 'reload schema';"
    })
    
    if (notifyError) {
      console.log('⚠️  NOTIFY falhou:', notifyError.message)
    } else {
      console.log('✅ NOTIFY enviado com sucesso')
    }

    // Aguardar processamento
    console.log('\n⏳ Aguardando 5 segundos...\n')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Método 2: Testar se a função está visível agora
    console.log('🧪 Testando se search_knowledge está visível...')
    
    const { data, error } = await supabase.rpc('search_knowledge', {
      p_avatar_id: '4ba4ff39-823a-4aa9-a129-8f23fec2704d',
      p_query_embedding: new Array(1536).fill(0),
      p_similarity_threshold: 0.5,
      p_limit: 5
    })

    if (error) {
      console.log('❌ Função ainda não visível:', error.message)
      console.log('\n💡 SOLUÇÃO: Acesse o dashboard do Supabase:')
      console.log('   https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/settings/database')
      console.log('   Clique em "Reload schema" manualmente\n')
    } else {
      console.log('✅ Função visível! Cache atualizado com sucesso!')
      console.log('   Resultados:', data)
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

forceReload()

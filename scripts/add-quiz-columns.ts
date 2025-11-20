/**
 * Adiciona colunas calculadas na tabela quiz_leads
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function addColumns() {
  console.log('🔧 Adicionando colunas calculadas na tabela quiz_leads...\n')

  // Tentar inserir com as novas colunas para forçar a criação (vai falhar mas queremos ver o erro)
  const testData = {
    email: 'test@test.com',
    nome: 'Test',
    contagem_elementos: { MADEIRA: 0, FOGO: 0, TERRA: 0, METAL: 0, ÁGUA: 0, BAÇO: 0 },
    intensidade_calculada: 0
  }

  const { error } = await supabase
    .from('quiz_leads')
    .insert(testData)

  if (error) {
    if (error.message.includes('contagem_elementos')) {
      console.log('❌ Coluna contagem_elementos não existe ainda\n')
      console.log('📝 Por favor, execute este SQL no Supabase SQL Editor:\n')
      console.log('─'.repeat(60))
      console.log(`
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS contagem_elementos JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS intensidade_calculada INT DEFAULT 0;

COMMENT ON COLUMN quiz_leads.contagem_elementos IS 'Contagem de respostas por elemento';
COMMENT ON COLUMN quiz_leads.intensidade_calculada IS 'Score do elemento principal';

CREATE INDEX IF NOT EXISTS idx_quiz_leads_elemento_principal 
ON quiz_leads(elemento_principal);
      `)
      console.log('─'.repeat(60))
      console.log('\n✅ Após executar o SQL acima, rode este script novamente')
    } else {
      console.log('Outro erro:', error)
    }
    return
  }

  // Se chegou aqui, as colunas existem - limpar o teste
  await supabase
    .from('quiz_leads')
    .delete()
    .eq('email', 'test@test.com')

  console.log('✅ Colunas já existem!')
}

addColumns().catch(console.error)

import { createAdminClient } from '../lib/supabase/server.js'

async function getTableSchema() {
  const supabase = await createAdminClient()
  
  // Query raw SQL para pegar a definição da tabela
  const { data, error } = await supabase.rpc('exec_raw_sql', {
    sql: `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'exercises'
      ORDER BY ordinal_position;
    `
  })
  
  if (error) {
    console.error('Erro:', error)
  } else {
    console.log('Schema da tabela exercises:')
    console.table(data)
  }
  
  // Tentar obter check constraints
  const { data: constraints } = await supabase.rpc('exec_raw_sql', {
    sql: `
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'exercises'::regclass
      AND contype = 'c';
    `
  })
  
  console.log('\nCheck Constraints:')
  console.log(constraints)
}

getTableSchema()

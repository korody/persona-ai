import pg from 'pg'
import fs from 'fs'

const { Client } = pg

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })
  
  try {
    await client.connect()
    console.log('✅ Conectado ao banco\n')
    
    const sql = fs.readFileSync('supabase/migrations/fix-constraints.sql', 'utf-8')
    console.log('📜 Migration SQL:\n', sql, '\n')
    
    await client.query(sql)
    
    console.log('✅ Migration executada com sucesso!')
    
    // Testar constraints
    console.log('\n🧪 Testando novos constraints...')
    
    const testValues = ['ÁGUA', 'TERRA', 'FOGO', 'METAL', 'MADEIRA']
    for (const element of testValues) {
      try {
        await client.query(`
          INSERT INTO exercises (
            memberkit_course_id,
            memberkit_section_id,
            memberkit_lesson_id,
            title,
            slug,
            url,
            position,
            element
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, ['test', 'test', `test-${element}`, 'Test', `test-${element}`, 'https://test.com', 1, element])
        
        console.log(`✅ ${element}: ACEITO`)
        
        // Limpar teste
        await client.query(`DELETE FROM exercises WHERE memberkit_lesson_id = $1`, [`test-${element}`])
      } catch (err) {
        console.log(`❌ ${element}: ${err.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await client.end()
  }
}

runMigration()

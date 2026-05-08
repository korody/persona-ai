
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listUsers() {
  console.log('Fetching users...')
  const { data: { users }, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  console.log(`Found ${users.length} users:`)
  users.forEach(user => {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'N/A'
    console.log(`- ${fullName} (${user.email})`)
  })
}

listUsers().catch(console.error)

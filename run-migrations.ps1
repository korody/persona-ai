# Executar migrations usando Supabase CLI
# 
# IMPORTANTE: Substitua [SUA_SENHA] pela senha do banco de dados
# Você encontra a senha em: https://supabase.com/dashboard/project/kfkhdfnkwhljhhjcvbqp/settings/database

# Opção 1: Executar arquivo SQL direto
Get-Content supabase/EXECUTE-THIS.sql | supabase db execute --db-url "postgresql://postgres:[SUA_SENHA]@db.kfkhdfnkwhljhhjcvbqp.supabase.co:5432/postgres"

# Opção 2: Usar o comando db push (se tiver migrations configuradas)
# supabase db push --db-url "postgresql://postgres:[SUA_SENHA]@db.kfkhdfnkwhljhhjcvbqp.supabase.co:5432/postgres"

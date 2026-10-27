-- Busca o id da conta pelo e-mail sem listar todas as contas (listUsers só traz 50).
-- Só a chave secreta (service_role) pode chamar. Aplicada em produção em 27/10/2026.
create or replace function public.find_auth_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where email = lower(trim(p_email)) limit 1;
$$;
revoke execute on function public.find_auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_auth_user_id_by_email(text) to service_role;

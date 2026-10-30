-- 29/10/2026: as políticas admin_view_* liberavam SELECT para o papel public com USING (true), ou seja,
-- qualquer pessoa com a chave pública lia TODAS as conversas, mensagens e a tabela users.
-- O painel admin passou a ler com a chave de servidor (createAdminClient), então elas saem.
-- Cada pessoa continua lendo só o que é dela pelas políticas "Users can view own ...".
drop policy if exists admin_view_conversations on public.conversations;
drop policy if exists admin_view_messages on public.messages;
drop policy if exists admin_view_users on public.users;

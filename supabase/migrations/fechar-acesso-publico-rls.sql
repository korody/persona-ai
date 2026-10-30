-- =====================================================================
-- Fecha o acesso da chave pública (anon) às 9 tabelas que estavam sem RLS.
-- Antes: anon podia ler, gravar, alterar e apagar quiz_leads (anamneses),
-- whatsapp_logs, a base de conhecimento e os prompts do Mestre Digital.
--
-- PRÉ-REQUISITO: o quiz (projeto Vercel diagnostico-mtc) já publicado usando a
-- SUPABASE_SECRET_API_KEY em lib/supabase.js. Sem isso, a captação para.
--
-- Quem continua funcionando:
--   - tudo que usa a chave secreta (quiz, rotas admin e chat do persona-ai): ignora RLS
--   - a aluna logada lê a própria anamnese (selo do quiz, /api/quiz/diagnosis)
--   - catálogos (avatar_portfolio, hub_courses) seguem legíveis, só sem escrita pública
--   - telas admin do persona-ai (campanhas, produtos) para os e-mails admin
-- Quem para até ser ajustado: lead-dashboard (lê quiz_leads/dash_campaigns pelo navegador).
-- =====================================================================

begin;

-- Mesma lista de lib/auth/admin-check.ts
create or replace function public.is_persona_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') in (
    'marko@persona.cx', 'admin@qigongbrasil.com', 'yexin828@hotmail.com'
  );
$$;

-- 1) Liga o RLS
alter table public.quiz_leads             enable row level security;
alter table public.whatsapp_logs          enable row level security;
alter table public.avatar_knowledge_base  enable row level security;
alter table public.avatar_prompt_versions enable row level security;
alter table public.avatar_examples        enable row level security;
alter table public.avatar_campaigns       enable row level security;
alter table public.avatar_portfolio       enable row level security;
alter table public.hub_courses            enable row level security;
alter table public.dash_campaigns         enable row level security;

-- 2) Tira da chave pública tudo o que não for leitura de catálogo
revoke all on public.quiz_leads, public.whatsapp_logs, public.avatar_knowledge_base,
  public.avatar_prompt_versions, public.avatar_examples, public.avatar_campaigns,
  public.dash_campaigns
  from anon;
revoke insert, update, delete, truncate on public.avatar_portfolio, public.hub_courses from anon;
revoke truncate on public.quiz_leads, public.whatsapp_logs, public.avatar_knowledge_base,
  public.avatar_prompt_versions, public.avatar_examples, public.avatar_campaigns,
  public.avatar_portfolio, public.hub_courses, public.dash_campaigns
  from authenticated;

-- 3) Políticas para quem usa a sessão da usuária
-- A dona lê a própria anamnese (por conta ligada ou pelo e-mail do login)
create policy quiz_leads_dona_le on public.quiz_leads
  for select to authenticated
  using (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'));

-- Catálogos: leitura aberta (o chat lê avatar_portfolio sem sessão); escrita só admin
create policy avatar_portfolio_le on public.avatar_portfolio
  for select to anon, authenticated using (true);
create policy avatar_portfolio_admin on public.avatar_portfolio
  for all to authenticated using (public.is_persona_admin()) with check (public.is_persona_admin());

create policy hub_courses_le on public.hub_courses
  for select to anon, authenticated using (true);
create policy hub_courses_admin on public.hub_courses
  for all to authenticated using (public.is_persona_admin()) with check (public.is_persona_admin());

-- Tela de campanhas do admin (campaign-manager.tsx, no navegador)
create policy avatar_campaigns_admin on public.avatar_campaigns
  for all to authenticated using (public.is_persona_admin()) with check (public.is_persona_admin());

-- whatsapp_logs, avatar_knowledge_base, avatar_prompt_versions, avatar_examples e
-- dash_campaigns ficam sem política: só a chave secreta acessa.

commit;

-- ---------------------------------------------------------------------
-- DESFAZER (se algo parar): volta exatamente ao estado anterior
-- ---------------------------------------------------------------------
-- begin;
-- drop policy if exists quiz_leads_dona_le on public.quiz_leads;
-- drop policy if exists avatar_portfolio_le on public.avatar_portfolio;
-- drop policy if exists avatar_portfolio_admin on public.avatar_portfolio;
-- drop policy if exists hub_courses_le on public.hub_courses;
-- drop policy if exists hub_courses_admin on public.hub_courses;
-- drop policy if exists avatar_campaigns_admin on public.avatar_campaigns;
-- alter table public.quiz_leads disable row level security;
-- alter table public.whatsapp_logs disable row level security;
-- alter table public.avatar_knowledge_base disable row level security;
-- alter table public.avatar_prompt_versions disable row level security;
-- alter table public.avatar_examples disable row level security;
-- alter table public.avatar_campaigns disable row level security;
-- alter table public.avatar_portfolio disable row level security;
-- alter table public.hub_courses disable row level security;
-- alter table public.dash_campaigns disable row level security;
-- grant all on public.quiz_leads, public.whatsapp_logs, public.avatar_knowledge_base,
--   public.avatar_prompt_versions, public.avatar_examples, public.avatar_campaigns,
--   public.avatar_portfolio, public.hub_courses, public.dash_campaigns to anon, authenticated;
-- drop function if exists public.is_persona_admin();
-- commit;

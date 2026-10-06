import { createAdminClient } from '@/lib/supabase/server'

// Estimativa de custo da API Anthropic (claude-sonnet-4-6: $3/M input, $15/M output).
// O app ainda não grava tokens por mensagem, então usamos médias aproximadas
// (prompt de sistema + base de conhecimento + histórico ≈ 8k tokens de entrada).
// Para o valor real, consulte console.anthropic.com → Usage.
const EST_INPUT_TOKENS_PER_MSG = 8000
const EST_OUTPUT_TOKENS_PER_MSG = 500
const INPUT_USD_PER_M = 3
const OUTPUT_USD_PER_M = 15
export const EST_COST_PER_MSG_USD =
  (EST_INPUT_TOKENS_PER_MSG * INPUT_USD_PER_M + EST_OUTPUT_TOKENS_PER_MSG * OUTPUT_USD_PER_M) / 1_000_000

const TIMEZONE = 'America/Sao_Paulo'
const DAY_MS = 24 * 60 * 60 * 1000

export type UsageStats = {
  periodDays: number
  totalUsers: number
  everUsed: number
  activeToday: number
  active7d: number
  active30d: number
  periodMessages: number
  periodActiveUsers: number
  daily: { date: string; messages: number; users: number }[]
  buckets: { label: string; users: number }[]
  topUsers: { userId: string; email: string; name: string; messages: number; lastAt: string }[]
  estCostUsd: number
}

function dayKey(date: Date) {
  // YYYY-MM-DD no fuso de São Paulo
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

async function fetchMessageEvents() {
  const supabase = createAdminClient()
  const rows: { user_id: string; created_at: string }[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('user_id, created_at')
      .eq('type', 'message_sent')
      .order('created_at', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(`Falha ao buscar uso: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return rows
}

function distinctUsersSince(rows: { user_id: string; created_at: string }[], since: number) {
  return new Set(rows.filter(r => new Date(r.created_at).getTime() >= since).map(r => r.user_id)).size
}

export async function getUsageStats(periodDays: number): Promise<UsageStats> {
  const supabase = createAdminClient()
  const now = Date.now()

  const [rows, { count: totalUsers }] = await Promise.all([
    fetchMessageEvents(),
    supabase.from('credits').select('*', { count: 'exact', head: true }),
  ])

  const todayKey = dayKey(new Date(now))
  const periodStart = now - periodDays * DAY_MS
  const periodRows = rows.filter(r => new Date(r.created_at).getTime() >= periodStart)

  // Série diária (inclui dias sem uso)
  const dailyMap = new Map<string, { messages: number; users: Set<string> }>()
  for (let i = periodDays - 1; i >= 0; i--) {
    dailyMap.set(dayKey(new Date(now - i * DAY_MS)), { messages: 0, users: new Set() })
  }
  for (const r of periodRows) {
    const day = dailyMap.get(dayKey(new Date(r.created_at)))
    if (day) {
      day.messages++
      day.users.add(r.user_id)
    }
  }

  // Mensagens por usuário no período
  const perUser = new Map<string, { messages: number; lastAt: string }>()
  for (const r of periodRows) {
    const u = perUser.get(r.user_id) ?? { messages: 0, lastAt: r.created_at }
    u.messages++
    if (r.created_at > u.lastAt) u.lastAt = r.created_at
    perUser.set(r.user_id, u)
  }
  const counts = [...perUser.values()].map(u => u.messages)
  const bucket = (lo: number, hi: number) => counts.filter(c => c >= lo && c <= hi).length

  const top = [...perUser.entries()].sort((a, b) => b[1].messages - a[1].messages).slice(0, 15)
  const topUsers = await Promise.all(
    top.map(async ([userId, u]) => {
      const { data } = await supabase.auth.admin.getUserById(userId)
      const meta = data.user?.user_metadata as Record<string, string> | undefined
      return {
        userId,
        email: data.user?.email ?? '(sem email)',
        name: meta?.full_name || meta?.name || '',
        messages: u.messages,
        lastAt: u.lastAt,
      }
    })
  )

  return {
    periodDays,
    totalUsers: totalUsers ?? 0,
    everUsed: new Set(rows.map(r => r.user_id)).size,
    activeToday: new Set(rows.filter(r => dayKey(new Date(r.created_at)) === todayKey).map(r => r.user_id)).size,
    active7d: distinctUsersSince(rows, now - 7 * DAY_MS),
    active30d: distinctUsersSince(rows, now - 30 * DAY_MS),
    periodMessages: periodRows.length,
    periodActiveUsers: perUser.size,
    daily: [...dailyMap.entries()].map(([date, d]) => ({ date, messages: d.messages, users: d.users.size })),
    buckets: [
      { label: '1–5 mensagens', users: bucket(1, 5) },
      { label: '6–10 mensagens', users: bucket(6, 10) },
      { label: '11–20 mensagens', users: bucket(11, 20) },
      { label: 'Mais de 20', users: bucket(21, Infinity) },
    ],
    topUsers,
    estCostUsd: periodRows.length * EST_COST_PER_MSG_USD,
  }
}

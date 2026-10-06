import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdmin } from '@/lib/auth/admin-check'
import { getUsageStats, EST_COST_PER_MSG_USD } from '@/lib/admin/usage'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const PERIODS = [7, 30, 90]

const fmt = new Intl.NumberFormat('pt-BR')
const pct = (part: number, total: number) =>
  total > 0 ? `${((part / total) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '0%'

function formatDay(date: string) {
  const [, m, d] = date.split('-')
  return `${d}/${m}`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="bg-card border rounded-lg p-5">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>
}) {
  if (!(await isAdmin())) {
    redirect('/auth?redirect=/admin/usage')
  }

  const { dias } = await searchParams
  const periodDays = PERIODS.includes(Number(dias)) ? Number(dias) : 30
  const stats = await getUsageStats(periodDays)

  const maxDaily = Math.max(1, ...stats.daily.map(d => d.messages))
  const maxBucket = Math.max(1, ...stats.buckets.map(b => b.users))
  const neverUsed = stats.totalUsers - stats.everUsed
  const avgPerActive = stats.periodActiveUsers > 0 ? stats.periodMessages / stats.periodActiveUsers : 0

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Uso dos Alunos</h1>
          <p className="text-sm text-muted-foreground">Mensagens enviadas ao Mestre Ye (1 mensagem = 1 crédito)</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {PERIODS.map(p => (
            <Link
              key={p}
              href={`/admin/usage?dias=${p}`}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                p === periodDays ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {p} dias
            </Link>
          ))}
        </div>
      </div>

      {/* Engajamento geral */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ativos hoje" value={fmt.format(stats.activeToday)} />
        <StatCard title="Ativos 7 dias" value={fmt.format(stats.active7d)} />
        <StatCard title="Ativos 30 dias" value={fmt.format(stats.active30d)} hint={`${pct(stats.active30d, stats.totalUsers)} da base`} />
        <StatCard
          title="Nunca usaram o chat"
          value={fmt.format(neverUsed)}
          hint={`${pct(neverUsed, stats.totalUsers)} de ${fmt.format(stats.totalUsers)} cadastrados`}
        />
      </section>

      {/* Período selecionado */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={`Mensagens (${periodDays}d)`} value={fmt.format(stats.periodMessages)} />
        <StatCard title={`Alunos que usaram (${periodDays}d)`} value={fmt.format(stats.periodActiveUsers)} />
        <StatCard
          title="Média por aluno ativo"
          value={avgPerActive.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          hint="mensagens no período"
        />
        <StatCard
          title={`Custo estimado API (${periodDays}d)`}
          value={`US$ ${stats.estCostUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          hint={`~US$ ${EST_COST_PER_MSG_USD.toFixed(3)} por mensagem (estimativa)`}
        />
      </section>

      {/* Mensagens por dia */}
      <section className="bg-card border rounded-lg p-5">
        <h2 className="font-semibold mb-4">Mensagens por dia</h2>
        <div className="flex items-end gap-[2px] h-48">
          {stats.daily.map(d => (
            <div key={d.date} className="flex-1 h-full flex flex-col justify-end group relative">
              <div
                className="bg-green-500/80 group-hover:bg-green-500 rounded-t-sm min-h-[1px]"
                style={{ height: `${(d.messages / maxDaily) * 100}%` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap rounded bg-popover border px-2 py-1 text-xs shadow z-10">
                {formatDay(d.date)}: {d.messages} msg · {d.users} aluno{d.users === 1 ? '' : 's'}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{formatDay(stats.daily[0].date)}</span>
          <span>{formatDay(stats.daily[stats.daily.length - 1].date)}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faixas de uso */}
        <section className="bg-card border rounded-lg p-5">
          <h2 className="font-semibold mb-1">Intensidade de uso</h2>
          <p className="text-xs text-muted-foreground mb-4">Alunos por quantidade de mensagens em {periodDays} dias</p>
          <div className="space-y-3">
            {stats.buckets.map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.label}</span>
                  <span className="font-medium">{fmt.format(b.users)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${(b.users / maxBucket) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ranking */}
        <section className="bg-card border rounded-lg p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Quem mais usa ({periodDays} dias)</h2>
          {stats.topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma mensagem no período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-2 font-medium">#</th>
                    <th className="py-2 pr-2 font-medium">Aluno</th>
                    <th className="py-2 pr-2 font-medium text-right">Mensagens</th>
                    <th className="py-2 font-medium text-right">Último uso</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topUsers.map((u, i) => (
                    <tr key={u.userId} className="border-b last:border-0">
                      <td className="py-2 pr-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 pr-2">
                        <div className="font-medium">{u.name || u.email}</div>
                        {u.name && <div className="text-xs text-muted-foreground">{u.email}</div>}
                      </td>
                      <td className="py-2 pr-2 text-right font-medium">{u.messages}</td>
                      <td className="py-2 text-right text-muted-foreground">{formatDateTime(u.lastAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

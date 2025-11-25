// app/settings/credits/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCredits } from '@/hooks/use-credits'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCreditTransaction } from '@/lib/utils'
import { Loader2, Sparkles, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  created_at: string
}

export default function CreditsPage() {
  const { credits, isLoading: creditsLoading } = useCredits()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const res = await fetch('/api/credits/transactions?limit=50', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      
      <div className="flex-1 overflow-y-auto bg-muted/10">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">Meus Créditos</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe seu saldo e histórico de transações
            </p>
          </div>

          {/* Saldo atual */}
          <Card className="p-6 mb-6">
            {creditsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                    <h2 className="text-4xl font-bold">
                      {credits?.total || 0}
                    </h2>
                  </div>
                  <p className="text-muted-foreground">
                    {credits?.total === 1 ? 'crédito disponível' : 'créditos disponíveis'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground mb-1">Mensais</p>
                    <p className="text-2xl font-semibold">{credits?.balance || 0}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground mb-1">Bônus</p>
                    <p className="text-2xl font-semibold">{credits?.bonus_balance || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total ganho:</span>
                    <span className="ml-2 font-semibold">{credits?.total_earned || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total gasto:</span>
                    <span className="ml-2 font-semibold">{credits?.total_spent || 0}</span>
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <Link href="/pricing">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Comprar mais créditos
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Histórico */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Histórico de Transações</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma transação ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const isPositive = transaction.amount > 0
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                          ${isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                        `}>
                          {isPositive ? (
                            <TrendingUp className="h-5 w-5" />
                          ) : (
                            <TrendingDown className="h-5 w-5" />
                          )}
                        </div>
                        
                        <div>
                          <p className="font-medium">
                            {formatCreditTransaction(transaction.type)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                          {transaction.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={`text-lg font-semibold ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? '+' : ''}{transaction.amount}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

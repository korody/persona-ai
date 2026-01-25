'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getUserDetails, updateUserCredits } from '@/lib/admin/actions'
import { Clock, MessageSquare, CreditCard, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserDetailModalProps {
  user: any | null
  isOpen: boolean
  onClose: () => void
}

export function UserDetailModal({ user, isOpen, onClose }: UserDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [creditAmount, setCreditAmount] = useState<string>('')
  const [creditReason, setCreditReason] = useState<string>('Ajuste administrativo')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      loadDetails()
    } else {
      setDetails(null)
      setError(null)
    }
  }, [user, isOpen])

  async function loadDetails() {
    try {
      setLoading(true)
      const data = await getUserDetails(user.id)
      setDetails(data)
    } catch (err) {
      setError('Erro ao carregar detalhes do usuário')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateCredits(type: 'add' | 'subtract') {
    if (!creditAmount || isNaN(Number(creditAmount))) return

    const amount = Number(creditAmount) * (type === 'add' ? 1 : -1)
    
    try {
      setIsUpdating(true)
      await updateUserCredits(user.id, amount, 'admin_adjustment', creditReason)
      setCreditAmount('')
      await loadDetails() // Recarregar dados
    } catch (err) {
      setError('Erro ao atualizar créditos')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-xl">
                {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <DialogTitle className="text-xl">{user.full_name || 'Usuário'}</DialogTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Clock className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-red-500">
            <AlertCircle className="h-12 w-12 mb-2" />
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadDetails}>
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="credits">Créditos</TabsTrigger>
              <TabsTrigger value="subscription">Assinatura</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Total Ganhos</p>
                    <p className="text-2xl font-bold">{details.credits?.[0]?.total_earned || 0}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Total Gastos</p>
                    <p className="text-2xl font-bold">{details.credits?.[0]?.total_spent || 0}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg border col-span-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Último Acesso</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-5 w-5 text-primary" />
                      <p className="text-lg font-semibold">
                        {details.last_sign_in_at 
                          ? new Date(details.last_sign_in_at).toLocaleString('pt-BR') 
                          : 'Nunca acessou'}
                      </p>
                    </div>
                    {details.last_sign_in_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        * Tempo de atividade não monitorado nesta versão.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Atividade Recente
                  </h3>
                  <div className="border rounded-md divide-y overflow-hidden bg-background">
                    {details.transactions && details.transactions.length > 0 ? (
                      details.transactions.map((tx: any) => (
                        <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{tx.description || tx.type}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className={cn(
                            "text-sm font-bold",
                            tx.amount > 0 ? "text-green-600" : "text-red-500"
                          )}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        Nenhuma transação encontrada.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="credits" className="mt-4">
              <div className="space-y-6">
                <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 text-center">
                  <p className="text-sm text-primary font-medium mb-1">Saldo Atual</p>
                  <p className="text-4xl font-black text-primary">
                    {(details.credits?.[0]?.balance || 0) + (details.credits?.[0]?.bonus_balance || 0)}
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-card space-y-4">
                  <h3 className="text-sm font-semibold">Ajuste de Créditos</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
                      <Input
                        type="number"
                        placeholder="Ex: 50"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Motivo</label>
                      <Input
                        placeholder="Ex: Bônus por feedback"
                        value={creditReason}
                        onChange={(e) => setCreditReason(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleUpdateCredits('subtract')}
                        disabled={isUpdating || !creditAmount}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        Remover
                      </Button>
                      <Button 
                        onClick={() => handleUpdateCredits('add')}
                        disabled={isUpdating || !creditAmount}
                      >
                        {isUpdating ? 'Salvando...' : 'Adicionar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="mt-4">
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Badge variant="outline" className="text-muted-foreground">Free</Badge>
                </div>
                <div>
                  <h3 className="font-bold">Plano Gratuito</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Este usuário está utilizando a versão básica da plataforma sem assinatura ativa.
                  </p>
                </div>
                <Button variant="outline" disabled className="w-full">
                  Gerenciar Plano (Em breve)
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

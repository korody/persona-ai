'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  RefreshCw, 
  Database, 
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface SyncStats {
  totalExercises: number
  activeExercises: number
  totalCourses: number
  activeCourses: number
  curatedExercises: number
  withEmbeddings: number
  completionPercentage: number
  courseStats: Array<{
    slug: string
    name: string
    total: number
    curated: number
    percentage: number
  }>
}

export function SyncDashboard() {
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/memberkit/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  const runSync = async () => {
    setSyncing(true)
    toast.info('Iniciando sincronização...')
    try {
      const response = await fetch('/api/admin/memberkit/sync', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success(`✅ Sincronizados: ${result.synced} | ❌ Erros: ${result.errors}`)
        await loadStats()
      } else {
        toast.error('Erro na sincronização')
      }
    } catch (error) {
      toast.error('Erro ao executar sincronização')
    } finally {
      setSyncing(false)
    }
  }

  const generateEmbeddings = async () => {
    setGenerating(true)
    toast.info('Gerando embeddings...')
    try {
      const response = await fetch('/api/admin/embeddings/generate', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success(`✅ Gerados: ${result.generated} | ⏭️ Pulados: ${result.skipped}`)
        await loadStats()
      } else {
        toast.error('Erro ao gerar embeddings')
      }
    } catch (error) {
      toast.error('Erro ao gerar embeddings')
    } finally {
      setGenerating(false)
    }
  }

  if (loading || !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Ativos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCourses}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalCourses} sincronizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercícios Ativos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeExercises}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalExercises} sincronizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercícios Categorizados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.curatedExercises}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completionPercentage.toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercícios Semantizados</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withEmbeddings}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.withEmbeddings / stats.totalExercises) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ações Rápidas</CardTitle>
          <CardDescription>
            Execute operações de sincronização e semantização de exercícios
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button 
            onClick={runSync} 
            disabled={syncing}
            variant="default"
            className="gap-2"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Sincronizar Memberkit
              </>
            )}
          </Button>

          <Button 
            onClick={generateEmbeddings} 
            disabled={generating}
            variant="secondary"
            className="gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Semantizando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Semantizar Exercícios
              </>
            )}
          </Button>

          <Button 
            onClick={loadStats} 
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Stats
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

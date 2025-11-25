'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2, XCircle, Sparkles, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface CourseStatus {
  memberkit_course_id: number
  slug: string
  name: string
  total: number
  categorized: number
  withEmbeddings: number
  activeCount: number
  percentage: number
  enabled: boolean
}

export function CourseSelector() {
  const [courses, setCourses] = useState<CourseStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    setLoading(true)
    try {
      // Add cache busting
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/memberkit/courses?t=${timestamp}`, {
        cache: 'no-store'
      })
      const data = await response.json()
      console.log('📦 Courses loaded:', data.courses?.length, 'courses')
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error('Erro ao carregar cursos')
    } finally {
      setLoading(false)
    }
  }

  const toggleCourse = async (slug: string, enabled: boolean) => {
    const previousCourses = [...courses]
    
    console.log('🎯 Toggling course:', { slug, enabled })
    
    // Optimistic update
    setCourses(courses.map(c => 
      c.slug === slug ? { ...c, enabled } : c
    ))

    try {
      const response = await fetch('/api/admin/memberkit/courses/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, enabled })
      })

      const result = await response.json()
      console.log('📊 Toggle result:', result)

      if (!response.ok) {
        throw new Error('Failed to toggle course')
      }

      toast.success(enabled ? 'Curso ativado' : 'Curso desativado')
      // Atualização otimista já foi feita, sem reload necessário
    } catch (error) {
      console.error('❌ Toggle error:', error)
      // Rollback on error
      setCourses(previousCourses)
      toast.error('Erro ao atualizar curso')
    }
  }

  const enabledCount = courses.filter(c => c.enabled).length
  const totalExercises = courses.reduce((acc, c) => acc + c.total, 0)
  const totalActiveExercises = courses.reduce((acc, c) => acc + c.activeCount, 0)
  const enabledExercises = courses.filter(c => c.enabled).reduce((acc, c) => acc + c.total, 0)
  const enabledActiveExercises = courses.filter(c => c.enabled).reduce((acc, c) => acc + c.activeCount, 0)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Cursos Ativos para Recomendação</CardTitle>
              <CardDescription className="mt-1">
                Selecione quais cursos devem ser incluídos nas recomendações do avatar
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{enabledCount}/{courses.length}</div>
              <p className="text-xs text-muted-foreground">
                {enabledActiveExercises}/{totalActiveExercises} exercícios ativos
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Ativo</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Categorizados</TableHead>
                  <TableHead>Semantizados</TableHead>
                  <TableHead>Progresso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum curso encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map(course => (
                    <TableRow key={course.memberkit_course_id}>
                      <TableCell>
                        <Switch
                          checked={course.enabled}
                          onCheckedChange={(checked) => toggleCourse(course.slug, checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="max-w-xs truncate">{course.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {course.slug}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{course.total}</Badge>
                      </TableCell>
                      <TableCell>
                        <span>{course.categorized}</span>
                      </TableCell>
                      <TableCell>
                        <span>{course.withEmbeddings}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {(course.percentage ?? 0).toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={course.percentage ?? 0} className="h-1" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Desative cursos não relacionados a práticas de Qi Gong para tornar as recomendações mais precisas.
              Cursos desativados não aparecerão na busca semântica do avatar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

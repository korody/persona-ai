'use client'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Sparkles, BarChart3, FolderKanban, FileEdit } from 'lucide-react'
import { SyncDashboard } from '@/components/admin/sync-dashboard'
import { CourseSelector } from '@/components/admin/course-selector'
import { ExerciseBrowser } from '@/components/admin/exercise-browser'

export function MemberkitSyncTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gerenciamento Memberkit
              </CardTitle>
              <CardDescription>
                Sincronize cursos da plataforma e gerencie quais exercícios a IA pode recomendar nas conversas
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              v7.0.0
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Gestão Cursos
          </TabsTrigger>
          <TabsTrigger value="exercises" className="gap-2">
            <FileEdit className="h-4 w-4" />
            Gestão Exercícios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <SyncDashboard />
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <CourseSelector />
        </TabsContent>

        <TabsContent value="exercises" className="space-y-6">
          <ExerciseBrowser />
        </TabsContent>
      </Tabs>
    </div>
  )
}

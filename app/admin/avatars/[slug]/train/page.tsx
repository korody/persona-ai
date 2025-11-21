/**
 * Página de Treinamento do Avatar
 * /admin/avatars/[slug]/train
 * 
 * 4 Abas:
 * 1. Base de Conhecimento - Upload documentos, adicionar texto manual
 * 2. Exemplos de Conversas - Few-shot learning
 * 3. Personalidade - Ajustar prompt, tom, estilo
 * 4. Playground - Testar avatar com RAG
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/server'
import { KnowledgeTab } from '@/components/training/knowledge-tab'
import { ExamplesTab } from '@/components/training/examples-tab'
import { PersonalityTab } from '@/components/training/personality-tab'
import { PlaygroundTab } from '@/components/training/playground-tab'
import { MemberkitSyncTab } from '@/components/admin/memberkit-sync-tab'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: avatar } = await supabase
    .from('avatars')
    .select('name')
    .eq('slug', slug)
    .single()

  return {
    title: avatar ? `Treinar ${avatar.name}` : 'Treinar Avatar',
    description: 'Interface de treinamento e personalização do avatar'
  }
}

export default async function TrainAvatarPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar avatar
  const { data: avatar, error } = await supabase
    .from('avatars')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !avatar) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Treinar {avatar.name}
          </h1>
          <p className="text-muted-foreground">
            Configure a base de conhecimento, exemplos e personalidade do avatar
          </p>
        </div>

      </div>

      {/* Tabs */}
      <Tabs defaultValue="knowledge" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="knowledge">
            🧠 Base de Conhecimento
          </TabsTrigger>
          <TabsTrigger value="personality">
            🎭 Personalidade
          </TabsTrigger>
          <TabsTrigger value="examples">
            💬 Exemplos
          </TabsTrigger>
          <TabsTrigger value="memberkit">
            🗄️ Memberkit
          </TabsTrigger>
          <TabsTrigger value="playground">
            🎮 Playground
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-4">
          <KnowledgeTab avatarId={avatar.id} />
        </TabsContent>

        <TabsContent value="personality" className="space-y-4">
          <PersonalityTab avatar={avatar} />
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <ExamplesTab avatarId={avatar.id} />
        </TabsContent>

        <TabsContent value="memberkit" className="space-y-4">
          <MemberkitSyncTab />
        </TabsContent>

        <TabsContent value="playground" className="space-y-4">
          <PlaygroundTab avatar={avatar} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

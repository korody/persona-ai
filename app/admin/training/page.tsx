import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, Brain, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function TrainingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth?redirect=/admin/training')
  }

  const allowedAdminEmails = [
    'marko@persona.cx',
    'admin@qigongbrasil.com'
  ]
  
  if (!allowedAdminEmails.includes(user.email || '')) {
    redirect('/chat')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Treinamento do Avatar</h1>
                <p className="text-muted-foreground">Mestre Ye Digital</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            🚧 <strong>Em Desenvolvimento</strong> - Esta funcionalidade estará disponível em breve.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload de Documentos */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Upload de Documentos</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Faça upload de PDFs, documentos e materiais para treinar o avatar.
            </p>
            <Button disabled className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Fazer Upload (Em breve)
            </Button>
          </div>

          {/* Base de Conhecimento */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-bold">Base de Conhecimento</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Gerencie documentos e conteúdos da base de conhecimento.
            </p>
            <Button disabled variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Ver Documentos (Em breve)
            </Button>
          </div>

          {/* Configuração de Personalidade */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-bold">Personalidade</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Configure o tom de voz e comportamento do avatar.
            </p>
            <Button disabled variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configurar (Em breve)
            </Button>
          </div>

          {/* Teste de Qualidade */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-bold">Teste de Qualidade</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Teste a qualidade das respostas do avatar.
            </p>
            <Button disabled variant="outline" className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Testar Avatar (Em breve)
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

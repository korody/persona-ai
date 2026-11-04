// app/auth/confirm/page.tsx
//
// Destino do link do e-mail de login. NÃO verifica o token aqui: só mostra o
// botão "Entrar", que faz POST para /auth/confirm/entrar. Assim o verificador de
// links do Hotmail/Outlook, que abre o link sozinho, não gasta o token (o mesmo
// do código de 6 números). Ver app/auth/confirm/entrar/route.ts.

import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string; redirect?: string }>
}) {
  const params = await searchParams
  const tokenHash = params.token_hash ?? ''
  const type = params.type ?? ''
  const next = params.next ?? params.redirect ?? '/chat'
  const isRecovery = type === 'recovery'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold">Mestre Ye Digital</h1>
            <p className="text-sm text-muted-foreground">Seu Terapeuta Digital 24/7</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-8 text-center">
          {tokenHash && type ? (
            <form method="post" action="/auth/confirm/entrar" className="space-y-4">
              <input type="hidden" name="token_hash" value={tokenHash} />
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="next" value={next} />
              <p className="text-muted-foreground">
                {isRecovery ? 'Toque no botão para criar uma nova senha.' : 'Toque no botão para entrar na sua conta.'}
              </p>
              <Button type="submit" size="lg" className="w-full">
                {isRecovery ? 'Continuar' : 'Entrar'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">Este link está incompleto. Peça um novo link de acesso.</p>
              <Button asChild size="lg" className="w-full">
                <a href="/auth">Voltar para o login</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

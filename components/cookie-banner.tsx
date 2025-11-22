'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Verifica se o usuário já aceitou os cookies
    const cookieConsent = localStorage.getItem('cookie-consent')
    if (!cookieConsent) {
      // Espera um pouco antes de mostrar o banner
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShowBanner(false)
  }

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg animate-in slide-in-from-bottom">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h3 className="font-semibold mb-2">🍪 Cookies e Privacidade</h3>
            <p className="text-sm text-muted-foreground">
              Utilizamos cookies essenciais para autenticação e cookies analíticos para melhorar sua experiência. 
              Ao continuar navegando, você concorda com nossa{' '}
              <Link href="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>.
            </p>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={declineCookies}
            >
              Apenas essenciais
            </Button>
            <Button
              size="sm"
              onClick={acceptCookies}
            >
              Aceitar todos
            </Button>
          </div>

          <button
            onClick={declineCookies}
            className="absolute top-2 right-2 md:relative md:top-0 md:right-0 p-1 hover:bg-muted rounded"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

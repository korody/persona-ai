import Link from 'next/link'

export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer className={`border-t pt-6 text-center text-xs text-muted-foreground ${className || ''}`}>
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        <Link href="/termos" className="hover:text-foreground transition-colors">
          Termos de Uso
        </Link>
        <span>•</span>
        <Link href="/privacidade" className="hover:text-foreground transition-colors">
          Política de Privacidade
        </Link>
        <span>•</span>
        <a href="mailto:contato@qigongbrasil.com" className="hover:text-foreground transition-colors">
          Contato
        </a>
      </div>
      <p>
        MESTRE YE LTDA - CNPJ: 61.142.351/0001-21
      </p>
      <p className="mt-1">
        © {new Date().getFullYear()} Persona AI. Todos os direitos reservados.
      </p>
    </footer>
  )
}

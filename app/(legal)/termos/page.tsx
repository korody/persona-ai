import Link from 'next/link'

export const metadata = {
  title: 'Termos de Uso | Persona AI',
  description: 'Termos de Uso da Plataforma Persona AI (Mestre Ye)',
}

export default function TermosPage() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar para o site
        </Link>
      </div>

      <h1>Termos de Uso - PERSONA AI (MESTRE YE)</h1>
      
      <p className="text-muted-foreground">
        <strong>Última atualização:</strong> 22 de novembro de 2025
      </p>

      <h2 id="aceitacao">1. ACEITAÇÃO DOS TERMOS</h2>

      <p>
        Bem-vindo ao <strong>Persona AI</strong> (doravante "Plataforma", "nós" ou "nosso"), operado por{' '}
        <strong>MESTRE YE LTDA</strong>, CNPJ 61.142.351/0001-21, com sede na Rua Muniz de Sousa, 635, 
        Aclimação, São Paulo, SP, CEP 01534-000.
      </p>

      <p>
        Ao acessar ou utilizar nossos serviços em <strong>digital.mestreye.com</strong>, incluindo conversas 
        com o avatar <strong>Mestre Ye</strong>, você ("Usuário" ou "você") concorda com estes Termos de Uso.
      </p>

      <p className="font-semibold">
        SE VOCÊ NÃO CONCORDA COM ESTES TERMOS, NÃO UTILIZE A PLATAFORMA.
      </p>

      <h3>1.1 Capacidade Legal</h3>
      <p>
        Você declara ter pelo menos 18 anos de idade e capacidade legal plena para celebrar este contrato. 
        Menores de 18 anos só podem utilizar a Plataforma sob supervisão de pais ou responsáveis legais.
      </p>

      <h3>1.2 Modificações</h3>
      <p>
        Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações substanciais serão 
        notificadas por email ou aviso na Plataforma com 15 dias de antecedência. O uso continuado após a 
        notificação constitui aceitação dos novos termos.
      </p>

      <h2 id="servico">2. DESCRIÇÃO DO SERVIÇO</h2>

      <h3>2.1 Natureza do Serviço</h3>
      <p>
        A Persona AI oferece um serviço de <strong>conversação com inteligência artificial</strong> especializado 
        em Medicina Tradicional Chinesa (MTC), representado pelo avatar virtual <strong>Mestre Ye</strong>. 
        O serviço inclui:
      </p>

      <ul>
        <li>Orientações educacionais sobre MTC</li>
        <li>Recomendações de práticas de Qigong (Método Ye Xin)</li>
        <li>Informações sobre acupressura e fitoterapia chinesa</li>
        <li>Orientações de estilo de vida segundo a filosofia da MTC</li>
        <li>Análise personalizada dos Cinco Elementos</li>
      </ul>

      <h3>2.2 O QUE O SERVIÇO NÃO É</h3>

      <div className="not-prose bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6 my-6">
        <p className="font-bold text-amber-900 dark:text-amber-100 mb-4">
          ⚠️ AVISO IMPORTANTE - LEIA COM ATENÇÃO:
        </p>
        
        <ul className="space-y-2 text-amber-900 dark:text-amber-100">
          <li><strong>✗ NÃO É CONSULTA MÉDICA:</strong> As conversas com Mestre Ye são exclusivamente educacionais 
          e informativas. NÃO substituem consultas, diagnósticos ou tratamentos médicos profissionais.</li>
          
          <li><strong>✗ NÃO É DIAGNÓSTICO:</strong> A Plataforma não realiza diagnósticos médicos. A análise dos 
          Cinco Elementos é uma abordagem educacional da MTC, não um diagnóstico clínico.</li>
          
          <li><strong>✗ NÃO É PRESCRIÇÃO:</strong> Mestre Ye não prescreve medicamentos, fórmulas herbais ou 
          tratamentos. Todas as orientações são de caráter educacional e complementar.</li>
          
          <li><strong>✗ NÃO É EMERGÊNCIA:</strong> Em caso de emergência médica, procure imediatamente atendimento 
          médico presencial ou ligue 192 (SAMU) ou 193 (Bombeiros).</li>
          
          <li><strong>✗ NÃO SUBSTITUI PROFISSIONAIS DE SAÚDE:</strong> Sempre consulte médicos, fisioterapeutas, 
          nutricionistas e outros profissionais habilitados para cuidados com sua saúde.</li>
        </ul>
      </div>

      <h2 id="responsabilidades">3. RESPONSABILIDADES DO USUÁRIO</h2>

      <h3>3.1 Você é Responsável por:</h3>
      <ul>
        <li>Consultar profissionais de saúde habilitados para diagnósticos e tratamentos</li>
        <li>Informar seus médicos sobre qualquer prática complementar que adote</li>
        <li>Verificar se as práticas sugeridas são adequadas para sua condição de saúde específica</li>
        <li>Seguir orientações médicas profissionais em caso de conflito com informações da Plataforma</li>
        <li>Interromper qualquer prática que cause desconforto ou agravamento de sintomas</li>
        <li>Manter a confidencialidade de suas credenciais de acesso</li>
      </ul>

      <h2 id="planos">4. PLANOS, PAGAMENTOS E CRÉDITOS</h2>

      <h3>4.1 Sistema de Créditos</h3>
      <p>A Plataforma opera com sistema de créditos:</p>
      <ul>
        <li><strong>1 crédito = 1 mensagem enviada</strong> ao Mestre Ye</li>
        <li>Créditos não são transferíveis entre contas</li>
        <li>Créditos não são reembolsáveis em dinheiro</li>
        <li>Créditos não utilizados podem expirar conforme seu plano</li>
      </ul>

      <h2 id="propriedade">5. PROPRIEDADE INTELECTUAL</h2>

      <p>
        Todo conteúdo da Plataforma é de propriedade exclusiva de <strong>MESTRE YE LTDA</strong> ou seus 
        licenciadores, incluindo mas não se limitando a:
      </p>

      <ul>
        <li>Avatar Mestre Ye (personalidade, aparência, voz)</li>
        <li>Método Ye Xin de Qigong</li>
        <li>Sistema de análise dos Cinco Elementos</li>
        <li>Base de conhecimento de MTC</li>
        <li>Código-fonte, algoritmos, design</li>
        <li>Marca "Persona AI" e "Mestre Ye"</li>
      </ul>

      <p>
        <strong>Protegido por direitos autorais (Lei 9.610/98), marcas registradas e segredos comerciais.</strong>
      </p>

      <h2 id="limitacao">6. LIMITAÇÃO DE RESPONSABILIDADE</h2>

      <div className="not-prose bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 my-6">
        <p className="font-bold text-red-900 dark:text-red-100 mb-4">
          ISENÇÃO DE GARANTIAS
        </p>
        
        <p className="text-red-900 dark:text-red-100 mb-4">
          A PLATAFORMA É FORNECIDA "COMO ESTÁ" E "CONFORME DISPONÍVEL", SEM GARANTIAS DE QUALQUER TIPO, 
          EXPRESSAS OU IMPLÍCITAS.
        </p>

        <p className="text-red-900 dark:text-red-100 font-semibold">
          NA MÁXIMA EXTENSÃO PERMITIDA PELA LEI BRASILEIRA, A MESTRE YE LTDA NÃO É RESPONSÁVEL POR:
        </p>

        <ul className="text-red-900 dark:text-red-100 mt-2 space-y-1">
          <li>Danos à saúde física ou mental decorrentes do uso ou não uso da Plataforma</li>
          <li>Decisões tomadas com base em informações fornecidas pelo Mestre Ye</li>
          <li>Lesões resultantes de práticas de Qigong ou outras atividades sugeridas</li>
          <li>Agravamento de condições de saúde preexistentes</li>
          <li>Interação com medicamentos ou tratamentos em curso</li>
        </ul>

        <p className="text-red-900 dark:text-red-100 mt-4 font-semibold">
          NOSSA RESPONSABILIDADE MÁXIMA TOTAL está limitada ao valor efetivamente pago por você à MESTRE YE LTDA 
          nos últimos 3 (três) meses, não excedendo R$ 500,00 (quinhentos reais).
        </p>
      </div>

      <h2 id="contato">7. CONTATO E ATENDIMENTO</h2>

      <div className="not-prose bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 my-6">
        <p className="font-semibold mb-4">MESTRE YE LTDA</p>
        <ul className="space-y-2 text-sm">
          <li><strong>CNPJ:</strong> 61.142.351/0001-21</li>
          <li><strong>Endereço:</strong> Rua Muniz de Sousa, 635 - Aclimação, São Paulo - SP, CEP 01534-000</li>
          <li><strong>Email:</strong> <a href="mailto:contato@qigongbrasil.com" className="text-primary hover:underline">contato@qigongbrasil.com</a></li>
          <li><strong>Telefone/WhatsApp:</strong> (11) 9845-7676</li>
          <li><strong>Horário:</strong> Segunda a sexta, 9h às 18h (exceto feriados)</li>
        </ul>
      </div>

      <h2 id="aceite">8. ACEITAÇÃO E VERSÃO</h2>

      <p><strong>DATA DA ÚLTIMA ATUALIZAÇÃO:</strong> 22 de novembro de 2025</p>
      <p><strong>VERSÃO:</strong> 1.0</p>

      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-6">
        <p className="font-bold text-blue-900 dark:text-blue-100 mb-4">
          AO CRIAR UMA CONTA, ACESSAR OU UTILIZAR A PLATAFORMA PERSONA AI, VOCÊ DECLARA QUE:
        </p>
        
        <ul className="space-y-2 text-blue-900 dark:text-blue-100">
          <li>✓ Leu e compreendeu integralmente estes Termos de Uso</li>
          <li>✓ Leu e compreendeu integralmente a <Link href="/privacidade" className="underline">Política de Privacidade</Link></li>
          <li>✓ Concorda expressamente com todos os termos e condições aqui estabelecidos</li>
          <li>✓ Tem capacidade legal para celebrar este contrato</li>
          <li>✓ Compreende que o serviço é educacional e não substitui cuidados médicos profissionais</li>
          <li>✓ Assume total responsabilidade por decisões relacionadas à sua saúde</li>
        </ul>

        <p className="mt-4 font-semibold text-blue-900 dark:text-blue-100">
          Se você não concorda com algum termo, não utilize a Plataforma.
        </p>
      </div>

      <hr className="my-8" />

      <div className="not-prose text-center text-sm text-muted-foreground">
        <p><strong>MESTRE YE LTDA</strong></p>
        <p>CNPJ: 61.142.351/0001-21</p>
        <p>digital.mestreye.com</p>
      </div>
    </article>
  )
}

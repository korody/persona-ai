import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidade | Persona AI',
  description: 'Política de Privacidade da Plataforma Persona AI (Mestre Ye)',
}

export default function PrivacidadePage() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar para o site
        </Link>
      </div>

      <h1>Política de Privacidade - PERSONA AI (MESTRE YE)</h1>
      
      <p className="text-muted-foreground">
        <strong>Última atualização:</strong> 22 de novembro de 2025
      </p>

      <h2 id="introducao">1. INTRODUÇÃO</h2>

      <p>
        A <strong>MESTRE YE LTDA</strong>, inscrita no CNPJ sob nº <strong>61.142.351/0001-21</strong>, com 
        sede na Rua Muniz de Sousa, 635, Aclimação, São Paulo, SP, CEP 01534-000, operadora da plataforma{' '}
        <strong>Persona AI</strong> disponível em <strong>digital.mestreye.com</strong>, respeita sua 
        privacidade e está comprometida com a proteção de seus dados pessoais.
      </p>

      <p>
        Esta Política de Privacidade explica de forma clara e transparente como coletamos, usamos, armazenamos, 
        compartilhamos e protegemos suas informações pessoais, em total conformidade com a{' '}
        <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.
      </p>

      <p className="font-semibold">
        AO USAR NOSSOS SERVIÇOS, VOCÊ CONSENTE COM AS PRÁTICAS DESCRITAS NESTA POLÍTICA.
      </p>

      <h2 id="controlador">2. CONTROLADOR DE DADOS</h2>

      <div className="not-prose bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 my-6">
        <p className="font-semibold mb-4">Controlador:</p>
        <ul className="space-y-2 text-sm">
          <li><strong>Razão Social:</strong> MESTRE YE LTDA</li>
          <li><strong>CNPJ:</strong> 61.142.351/0001-21</li>
          <li><strong>Endereço:</strong> Rua Muniz de Sousa, 635 - Aclimação, São Paulo - SP, CEP 01534-000</li>
          <li><strong>Email:</strong> <a href="mailto:contato@qigongbrasil.com" className="text-primary hover:underline">contato@qigongbrasil.com</a></li>
          <li><strong>Telefone:</strong> (11) 9845-7676</li>
          <li><strong>Encarregado de Dados (DPO):</strong> Marcos França Korody</li>
        </ul>
      </div>

      <h2 id="dados-coletados">3. DADOS QUE COLETAMOS</h2>

      <h3>3.1 Dados de Cadastro</h3>
      <p>Coletamos os seguintes dados necessários para criar e gerenciar sua conta:</p>
      <ul>
        <li>Nome completo</li>
        <li>Email (usado como login)</li>
        <li>Telefone (celular/WhatsApp)</li>
        <li>Senha (armazenada criptografada)</li>
      </ul>

      <h3>3.2 Dados de Saúde (Anamnese dos Cinco Elementos)</h3>
      
      <div className="not-prose bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6 my-6">
        <p className="font-bold text-amber-900 dark:text-amber-100 mb-4">
          ⚠️ ATENÇÃO: DADOS SENSÍVEIS DE SAÚDE
        </p>
        
        <p className="text-amber-900 dark:text-amber-100">
          Por meio da anamnese personalizada, coletamos informações de saúde para personalizar suas interações 
          com o Mestre Ye. Todos esses dados recebem <strong>proteção adicional</strong> como dados sensíveis 
          conforme LGPD.
        </p>
      </div>

      <p>Informações coletadas incluem:</p>
      <ul>
        <li>Sintomas e condições físicas</li>
        <li>Estado emocional e mental</li>
        <li>Hábitos e estilo de vida</li>
        <li>Histórico de saúde (opcional)</li>
        <li>Análise dos Cinco Elementos (Água-Rim, Madeira-Fígado, Fogo-Coração, Terra-Baço, Metal-Pulmão)</li>
      </ul>

      <h3>3.3 Dados de Conversação</h3>
      <p>Armazenamos suas conversas com o avatar Mestre Ye para:</p>
      <ul>
        <li>Fornecer respostas personalizadas</li>
        <li>Manter histórico e contexto de conversas</li>
        <li>Melhorar o serviço</li>
      </ul>

      <h3>3.4 Dados de Pagamento</h3>
      <p>
        <strong>IMPORTANTE:</strong> NÃO armazenamos números completos de cartão de crédito. Todos os dados 
        sensíveis de pagamento são processados e armazenados exclusivamente pelo <strong>Stripe</strong>, 
        que é certificado PCI-DSS Nível 1 (mais alto padrão de segurança de pagamentos).
      </p>

      <h2 id="uso-dados">4. COMO USAMOS SEUS DADOS</h2>

      <p>Utilizamos seus dados pessoais para:</p>

      <h3>4.1 Fornecer e Operar o Serviço</h3>
      <ul>
        <li>Criar, manter e gerenciar sua conta</li>
        <li>Autenticar e autorizar acesso</li>
        <li>Personalizar respostas do Mestre Ye conforme sua anamnese</li>
        <li>Processar pagamentos e gerenciar assinaturas</li>
        <li>Fornecer suporte e atendimento</li>
      </ul>

      <h3>4.2 Melhorar o Serviço</h3>
      <ul>
        <li>Analisar padrões de uso (sempre anonimizados)</li>
        <li>Desenvolver novos recursos</li>
        <li>Treinar modelos de IA com dados agregados (sem identificação pessoal)</li>
      </ul>

      <h3>4.3 Comunicação</h3>
      <ul>
        <li>Enviar emails transacionais (confirmações, avisos importantes)</li>
        <li>Enviar emails promocionais (se você consentir - pode cancelar a qualquer momento)</li>
      </ul>

      <h2 id="compartilhamento">5. COMPARTILHAMENTO DE DADOS</h2>

      <div className="not-prose bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 my-6">
        <p className="font-bold text-green-900 dark:text-green-100 mb-4">
          ✓ GARANTIA ABSOLUTA
        </p>
        <p className="text-green-900 dark:text-green-100">
          Nunca vendemos, alugamos ou comercializamos dados pessoais identificáveis de nossos usuários.
        </p>
      </div>

      <p>Compartilhamos dados apenas quando estritamente necessário com:</p>

      <h3>5.1 Prestadores de Serviço Essenciais</h3>

      <ul>
        <li>
          <strong>Anthropic (Claude AI):</strong> Processa mensagens para gerar respostas do Mestre Ye
        </li>
        <li>
          <strong>Stripe:</strong> Processa pagamentos de forma segura (certificado PCI-DSS)
        </li>
        <li>
          <strong>Supabase/AWS:</strong> Hospedagem de banco de dados com criptografia
        </li>
        <li>
          <strong>Vercel:</strong> Hospedagem da aplicação web
        </li>
      </ul>

      <p>
        Todos os prestadores são obrigados contratualmente a proteger seus dados e não usá-los para 
        outros fins.
      </p>

      <h2 id="protecao">6. PROTEÇÃO E SEGURANÇA DOS DADOS</h2>

      <p>Implementamos medidas robustas de segurança:</p>

      <h3>6.1 Medidas Técnicas</h3>
      <ul>
        <li><strong>Criptografia SSL/TLS (HTTPS)</strong> em todas as conexões</li>
        <li><strong>Criptografia em repouso</strong> do banco de dados (AES-256)</li>
        <li><strong>Senhas criptografadas</strong> com bcrypt (nunca armazenadas em texto puro)</li>
        <li><strong>Backups automatizados</strong> diários</li>
        <li><strong>Controle de acesso rigoroso</strong> (apenas membros autorizados)</li>
      </ul>

      <h3>6.2 Suas Responsabilidades</h3>
      <p>Você também deve proteger sua conta:</p>
      <ul>
        <li>Use senha forte e única</li>
        <li>Nunca compartilhe sua senha</li>
        <li>Faça logout em dispositivos compartilhados</li>
        <li>Notifique-nos sobre atividades suspeitas</li>
      </ul>

      <h2 id="retencao">7. RETENÇÃO E DESCARTE DE DADOS</h2>

      <p>Retemos dados apenas pelo tempo necessário:</p>

      <ul>
        <li><strong>Durante conta ativa:</strong> Todos os dados são mantidos</li>
        <li><strong>Após cancelamento:</strong> Dados básicos por 5 anos (obrigações fiscais)</li>
        <li><strong>Conversas:</strong> 90 dias após cancelamento (permite reativação)</li>
        <li><strong>Dados de saúde:</strong> 20 anos (analogia com normas médicas)</li>
        <li><strong>Após exclusão solicitada:</strong> 30 dias para exclusão completa</li>
      </ul>

      <h2 id="direitos">8. SEUS DIREITOS (LGPD)</h2>

      <p>Você tem os seguintes direitos garantidos por lei:</p>

      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-6">
        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4">Direitos do Titular de Dados:</h3>
        <ul className="space-y-2 text-blue-900 dark:text-blue-100">
          <li>✓ <strong>Confirmação e Acesso:</strong> Saber quais dados temos sobre você</li>
          <li>✓ <strong>Correção:</strong> Corrigir dados incompletos ou inexatos</li>
          <li>✓ <strong>Anonimização ou Exclusão:</strong> Eliminar dados desnecessários</li>
          <li>✓ <strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
          <li>✓ <strong>Informação sobre Compartilhamento:</strong> Saber com quem compartilhamos</li>
          <li>✓ <strong>Revogação de Consentimento:</strong> Retirar consentimento a qualquer momento</li>
          <li>✓ <strong>Oposição ao Tratamento:</strong> Opor-se a certos usos de dados</li>
        </ul>
      </div>

      <h3>8.1 Como Exercer Seus Direitos</h3>

      <p>Entre em contato conosco:</p>
      <ul>
        <li><strong>Email:</strong> contato@qigongbrasil.com (assunto: "LGPD - Privacidade")</li>
        <li><strong>Telefone:</strong> (11) 9845-7676</li>
        <li><strong>Dashboard:</strong> Acesse "Meus Dados" no seu perfil</li>
      </ul>

      <p><strong>Prazos de resposta:</strong></p>
      <ul>
        <li>Confirmação: até 24 horas</li>
        <li>Resposta inicial: até 15 dias</li>
        <li>Atendimento completo: até 30 dias</li>
      </ul>

      <h2 id="ia">9. INTELIGÊNCIA ARTIFICIAL E DADOS</h2>

      <p>
        O Mestre Ye utiliza IA (Claude da Anthropic) para gerar respostas. <strong>Importante:</strong>
      </p>

      <ul>
        <li>Dados são processados em tempo real para gerar respostas</li>
        <li>NÃO usamos seus dados para treinar modelos públicos de IA</li>
        <li>Podemos usar dados anonimizados e agregados para melhorias internas</li>
        <li>IA pode ocasionalmente "alucinar" (criar informações inexistentes)</li>
        <li>Respostas não são verificadas por profissionais antes do envio</li>
      </ul>

      <h2 id="cookies">10. COOKIES</h2>

      <p>Utilizamos cookies para:</p>

      <h3>10.1 Cookies Essenciais (obrigatórios)</h3>
      <ul>
        <li>Autenticação (manter você logado)</li>
        <li>Segurança (prevenir ataques)</li>
        <li>Preferências básicas (idioma, tema)</li>
      </ul>

      <h3>10.2 Cookies Analíticos (opcionais)</h3>
      <ul>
        <li>Estatísticas de uso (Google Analytics anonimizado)</li>
        <li>Performance da aplicação</li>
      </ul>

      <p>Você pode gerenciar cookies através do banner na primeira visita ou nas configurações do navegador.</p>

      <h2 id="anpd">11. AUTORIDADE DE PROTEÇÃO DE DADOS</h2>

      <p>
        Você tem o direito de apresentar reclamação à <strong>ANPD - Autoridade Nacional de Proteção de Dados</strong> 
        caso acredite que seus direitos foram violados:
      </p>

      <div className="not-prose bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 my-6">
        <p className="font-semibold mb-2">ANPD</p>
        <ul className="space-y-1 text-sm">
          <li><strong>Website:</strong> <a href="https://www.gov.br/anpd/pt-br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">gov.br/anpd</a></li>
          <li><strong>Email:</strong> atendimento@anpd.gov.br</li>
        </ul>
      </div>

      <h2 id="contato">12. CONTATO</h2>

      <div className="not-prose bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 my-6">
        <p className="font-semibold mb-4">Para exercer direitos ou esclarecer dúvidas sobre privacidade:</p>
        <ul className="space-y-2 text-sm">
          <li><strong>Encarregado de Dados (DPO):</strong> Marcos França Korody</li>
          <li><strong>Email:</strong> <a href="mailto:contato@qigongbrasil.com" className="text-primary hover:underline">contato@qigongbrasil.com</a></li>
          <li><strong>Assunto:</strong> "LGPD - Privacidade"</li>
          <li><strong>Telefone:</strong> (11) 9845-7676</li>
          <li><strong>Horário:</strong> Segunda a sexta, 9h às 18h</li>
        </ul>
      </div>

      <h2 id="aceite">13. ACEITAÇÃO E VERSÃO</h2>

      <p><strong>DATA DA ÚLTIMA ATUALIZAÇÃO:</strong> 22 de novembro de 2025</p>
      <p><strong>VERSÃO:</strong> 1.0</p>

      <div className="not-prose bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-6">
        <p className="font-bold text-blue-900 dark:text-blue-100 mb-4">
          AO CRIAR UMA CONTA OU UTILIZAR A PLATAFORMA, VOCÊ DECLARA QUE:
        </p>
        
        <ul className="space-y-2 text-blue-900 dark:text-blue-100">
          <li>✓ Leu e compreendeu esta Política de Privacidade</li>
          <li>✓ Compreende como coletamos, usamos e protegemos seus dados</li>
          <li>✓ Consente com o tratamento de dados descrito</li>
          <li>✓ Compreende que dados de saúde recebem proteção especial</li>
          <li>✓ Conhece seus direitos e como exercê-los</li>
          <li>✓ Pode revogar consentimento a qualquer momento</li>
        </ul>

        <p className="mt-4 font-semibold text-blue-900 dark:text-blue-100">
          Se você não concorda, não utilize a Plataforma.
        </p>
      </div>

      <hr className="my-8" />

      <div className="not-prose text-center text-sm text-muted-foreground">
        <p className="mb-2">
          <strong>Agradecemos sua confiança. Estamos comprometidos em proteger sua privacidade.</strong>
        </p>
        <p><strong>MESTRE YE LTDA</strong></p>
        <p>CNPJ: 61.142.351/0001-21</p>
        <p>digital.mestreye.com</p>
      </div>
    </article>
  )
}

// Definição completa de cada feature — usada pela página admin
// Linguagem amigável, explicações para não-técnicos

export type FeatureStatus = 'ok' | 'bloqueado' | 'parcial' | 'dev'

export interface FeatureDef {
  id: string
  emoji: string
  nome: string
  resumo: string
  oQue: string
  comoUsuariaVe: string[]
  pageUrl?: string
  setupUrl?: string
  setupLabel?: string
  status: (env: Record<string, boolean>) => FeatureStatus
  problema?: (env: Record<string, boolean>) => string | null
  passosParaCorrigir?: (env: Record<string, boolean>) => string[]
  metricKey?: string
  isRoadmap?: boolean
}

export const FEATURES: FeatureDef[] = [
  {
    id: 'ml-busca',
    emoji: '🔍',
    nome: 'Busca de Produtos no Mercado Livre',
    resumo: 'Encontra produtos de beleza em tempo real com foto e preço',
    oQue:
      'Quando você digita "protetor solar" na Wishlist ou na página Descobrir, o app consulta o Mercado Livre ao vivo e mostra uma lista de produtos reais — com foto, preço atualizado e botão para abrir o link direto. Sem precisar sair do app.',
    comoUsuariaVe: [
      '→ Wishlist → botão "+ Adicionar" → campo de busca no topo do formulário',
      '→ Página "Descobrir" (ícone bússola na tela inicial)',
      '→ Ao salvar produto no Armário, o app busca e vincula automaticamente ao ML em segundo plano',
    ],
    pageUrl: '/app/descobrir',
    setupUrl: '/api/ml/setup',
    setupLabel: 'Configurar agora',
    metricKey: 'wishlist',
    status: (env) =>
      env.ML_REFRESH_TOKEN && env.ML_APP_ID ? 'ok' : 'bloqueado',
    problema: (env) =>
      !env.ML_APP_ID
        ? 'ML_APP_ID não configurado na Vercel'
        : !env.ML_REFRESH_TOKEN
        ? 'Autenticação com o Mercado Livre não foi feita ainda'
        : null,
    passosParaCorrigir: (env) =>
      !env.ML_REFRESH_TOKEN
        ? [
            'No portal do Mercado Livre (developers.mercadolivre.com.br), abra seu app',
            'Habilite "Código de Autorização" e "Refresh Token" nas configurações',
            'Mude o Redirect URI para: https://chiqueteza.vercel.app/api/ml/callback',
            'Salve as alterações no portal ML',
            'Clique em "Configurar agora" abaixo para autorizar o app',
            'Copie o token exibido e adicione como ML_REFRESH_TOKEN na Vercel',
            'Faça um Redeploy no Vercel',
          ]
        : [],
  },
  {
    id: 'ml-afiliado',
    emoji: '🏷️',
    nome: 'Links de Afiliado (Comissão ML)',
    resumo: 'Todo link do ML carrega seu ID de afiliado, gerando comissão nas compras',
    oQue:
      'Cada vez que a usuária clica em "Ver no ML" e compra um produto, você recebe uma comissão do Mercado Livre. Isso acontece de forma transparente — o link já sai com seu ID de afiliado embutido na URL.',
    comoUsuariaVe: [
      '→ Invisível para a usuária — o link parece normal',
      '→ Aparece como botão "Ver no ML" nos cards de produto',
      '→ Badge "Ver no ML" nos cards da Wishlist quando há produto vinculado',
    ],
    status: (env) =>
      env.ML_AFFILIATE_TRACKING_ID ? 'ok' : 'parcial',
    problema: (env) =>
      !env.ML_AFFILIATE_TRACKING_ID
        ? 'Links funcionam, mas sem rastreamento de afiliado (sem comissão)'
        : null,
    passosParaCorrigir: () => [
      'Acesse o programa de afiliados do Mercado Livre',
      'Gere um link de produto qualquer',
      'Copie o valor de matt_tool= da URL gerada → adicione como ML_AFFILIATE_TRACKING_ID na Vercel',
      'Copie o valor de matt_word= da URL → adicione como ML_AFFILIATE_WORD na Vercel',
    ],
  },
  {
    id: 'push',
    emoji: '🔔',
    nome: 'Notificações Push',
    resumo: 'O app avisa no celular mesmo quando está fechado',
    oQue:
      'O app envia alertas direto na tela de bloqueio do celular. Por exemplo: "Seu protetor solar está acabando — veja no ML por R$45" ou "O preço do seu hidratante caiu!". Funciona mesmo com o app fechado.',
    comoUsuariaVe: [
      '→ Banner de permissão aparece 4 segundos após abrir o app',
      '→ Notificação chega no celular: "Seu [produto] está acabando"',
      '→ Toque na notificação → abre diretamente na tela do produto no ML',
    ],
    metricKey: 'pushSubs',
    status: (env) =>
      env.VAPID_PRIVATE_KEY ? 'ok' : 'bloqueado',
    problema: (env) =>
      !env.VAPID_PRIVATE_KEY ? 'Chaves de segurança para notificações não geradas' : null,
    passosParaCorrigir: () => [
      'Abra um terminal e rode: npx web-push generate-vapid-keys',
      'Copie a "Public Key" → adicione como NEXT_PUBLIC_VAPID_KEY na Vercel (All Environments)',
      'Copie a "Private Key" → adicione como VAPID_PRIVATE_KEY na Vercel (All Environments)',
      'Salve e faça Redeploy no Vercel',
      'Abra o app → aceite a permissão de notificação quando aparecer',
    ],
  },
  {
    id: 'visagismo',
    emoji: '✨',
    nome: 'Análise Facial com IA (Visagismo)',
    resumo: 'Tira uma selfie e recebe análise completa de cores e rosto',
    oQue:
      'A usuária fotografa o rosto e a inteligência artificial (Gemini do Google) analisa o formato do rosto, subtom da pele e estação de colorimetria. O resultado inclui paleta de cores ideal, tons de batom, sombra e blush recomendados, e dicas personalizadas.',
    comoUsuariaVe: [
      '→ Aba "Looks" → Visagismo → Fazer Análise',
      '→ Tira ou envia uma selfie frontal sem filtros',
      '→ Em segundos: formato do rosto, estação (primavera/outono/etc), paleta completa',
      '→ Botões para gerar looks com aquelas cores (feature premium futura)',
    ],
    pageUrl: '/app/visagismo',
    metricKey: 'analises',
    status: (env) => (env.GEMINI_API_KEY ? 'ok' : 'bloqueado'),
    problema: (env) => (!env.GEMINI_API_KEY ? 'GEMINI_API_KEY não configurada na Vercel' : null),
    passosParaCorrigir: () => [
      'Acesse aistudio.google.com → crie uma API Key',
      'Adicione como GEMINI_API_KEY na Vercel (All Environments)',
      'Faça Redeploy no Vercel',
    ],
  },
  {
    id: 'inngest',
    emoji: '⏰',
    nome: 'Tarefas Automáticas Diárias',
    resumo: 'O app verifica preços e detecta produtos acabando todo dia sozinho',
    oQue:
      'Todos os dias, às 8h e 9h, o app roda dois processos em segundo plano: (1) verifica os preços dos produtos do armário no Mercado Livre e salva o histórico, (2) detecta produtos com nível baixo ou próximos do fim e dispara notificações para a usuária.',
    comoUsuariaVe: [
      '→ Invisível — a usuária não vê nem precisa fazer nada',
      '→ Resultado: recebe notificação "Seu [produto] está acabando"',
      '→ Resultado: o preço do produto no armário é atualizado automaticamente',
    ],
    status: (env) =>
      env.INNGEST_EVENT_KEY && env.INNGEST_SIGNING_KEY ? 'ok' : 'bloqueado',
    problema: (env) =>
      !env.INNGEST_EVENT_KEY ? 'Chaves do Inngest não configuradas' : null,
    passosParaCorrigir: () => [
      'Acesse app.inngest.com e crie uma conta',
      'Crie um app e copie o Event Key → adicione como INNGEST_EVENT_KEY na Vercel',
      'Copie o Signing Key → adicione como INNGEST_SIGNING_KEY na Vercel',
      'Faça Redeploy no Vercel',
    ],
  },
  {
    id: 'tryon',
    emoji: '💄',
    nome: 'Experimentar Maquiagem Virtualmente (Try-On)',
    resumo: 'Experimenta looks de maquiagem no seu próprio rosto via IA',
    oQue:
      'A usuária escolhe um look (ex: "Olho esfumado dourado") e a IA aplica a maquiagem virtualmente na foto do rosto dela. É como um provador de roupas, mas para maquiagem. Recurso premium que está em desenvolvimento.',
    comoUsuariaVe: [
      '→ Aba "Looks" → escolher um look → "Experimentar no meu rosto"',
      '→ Usa créditos premium (15 créditos por try-on)',
      '→ Resultado: imagem antes/depois lado a lado',
    ],
    pageUrl: '/app/looks',
    status: () => 'dev',
    isRoadmap: true,
  },
  {
    id: 'premium',
    emoji: '💎',
    nome: 'Planos e Pagamento (PremiumGate)',
    resumo: 'Sistema de assinatura para desbloquear recursos avançados',
    oQue:
      'O plano grátis dá acesso ao básico. O plano Premium (R$19,90/mês) desbloqueia créditos mensais para análises com imagens, try-ons ilimitados e alertas de preço. A infraestrutura de créditos já existe no banco — falta integrar o Stripe para cobrar.',
    comoUsuariaVe: [
      '→ Botão "Assinar Premium" em features bloqueadas',
      '→ Dashboard de créditos na área do usuário',
      '→ Email de confirmação de assinatura',
    ],
    status: () => 'dev',
    isRoadmap: true,
  },
]

export const STATS_META: Record<string, { label: string; descricao: string; url: string; cor: string; emoji: string }> = {
  wishlist: {
    label: 'Na Wishlist',
    descricao: 'Produtos que a usuária quer comprar. Podem ter link do ML e rastreamento de preço.',
    url: '/app/wishlist',
    cor: '#F472A0',
    emoji: '🤍',
  },
  armario: {
    label: 'No Armário',
    descricao: 'Produtos que a usuária já possui. O app rastreia nível de uso e avisa quando está acabando.',
    url: '/app/armario',
    cor: '#1B5E5A',
    emoji: '🧴',
  },
  analises: {
    label: 'Análises Faciais',
    descricao: 'Visagismos feitos pela IA. Cada um inclui colorimetria, paleta de cores e recomendações personalizadas.',
    url: '/app/visagismo',
    cor: '#D4A843',
    emoji: '✨',
  },
  agendamentos: {
    label: 'Agendamentos',
    descricao: 'Serviços de beleza marcados (salão, sobrancelha, etc). O app organiza a agenda e o histórico de gastos.',
    url: '/app/rotina',
    cor: '#A8C5CC',
    emoji: '📅',
  },
  rotinas: {
    label: 'Rotinas de Autocuidado',
    descricao: 'Cuidados diários cadastrados (skincare, academia, hidratação...). O app acompanha streaks e envia lembretes.',
    url: '/app/autocuidado',
    cor: '#1B5E5A',
    emoji: '🌿',
  },
  looks: {
    label: 'Looks no Diário',
    descricao: 'Fotos de looks salvos no diário pessoal. Podem ser públicos (aparecem na galeria) ou privados.',
    url: '/app/looks',
    cor: '#F472A0',
    emoji: '📸',
  },
  profissionais: {
    label: 'Profissionais Salvos',
    descricao: 'Cabeleireiros, esteticistas e outros profissionais cadastrados. Inclui contato, avaliação e galeria de fotos.',
    url: '/app/profissionais',
    cor: '#D4A843',
    emoji: '💅',
  },
  pushSubs: {
    label: 'Dispositivos com Notificação',
    descricao: '0 dispositivos = as notificações push não chegam a ninguém. É preciso configurar as VAPID keys e aceitar permissão no app.',
    url: '/app/admin',
    cor: '#A8C5CC',
    emoji: '🔔',
  },
}

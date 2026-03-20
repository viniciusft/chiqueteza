
CLAUDE.md — Contexto do Projeto para o Claude Code
Identidade do Projeto
Nome: Chiqueteza
Repositório: https://github.com/viniciusft/chiqueteza
Stack: Next.js 14 (App Router), Supabase, Vercel, TypeScript, Tailwind CSS
Tipo: PWA (Progressive Web App) — foco mobile, sem app nativo
Supabase Project ID: zzrlrrzdusrtkkyvtirm
Supabase URL: https://zzrlrrzdusrtkkyvtirm.supabase.co
O que é este app
Assistente pessoal de beleza B2C. Duas frentes principais:
Virtual Try-On — usuária faz upload de foto e testa looks de maquiagem do arsenal pré-catalogado
Organização Pessoal — controle de rotina de beleza com histórico, frequência e lembretes push
Público-alvo
Mulheres entre 18–45 anos, alta recorrência em serviços de beleza, usuárias ativas de Instagram e TikTok.
---
Regras absolutas
NUNCA expor chaves de API no frontend — toda chamada de IA passa por route handler server-side
NUNCA hardcodar URLs — sempre usar `process.env.NEXT_PUBLIC_SITE_URL`
NUNCA quebrar RLS (Row Level Security) do Supabase
O provider de IA deve ser abstraído em `lib/ai/generateMakeup.ts` — permite troca de Gemini para FLUX sem refatoração
Sempre manter TypeScript — sem `any` sem justificativa
Commits em português, descritivos
Antes de qualquer tarefa: fazer checkpoint com git commit
O campo `prompt_tecnico` da tabela `looks` NUNCA deve ser retornado em rotas públicas
---
Identidade Visual
Paleta de cores:
Ever Green: `#1B5E5A` (verde escuro — cor primária)
Pink Peony: `#F472A0` (rosa — destaque)
Silver Platter: `#E8E8E8` (cinza claro — fundo/neutro)
Wedding Band: `#D4A843` (dourado — acento)
Something Blue: `#A8C5CC` (azul claro — secundário)
Tom: moderno, feminino, acessível, com personalidade brasileira
Nome "Chiqueteza": leveza, humor, identidade forte
---
Motor de IA para geração de imagem
Status: EM AVALIAÇÃO — não decidido
Candidatos testados:
Gemini 2.0 Flash — gratuito, bons resultados de preservação de identidade, leve suavização de pele
FLUX Kontext Pro (fal.ai) — melhor qualidade, $0.04/imagem, superior em realismo de textura
O código deve ser construído com o provider abstraído:
```typescript
// lib/ai/generateMakeup.ts
// Troca o provider aqui sem mexer em nenhuma outra parte do app
export async function generateMakeup(params: MakeupParams): Promise<string> {
  // internamente chama Gemini, FLUX, ou outro
}
```
---
Pipeline do Virtual Try-On
```
ENTRADA
├── Usuária faz upload da foto
│   └── Validação obrigatória:
│       - Rosto frontal e centralizado
│       - Rosto próximo (não foto de corpo inteiro)
│       - Boa iluminação
│       - Sem óculos de sol
│       - Feedback imediato se a foto não passar
│
├── Usuária navega no arsenal de looks
│   └── Cada look exibe: imagem de referência + nome + categoria
│   └── A imagem de referência é APENAS VISUAL para a usuária
│   └── prompt_tecnico nunca exposto no frontend — só usado server-side
│
PROCESSAMENTO (server-side)
├── Sistema recupera prompt_tecnico do look selecionado
├── Chamada a lib/ai/generateMakeup.ts
│   └── Input: foto da usuária + prompt técnico
│   └── Instrução de preservação de identidade embutida
│
SAÍDA
├── Resultado exibido lado a lado com original
├── Salvar no histórico (tabela geracoes)
└── Botão compartilhar
```
Estrutura do prompt técnico de cada look
```
IDENTITY LOCK: A pessoa nesta imagem deve permanecer 100% idêntica.
Formato do rosto, estrutura óssea, textura de pele, formato dos olhos,
sobrancelhas, nariz, cabelo e expressão são absolutamente intocáveis.
Esta é a instrução de maior prioridade.
REGIÃO: Modificar APENAS [regiões específicas].
Todos os pixels fora dessas regiões devem ser idênticos à foto original.
MAQUIAGEM: [descrição técnica — cor HEX, acabamento, intensidade, blending]
RESTRIÇÕES: Não alterar pele. Não suavizar. Não embelezar. Não idealizar.
```
---
Banco de dados (Supabase)
Migrações já aplicadas. Tabelas existentes:
perfis — complementa auth.users
id (FK auth.users), nome, avatar_url, created_at, updated_at
Criado automaticamente via trigger on_auth_user_created
looks — arsenal de maquiagem
id, nome, descricao_visual, imagem_referencia_url
prompt_tecnico (NUNCA exposto no frontend)
categoria: social/noiva/formatura/dia/balada/natural/dramatico
tags (jsonb), ativo, ordem
geracoes — histórico de try-ons
id, usuario_id → perfis, look_id → looks
foto_original_url, foto_gerada_url, provider_usado
servicos_beleza — organização pessoal
id, usuario_id → perfis
nome, ultimo_procedimento (date), frequencia_dias
lembrete_ativo, observacoes
push_subscriptions — push notifications
id, usuario_id → perfis, subscription_json (jsonb)
RLS habilitado em todas as tabelas. Usuário acessa apenas seus próprios dados.
---
MVP — Escopo completo
Pilar 1 — Virtual Try-On
[ ] Upload de foto com validação
[ ] Arsenal de looks navegável por categoria
[ ] Geração via provider de IA abstraído
[ ] Resultado exibido lado a lado
[ ] Salvar no histórico
[ ] Compartilhar resultado
Pilar 2 — Organização Pessoal
[ ] Cadastro de serviços recorrentes
[ ] Registro de último procedimento
[ ] Frequência recomendada
[ ] Histórico
[ ] Push notifications com lembretes automáticos
Autenticação
[ ] Login obrigatório (Supabase Auth)
[ ] Consentimento LGPD antes do upload de foto
---
Roadmap
V2 — Visagismo
Análise facial via MediaPipe
Relatório personalizado por LLM em português
Recomendação de looks baseada no formato do rosto
V3 — Matching de Base
Sistema colaborativo de equivalência entre bases de marcas
Só após base de usuárias real
Futuro — Marketplace
Perfis de profissionais e salões
Integração com Âmbar Beauty Studio e similares
---
Variáveis de ambiente
```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL=https://zzrlrrzdusrtkkyvtirm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
FAL_KEY
NEXT_PUBLIC_VAPID_KEY
VAPID_PRIVATE_KEY
```
---
Notas de privacidade (LGPD)
Fotos de rosto são dados biométricos sensíveis
Consentimento explícito obrigatório antes do upload
Política de privacidade na tela de upload
Imagens armazenadas no Supabase Storage deste projeto
Sinergias com Âmbar Beauty Studio
Projetos completamente separados por ora
Futuro: cliente Chiqueteza descobre o Âmbar como profissional
Futuro: resultado do try-on vira referência para agendamento

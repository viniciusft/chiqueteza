# Workflow de Desenvolvimento — Chiqueteza
> Seguir este fluxo em toda implementação para eliminar retrabalho e garantir qualidade.

---

## Modo Celular — Linguagem Natural → Execução

Quando a Vini envia um áudio transcrito, texto rápido ou ideia informal pelo celular,
o Claude interpreta e classifica **antes de executar qualquer coisa**.

### Como interpretar um pedido em linguagem natural

**Passo 1 — Traduzir para técnico**
Extrair da mensagem:
- Qual feature está em foco?
- O que deve mudar (comportamento, UI, dados, configuração)?
- Qual o critério de sucesso ("está pronto quando…")?
- Tem efeito colateral em outras partes do app?

**Passo 2 — Classificar a tarefa**

| Tipo | Símbolo | Critério |
|---|---|---|
| Claude faz sozinho | 🤖 | Só código, nada de env vars externas ou config em outros serviços |
| Usuária precisa estar no computador | ✋ | Envolve Vercel, Supabase dashboard, portal ML, Inngest, etc. |
| Depende de config pendente | ⏳ | Código existe mas só funciona após ✋ ser feito |

**Passo 3 — Responder com plano antes de executar**
```
🔍 Entendi: [restatement técnico do pedido]

🤖 Posso fazer agora: [lista]
✋ Vai precisar fazer você: [lista]
⏳ Fica bloqueado até: [condição]

Começo pela [X]. Ok?
```

---

## Tarefas Autônomas (🤖 — Claude faz sozinho)

Estas tarefas **nunca precisam de ação da Vini** — só código.

### UX / Interface
- Melhorar animações, feedback visual, micro-interações
- Revisar textos (copy, labels, mensagens de erro)
- Corrigir layout em mobile
- Adicionar estados de loading/empty/error em qualquer tela
- Refatorar componentes grandes em componentes menores

### Lógica e código
- Corrigir bugs identificados no código
- Otimizar queries Supabase (select específico, sem select *)
- Adicionar validação de inputs
- Melhorar tratamento de erros (try/catch, fallbacks)
- Criar/atualizar tipos TypeScript
- Extrair lógica repetida para hooks ou utils

### Features que só precisam de banco (Supabase já configurado)
- Novas telas que leem dados já existentes
- Filtros, ordenações, buscas nas listas existentes
- Histórico de preços — visualização em gráfico
- Exportar lista do armário/wishlist como texto

### Documentação e organização
- Atualizar CLAUDE.md, STATUS.md, features/*.md
- Criar novos feature docs
- Melhorar a página /admin com novas métricas

---

## Tarefas que Precisam da Usuária (✋ — requer configuração externa)

### Vercel
- Adicionar/editar variáveis de ambiente (`ML_REFRESH_TOKEN`, VAPID keys, etc.)
- Fazer redeploy após env vars
- Ver logs de produção

### Portal Mercado Livre
- Habilitar Código de Autorização + Refresh Token
- Mudar redirect URI
- Visitar `/api/ml/setup` para autorizar e obter `ML_REFRESH_TOKEN`

### Supabase Dashboard
- Aprovar migrations críticas (não-reversíveis)
- Verificar RLS de tabelas novas
- Criar/editar buckets de storage

### Inngest
- Configurar webhook URL
- Verificar histórico de execuções de jobs

### Outros
- Conta de afiliado Mercado Livre (obter `ML_AFFILIATE_TRACKING_ID`)
- Geração de VAPID keys (`npx web-push generate-vapid-keys` — roda no terminal da Vini)

---

## O Fluxo Completo

### 1. ENTENDER
**Objetivo:** Saber exatamente o que será feito antes de escrever uma linha.

- Ler `STATUS.md` e `.claude/features/[feature].md` da feature em foco
- Ler `CLAUDE.md` na raiz (regras absolutas + arquitetura)
- Confirmar entendimento: repetir o que vai ser feito + escopo
- Fazer **perguntas-chave** antes de qualquer código:
  - Quais edge cases importam?
  - Afeta alguma feature existente?
  - Tem restrição de segurança ou privacidade (LGPD, RLS, API keys)?
  - É necessário migration de banco? Se sim, é reversível?

---

### 2. PLANEJAR (Plan Mode)
**Objetivo:** Definir a abordagem antes de executar.

- Ativar Plan Mode — escrever plano em `.claude/plans/`
- Identificar **arquivos que serão modificados** (nunca criar novo se pode reutilizar)
- Verificar se já existe implementação similar no projeto (reusar padrões)
- Avaliar impacto em outras features (ex: mudar busca ML afeta armário, wishlist e descobrir)
- Identificar riscos de segurança antecipadamente
- Obter aprovação antes de executar

---

### 3. PESQUISAR (quando há integração com terceiros ou tecnologia nova)
**Objetivo:** Chegar com a solução certa na primeira tentativa.

- Documentação oficial do provider/lib (sempre primeiro)
- Issues abertas no GitHub do projeto/lib (erros conhecidos)
- Fóruns e Stack Overflow (soluções reais que funcionam)
- Código-fonte de exemplos oficiais
- **Registrar findings em** `.claude/features/[feature].md` → seção "Pesquisa"

Exemplos de quando pesquisar obrigatoriamente:
- Qualquer integração com API externa (ML, Gemini, Stripe, etc.)
- Autenticação/OAuth (fluxos têm comportamentos inesperados)
- Novo pacote npm (verificar compatibilidade + issues conhecidos)

---

### 4. IMPLEMENTAR
**Objetivo:** Código correto, seguro e mínimo.

**Antes de começar:**
```bash
git add -A && git commit -m "checkpoint: antes de [feature]"
```

**Durante:**
- TypeScript strict — `any` apenas com comentário explicando por quê
- Sem `console.log` de debug no código final (apenas `console.error` para erros reais)
- Sem features não pedidas ("enquanto estou aqui, também vou adicionar X...")
- Reutilizar componentes existentes antes de criar novos
- Seguir padrões do projeto (ver `components/ui/`, `lib/`, patterns dos pages existentes)

---

### 5. CHECKLIST DE SEGURANÇA
**Verificar antes de qualquer commit:**

#### API Keys e Secrets
- [ ] Nenhuma variável sem `NEXT_PUBLIC_` exposta no frontend
- [ ] Nenhuma key hardcodada no código
- [ ] Route handlers server-side para toda chamada de IA e ML
- [ ] `SUPABASE_SERVICE_ROLE_KEY` apenas em server-side (nunca em client component)

#### Supabase / Banco
- [ ] RLS ativo em toda tabela nova (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`)
- [ ] Políticas RLS criadas para INSERT/SELECT/UPDATE/DELETE
- [ ] `userId` sempre via `supabase.auth.getUser()`, nunca via params da URL
- [ ] Nunca confiar em dados vindos do frontend para operações críticas

#### Input e Output
- [ ] Inputs do usuário validados no server-side (nunca só no client)
- [ ] Sem `dangerouslySetInnerHTML` sem sanitização
- [ ] URLs abertas com `target="_blank"` têm `rel="noopener noreferrer"`
- [ ] Redirects não são baseados em input não sanitizado do usuário

#### Autenticação
- [ ] Rotas protegidas verificam sessão (middleware cobre `/app/*`)
- [ ] API routes críticas verificam `user` antes de processar

#### LGPD / Privacidade
- [ ] Fotos de rosto → consentimento explícito antes do upload
- [ ] Dados biométricos → bucket com RLS, nunca público sem auth

---

### 6. VERIFICAR
**Objetivo:** Garantir que nada quebrou.

```bash
# TypeScript
cd app && npx tsc --noEmit

# Checar imports quebrados, refs a arquivos deletados
grep -r "clientSearch\|TODO\|FIXME\|console\.log" app/ lib/ --include="*.ts" --include="*.tsx"
```

- Testar o golden path manualmente no browser
- Testar edge cases: campo vazio, sem auth, sem env var
- Verificar que features adjacentes não quebraram

---

### 7. DOCUMENTAR + COMMITAR
**Obrigatório antes de todo push:**

#### Atualizar docs (se aplicável)
- [ ] `.claude/features/[feature].md` — status, progresso, novas decisões técnicas
- [ ] `.claude/STATUS.md` — se status da feature mudou
- [ ] `CLAUDE.md` — se mudança arquitetural, novo padrão ou regra importante
- [ ] `/app/app/admin/_data/features.ts` — se nova feature tem status/env var para monitorar

#### Commit
```bash
git add [arquivos específicos]
git commit -m "tipo: descrição clara do que foi feito

- Detalhe 1
- Detalhe 2"
git push -u origin claude/init-nextjs-project-Pu4XH
```

**Tipos de commit:** `feat`, `fix`, `refactor`, `docs`, `chore`, `perf`
**Idioma:** Português, descritivo

---

## Skills disponíveis por situação

| Situação | Skill |
|---|---|
| Revisar qualidade do código implementado | `simplify` |
| Auditoria de acessibilidade/performance/anti-patterns | `audit` |
| Tornar feature robusta para produção | `harden` |
| Adicionar animações/micro-interações | `animate` |
| Melhorar layout e espaçamento | `arrange` |
| Melhorar tipografia | `typeset` |
| Adicionar mais cor | `colorize` |
| Simplificar UI complexa | `distill` |
| Checar UX da feature | `critique` |
| Configurar hooks automáticos | `update-config` |

---

## Quando NÃO commitar

- TypeScript com erros (`npx tsc --noEmit` falhou)
- Imports quebrados (referências a arquivos deletados)
- API key ou secret visível no código
- `console.log` de debug esquecido
- Funcionalidade incompleta (prefira commit de checkpoint antes)

---

## Regra de ouro

> **Entender → Planejar → Pesquisar → Implementar → Verificar → Documentar**
>
> Nunca pular etapas. Retrabalho custa mais tempo que planejamento.

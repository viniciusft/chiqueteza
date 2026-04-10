# Workflow de Desenvolvimento — Chiqueteza
> Seguir este fluxo em toda implementação para eliminar retrabalho e garantir qualidade.

---

## O Fluxo Completo

### 1. ENTENDER
**Objetivo:** Saber exatamente o que será feito antes de escrever uma linha.

- Ler `STATUS.md` e `.claude/features/[feature].md` da feature em foco
- Ler `CLAUDE.md` na raiz (regras absolutas + arquitetura)
- Confirmar entendimento com a usuária: repetir o que vai ser feito + escopo
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
npx tsc --noEmit

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
- [ ] `/app/app/admin/page.tsx` — se nova feature tem status/env var para monitorar

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

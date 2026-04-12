# Plano: Social — Perfis, Seguimentos e Feed

**Data:** 2026-04-12
**Status:** 🔄 Planejado — aguardando aprovação
**Branch:** `claude/init-nextjs-project-Pu4XH`
**Feature doc:** `.claude/features/social.md`

---

## Contexto e decisões de produto

### O que é
Sistema social leve estilo "app de resenha" (≠ Instagram): usuárias podem seguir outras, curar um feed personalizado, e compartilhar seletivamente looks, produtos do armário e itens da wishlist.

### Decisões acordadas
- **@username único** por usuária — aparece na URL do perfil e nos cards
- **Público por item** — cada look, produto do armário e item da wishlist tem toggle individual "público/privado"
- **Público = visível para qualquer logada** — não é só para seguidores; follows servem para o feed curado
- **Sem aprovação** — follow direto, sem "request"
- **Login obrigatório** — sem autenticação, não há acesso a nada
- **Galeria reformulada** — dois tabs: "Seguindo" (feed curado) + "Explorar" (todos os públicos)

---

## Migration de banco (Etapa 1)

### 1a. Atualizar `perfis`
```sql
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Índice para busca case-insensitive
CREATE INDEX IF NOT EXISTS idx_perfis_username_lower ON perfis (LOWER(username));
```

### 1b. Criar `seguimentos`
```sql
CREATE TABLE IF NOT EXISTS seguimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seguidor_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  seguido_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (seguidor_id, seguido_id),
  CHECK (seguidor_id != seguido_id)
);

CREATE INDEX IF NOT EXISTS idx_seguimentos_seguidor ON seguimentos(seguidor_id);
CREATE INDEX IF NOT EXISTS idx_seguimentos_seguido ON seguimentos(seguido_id);

ALTER TABLE seguimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver seguimentos" ON seguimentos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuária pode seguir" ON seguimentos FOR INSERT WITH CHECK (auth.uid() = seguidor_id);
CREATE POLICY "Usuária pode desseguir" ON seguimentos FOR DELETE USING (auth.uid() = seguidor_id);
```

### 1c. Coluna `publico` no armário e wishlist
```sql
ALTER TABLE armario_produtos ADD COLUMN IF NOT EXISTS publico BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE wishlist_produtos ADD COLUMN IF NOT EXISTS publico BOOLEAN NOT NULL DEFAULT FALSE;
```

### 1d. RLS `perfis` — perfis sempre visíveis para logados
```sql
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis visíveis para autenticados" ON perfis FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Usuária edita próprio perfil" ON perfis FOR UPDATE USING (auth.uid() = id);
```

---

## Arquivos a criar

| Arquivo | O que é |
|---|---|
| `app/app/perfil/page.tsx` | Meu perfil: avatar, username, bio, estatísticas, tabs Looks/Armário/Wishlist |
| `app/app/perfil/editar/page.tsx` | Edição de username, bio, avatar |
| `app/app/perfil/seguidores/page.tsx` | Lista de quem me segue |
| `app/app/perfil/seguindo/page.tsx` | Lista de quem sigo |
| `app/u/[username]/page.tsx` | Perfil público de outro usuário |
| `app/app/buscar/page.tsx` | Busca de usuárias por nome/@username |
| `app/api/social/seguir/[userId]/route.ts` | POST = seguir, DELETE = desseguir |
| `app/api/social/buscar/route.ts` | GET ?q=... busca de usuárias |
| `components/ui/UserCard.tsx` | Card de usuária (avatar, nome, @username, botão seguir) |
| `components/ui/PerfilHeader.tsx` | Header de perfil (foto, stats, edit/follow button) |
| `.claude/features/social.md` | Feature doc desta implementação |

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `app/app/galeria/page.tsx` | Adicionar tabs "Seguindo" + "Explorar", mostrar avatar+@username em cada card |
| `app/app/armario/_components/ProdutoCard.tsx` | Toggle "Público" no card/form |
| `app/app/armario/_components/FormAdicionarProduto.tsx` | Campo `publico` no form |
| `app/app/armario/_types.ts` | Adicionar `publico: boolean` na interface |
| `app/app/wishlist/page.tsx` | Toggle "Público" nos itens |
| `components/ui/AppHeader.tsx` | Avatar/iniciais linkando para `/app/perfil` |
| `app/app/admin/_data/features.ts` | Card de feature Social |
| `.claude/STATUS.md` | Social → em andamento |

---

## Ordem de implementação

### Etapa 1 — Banco (migration)
Executar migration via Supabase MCP. Testar que não quebra nada existente.
**Commit:** `feat(social): migration banco — seguimentos, username, publico`

### Etapa 2 — Meu Perfil (`/app/perfil`)
Tela com: avatar (inicial do nome se não tiver foto), @username, bio, contadores (looks públicos, seguidores, seguindo), tabs: Looks / Armário / Wishlist.
Botão "Editar" → `/app/perfil/editar`.
**Commit:** `feat(social): página meu perfil`

### Etapa 3 — Setup de username (onboarding suave)
Se usuária não tem username ainda, mostrar banner/prompt na página de perfil para escolher um.
Validação: apenas letras, números e `_`, 3-30 chars, único.
**Commit:** `feat(social): setup username na página de perfil`

### Etapa 4 — Perfil público (`/u/[username]`)
Página pública (autenticação obrigatória via middleware).
Header: avatar, nome, @username, bio, contadores, botão Seguir/Seguindo.
Tabs: Looks / Armário / Wishlist públicos da usuária.
**Commit:** `feat(social): página de perfil público /u/[username]`

### Etapa 5 — Seguir/Desseguir (API + UI)
`POST /api/social/seguir/[userId]` → insert em seguimentos
`DELETE /api/social/seguir/[userId]` → delete de seguimentos
Retorna `{ seguindo: boolean, totalSeguidores: number }`
**Commit:** `feat(social): API seguir/desseguir`

### Etapa 6 — Seguidores / Seguindo
`/app/perfil/seguidores` — quem me segue (com botão seguir de volta)
`/app/perfil/seguindo` — quem sigo (com botão desseguir)
Mesmas páginas acessíveis via `/u/[username]/seguidores` e `/u/[username]/seguindo`
**Commit:** `feat(social): páginas seguidores e seguindo`

### Etapa 7 — Busca de usuárias
`/app/buscar` — input de busca → hits na tabela perfis por nome ou username (ILIKE)
Resultado: lista de UserCards com botão seguir
Acessível via ícone de busca no header da Galeria
**Commit:** `feat(social): busca de usuárias`

### Etapa 8 — Galeria reformulada
Dois tabs: "Seguindo" (looks de quem sigo) + "Explorar" (todos os públicos)
Cada card agora mostra: avatar + @username da autora (clicável → perfil)
**Commit:** `feat(social): galeria reformulada com feed seguindo`

### Etapa 9 — Toggle público no Armário
`FormAdicionarProduto` ganha toggle "Compartilhar no meu perfil" (publico)
Card mostra badge "Público" quando ativo
**Commit:** `feat(social): toggle público no armário`

### Etapa 10 — Toggle público na Wishlist
Card e form de wishlist ganham toggle "Compartilhar no meu perfil" (publico)
**Commit:** `feat(social): toggle público na wishlist`

### Etapa 11 — AppHeader com perfil
Avatar ou iniciais no canto direito do header linkando para `/app/perfil`
**Commit:** `feat(social): avatar no header linkando para perfil`

### Etapa 12 — Docs + Admin
`.claude/features/social.md`, `.claude/STATUS.md`, `admin/_data/features.ts`
**Commit:** `docs: social feature doc e status`

---

## Checklist de segurança (pré-implementação)

- [ ] `userId` sempre via `supabase.auth.getUser()`, nunca via params da URL
- [ ] Route handlers de seguir verificam que `seguidor_id = auth.uid()` (nunca trust client)
- [ ] RLS ativo em `seguimentos` — sem RLS, qualquer um pode ver/criar seguimentos
- [ ] RLS em `perfis` — perfis visíveis apenas para autenticados (login obrigatório)
- [ ] Busca de usuárias: ILIKE no servidor, nunca expor dados sensíveis (email, auth.users)
- [ ] Toggle público no armário/wishlist: update sempre filtra por `usuario_id = auth.uid()`
- [ ] Perfil público `/u/[username]`: middleware garante autenticação antes de renderizar
- [ ] Username: validar regex `^[a-z0-9_]{3,30}$` no servidor antes de salvar

---

## Considerações de performance

- Índice `LOWER(username)` para busca case-insensitive eficiente
- Feed "Seguindo": query IN (subquery seguimentos) — máximo eficiente com índice em `seguidor_id`
- Cursor pagination na galeria (já implementado) — manter
- Contadores de seguidores/seguindo: count direto no banco (tabela pequena no início)

---

## O que este plano NÃO inclui (fora de escopo)

- Notificação push de "fulana começou a te seguir" (pode ser adicionado depois via Inngest)
- Feed de atividades (fulana curtiu seu look)
- Mensagens diretas (DM)
- Stories / conteúdo efêmero
- Bloquear/reportar usuária
- Privacidade de conta (conta privada estilo Instagram) — decidido que é público para todos logados

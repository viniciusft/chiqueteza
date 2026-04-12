# Feature: Rede Social de Beleza

## Status: ✅ Implementado (2026-04-12)

## O que é
Sistema social completo integrado ao app: perfis públicos com @username, seguir/deixar de seguir outras usuárias, feed curado "Seguindo" na galeria, busca de usuárias, e controle granular de privacidade por item (look, produto no armário, item da wishlist).

---

## Tabelas no Supabase

### Alterações em `perfis`
- `username VARCHAR(50) UNIQUE` — @handle único da usuária
- `bio TEXT` — descrição curta (até 160 chars)
- `idx_perfis_username_lower` — índice para busca case-insensitive

### Nova tabela: `seguimentos`
```sql
CREATE TABLE seguimentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seguidor_id uuid REFERENCES perfis(id) ON DELETE CASCADE NOT NULL,
  seguido_id  uuid REFERENCES perfis(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(seguidor_id, seguido_id),
  CHECK(seguidor_id <> seguido_id)
);
CREATE INDEX idx_seg_seguidor ON seguimentos(seguidor_id);
CREATE INDEX idx_seg_seguido  ON seguimentos(seguido_id);
```

**RLS:**
- SELECT: qualquer `auth.uid() IS NOT NULL`
- INSERT: `auth.uid() = seguidor_id`
- DELETE: `auth.uid() = seguidor_id`

### Alterações em `armario_produtos`
- `publico BOOLEAN DEFAULT FALSE` — produto visível no perfil público

**RLS atualizado (4 políticas separadas):**
- SELECT: `usuario_id = auth.uid() OR publico = true` (quando autenticado)
- INSERT/UPDATE/DELETE: `usuario_id = auth.uid()`

### Alterações em `wishlist_produtos`
- `publico BOOLEAN DEFAULT FALSE` — item visível no perfil público

### Alterações em `looks_diario`
- SELECT policy atualizada: permite ver `publico = true` de qualquer user autenticado

---

## Arquivos implementados

### Componentes
- `components/ui/UserCard.tsx` — `AvatarUser` (gradiente quando sem foto) + `UserCard` (card com follow toggle otimista)
- `components/ui/AppHeader.tsx` — atualizado: mostra avatar da usuária logada no canto direito, linka para `/app/perfil`

### API Routes
- `app/api/social/seguir/[userId]/route.ts`
  - `POST` → insert seguimentos (ignora 23505)
  - `DELETE` → delete seguimentos
  - Ambos retornam `{ seguindo: boolean, totalSeguidores: number }`
- `app/api/social/buscar/route.ts`
  - `GET ?q=texto` — busca por username/nome (ILIKE, mín 2 chars, exclui própria usuária)

### Páginas
- `app/app/perfil/page.tsx` — perfil próprio: stats, tabs (Looks/Armário/Wishlist), sheets de seguidores/seguindo
- `app/app/perfil/editar/page.tsx` — editar nome, @username (validação + preview URL), bio
- `app/app/u/[username]/page.tsx` — perfil público de outra usuária (redireciona se for a própria)
- `app/app/buscar/page.tsx` — busca de usuárias com debounce; sugestões "seguem você mas você não segue de volta"
- `app/app/galeria/page.tsx` — reformulada: tabs Explorar/Seguindo, enriquecimento de autores, cards com @username clicável

### Toggles de privacidade por item
- `app/app/armario/_types.ts` — `publico: boolean` adicionado a `ArmarioProduto`
- `app/app/armario/_components/FormAdicionarProduto.tsx` — toggle "🌍 Público no meu perfil"
- `app/app/wishlist/page.tsx` — toggle "🌍 Público no meu perfil" no formulário de adicionar

---

## Fluxo de descoberta

```
Galeria → Explorar (todos os looks públicos)
       → Seguindo (só looks de quem você segue)
         └─ Empty state: "Buscar pessoas" → /app/buscar
              └─ Busca por @username ou nome
                   └─ Card com botão Seguir
                        └─ /app/u/{username} — perfil completo
```

---

## Decisões de design

- **Público por item** — não é "perfil público ou privado", cada look/produto/wishlist item tem toggle individual
- **Login obrigatório** — conteúdo público visível apenas para usuárias autenticadas (RLS: `auth.uid() IS NOT NULL`)
- **Follow sem aprovação** — direto, sem moderação
- **Sem notificação de follow** — não implementado nesta versão
- **Feed Seguindo** — query filtra `usuario_id IN (seguidosIds)` — sem FK obrigatória em looks_diario
- **Enriquecimento de autores em 2 passos** — fetch looks → batch-fetch perfis por `IN(distinct userIds)` → merge no frontend (evita join complexo)

---

## Segurança
- RLS impede ver itens privados de outros usuários (SELECT policy com `publico = true`)
- INSERT em seguimentos valida `auth.uid() = seguidor_id` — não é possível seguir em nome de outro
- API de busca exclui a própria usuária dos resultados
- `prompt_tecnico` de looks NUNCA exposto (regra global mantida)

---

## Próximos passos (V2 social)
- Notificação push quando alguém te segue
- Comentários em looks
- Reações além de curtida (👏 ❤️ 🔥)
- Feed de atividade (X começou a seguir Y, Z adicionou produto público)

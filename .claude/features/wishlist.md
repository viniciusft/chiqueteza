# Feature: Wishlist

**Status:** ✅ Concluído (dependente do ML_REFRESH_TOKEN para busca funcionar)
**Última atualização:** 2026-04-10

---

## O que é
Lista de produtos que a usuária quer comprar. Integrada com busca ML no formulário de adição.
Ao marcar como comprado, migra automaticamente para o Armário Digital.

---

## Arquivos principais

| Arquivo | O que faz |
|---|---|
| `app/app/wishlist/page.tsx` | Página completa (lista + bottom sheet + busca ML) |

---

## Banco de dados — `wishlist_produtos`

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| usuario_id | uuid | FK → perfis |
| nome | text | |
| marca | text | |
| categoria | text | skincare/maquiagem/perfume/cabelo/corpo/unhas |
| preco_estimado | numeric | |
| foto_url | text | Storage bucket `wishlist-fotos` |
| link_compra | text | |
| status | text | `quero` \| `comprei` (UI não usa `tenho`, mas banco tem) |
| prioridade | text | `alta` \| `media` \| `baixa` |
| notas | text | |
| ml_produto_id | text | ID do produto no ML (null se manual) |
| ml_deeplink | text | URL com parâmetros de afiliado |
| armario_id | uuid | FK → armario_produtos (preenchido ao migrar) |

---

## Progresso

- ✅ Interface `ProdutoWishlist` com campos ML (`ml_produto_id`, `ml_deeplink`)
- ✅ Campo de busca ML no topo do bottom sheet de adicionar
- ✅ Debounce 400ms → `/api/armario/buscar-ml?q=...` (server-side)
- ✅ Lista de resultados: thumbnail + nome + preço + vendedor
- ✅ Ao selecionar: pré-preenche nome, marca, preço, link
- ✅ Insert salva `ml_produto_id` e `ml_deeplink`
- ✅ Badge "Ver no ML" no card quando `ml_deeplink` preenchido
- ✅ Migração para Armário ao marcar como comprado

---

## Contexto técnico

### Busca ML no formulário
- `handleMlInput(v)` → debounce 400ms → fetch `/api/armario/buscar-ml?q=${v}`
- Resposta: `{ produtos: MLResultado[] }`
- `MLResultado` definido localmente (não importa de clientSearch — foi removido)
- Ao selecionar: `setMlSelecionado(r)` + preenche campos do form
- Badge "🔗 ML vinculado" substitui a lista quando produto selecionado

### Fluxo de migração para Armário
Ao marcar status como `comprei`:
1. Insert em `armario_produtos` com dados da wishlist
2. Update `wishlist_produtos.armario_id` com o novo id
3. Parâmetros de query: `/app/armario?nome=...&marca=...&wishlist_id=...`

### Armazenamento de fotos
- Bucket: `wishlist-fotos` (RLS: só a própria usuária pode inserir)
- Path: `{userId}/{uuid}.jpg`

---

## Próximos passos possíveis
- Ordenação drag-and-drop por prioridade
- Filtro por categoria na listagem
- Notificação push quando preço do produto ML cai
</content>
</invoke>
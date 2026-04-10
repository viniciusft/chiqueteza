# Feature: Integração Mercado Livre — OAuth + Busca

**Status:** 🚫 Bloqueado (aguarda configuração manual)
**Última atualização:** 2026-04-10

---

## O que é
Motor de busca de produtos de beleza integrado ao Mercado Livre.
Alimenta: Wishlist (busca inline), Armário (auto-match), Descobrir (página dedicada).

---

## Arquivos principais

| Arquivo | O que faz |
|---|---|
| `lib/ml/token.ts` | Obtém access_token via refresh_token; cache em memória 6h |
| `lib/ml/searchProducts.ts` | Busca produtos na API ML com Bearer token |
| `lib/ml/buildDeeplink.ts` | Adiciona `matt_tool` + `matt_word` ao permalink (afiliado) |
| `app/api/ml/setup/route.ts` | Redireciona para OAuth ML (one-time setup) |
| `app/api/ml/callback/route.ts` | Troca `code` por `refresh_token`, exibe na tela |
| `app/api/armario/buscar-ml/route.ts` | Endpoint server-side usado por todas as buscas |
| `lib/produtos/types.ts` | `ProdutoUnificado`, `CATEGORIAS_BELEZA`, `CATEGORIA_ML_QUERY` |
| `lib/produtos/providers/ml.ts` | Adapter ML → ProdutoUnificado |
| `lib/produtos/providers/index.ts` | Orchestrator multi-provider (Shopee/Magalu no futuro) |

---

## Progresso

- ✅ `lib/ml/token.ts` — usa `grant_type=refresh_token` (não mais `client_credentials`)
- ✅ `lib/ml/searchProducts.ts` — sem filtros category/condition, fallback robusto
- ✅ `/api/ml/setup` e `/api/ml/callback` — endpoints de setup OAuth criados
- ✅ `lib/ml/clientSearch.ts` — DELETADO (não funciona: CORS + auth bloqueados pelo ML)
- ✅ Armário, Wishlist, Descobrir — revertidos para chamadas server-side
- ✅ Deeplinks de afiliado gerados server-side
- 🚫 **Bloqueado:** `ML_REFRESH_TOKEN` não está na Vercel ainda

---

## Contexto técnico crítico

### Por que `client_credentials` não funciona
O ML não suporta esse grant para o endpoint `/sites/MLB/search`.
Dá acesso apenas app-level (webhooks) — sem escopo de marketplace search.
Confirmado: `client_credentials` retorna token, mas token retorna 403 na busca.

### Por que browser direto não funciona
ML bloqueia CORS para origens arbitrárias. `searchMLClient.ts` foi testado e retorna 403 no browser também.

### Como o token funciona agora
1. `getMLToken()` em `lib/ml/token.ts` usa `grant_type=refresh_token`
2. Troca `ML_REFRESH_TOKEN` por `access_token` (válido 6h)
3. `access_token` fica em cache de memória (`let cached`)
4. Cada cold start faz uma nova troca — normal para serverless

### Rotação de refresh_token
- ML pode emitir novo `refresh_token` ao usar o atual
- Quando isso ocorre, os logs da Vercel mostram: `[ML token] novo refresh_token emitido`
- Nesse caso: copiar o novo valor dos logs e atualizar a env var na Vercel

### Afiliado
- `ML_AFFILIATE_TRACKING_ID` → `matt_tool` na URL
- `ML_AFFILIATE_WORD` → `matt_word` na URL
- Gerados sempre server-side em `buildDeeplink.ts`

---

## Passos para desbloquear

### No portal ML (developers.mercadolivre.com.br → seu app)
1. Habilitar **"Código de Autorização"** (Authorization Code)
2. Habilitar **"Refresh Token"**
3. Redirect URI: `https://chiqueteza.vercel.app/api/ml/callback`
4. Salvar

### Obter o refresh_token
5. Visitar `https://chiqueteza.vercel.app/api/ml/setup`
6. Autorizar na tela do ML
7. Copiar o `ML_REFRESH_TOKEN` exibido

### Na Vercel
8. Settings → Environment Variables → `ML_REFRESH_TOKEN` (All Environments)
9. Save → Redeploy

---

## Teste de validação
Após configurar:
- Abrir `/app/descobrir` → buscar "protetor solar"
- Deve retornar grid com fotos, preços, botão "Ver no ML"
- Verificar logs Vercel: `[ML token] token renovado via refresh_token`
- Clicar no deeplink → URL deve conter `?matt_tool=...&matt_word=...`
</content>
</invoke>
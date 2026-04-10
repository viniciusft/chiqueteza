# Feature: Armário Digital

**Status:** ✅ Concluído (auto-match ML dependente do ML_REFRESH_TOKEN)
**Última atualização:** 2026-04-10

---

## O que é
Registro dos produtos de beleza que a usuária possui. Rastreia nível de uso, validade e preço no ML.
O auto-match vincula automaticamente cada produto ao ML após salvar, sem interação da usuária.

---

## Arquivos principais

| Arquivo | O que faz |
|---|---|
| `app/app/armario/page.tsx` | Página completa (lista + formulário + auto-match) |
| `app/api/armario/buscar-ml/route.ts` | Busca ML server-side (usado por auto-match e wishlist) |
| `app/api/armario/ocr-foto/route.ts` | OCR de embalagem via Gemini (extrai nome/marca/categoria) |

---

## Banco de dados — `armario_produtos`

Colunas principais (ver CLAUDE.md para lista completa):
- `status` — calculado pelo trigger `trg_status_armario` (NUNCA forçar manualmente)
- `nivel_atual` (0-100) → ≤15 muda status para `acabando` automaticamente
- `ml_produto_id`, `ml_preco_atual`, `ml_deeplink` — preenchidos pelo auto-match

---

## Progresso

- ✅ CRUD completo de produtos
- ✅ Foto via câmera/galeria + OCR de embalagem
- ✅ Nível de uso com slider (0-100%)
- ✅ Trigger SQL de status automático
- ✅ Tab "🔍 ML" **REMOVIDA** — apenas "✍️ Manual" e "📷 Foto"
- ✅ Auto-match ML silencioso após salvar produto
- ✅ Toast informativo quando auto-match encontra produto
- ✅ Insert retorna `id` do produto criado para o auto-match usar
- ✅ Jobs Inngest: verificação diária de preços + alertas de reposição
- ✅ Vínculo bidirecional com Wishlist (`wishlist_id`)

---

## Contexto técnico

### Auto-match (função `autoMatchML`)
```typescript
// Chamada fire-and-forget após insert bem-sucedido
if (novoProduto?.id) {
  void autoMatchML(supabase, novoProduto.id, form.nome, form.marca)
}
```
- Busca `GET /api/armario/buscar-ml?q={nome} {marca}`
- Pega primeiro resultado (`data.produtos?.[0]`)
- Faz update em `armario_produtos`: `ml_produto_id`, `ml_preco_atual`, `ml_deeplink`
- Toast sutil, não bloqueante. Falha silenciosa (best-effort)

### Por que tab ML foi removida
A visão do produto é rastreamento automático e inteligente. A usuária não deve precisar
buscar e vincular manualmente. O auto-match faz isso por ela em background.

### OCR de embalagem
- Rota: `POST /api/armario/ocr-foto`
- Gemini Flash recebe foto em base64 → retorna JSON com nome, marca, categoria
- NUNCA expor GEMINI_API_KEY no frontend

### Jobs Inngest
- `verificar-precos-ml`: todo dia às 9h — usa `getMLItemDetails()` de `searchProducts.ts`
- `alertas-reposicao`: todo dia às 8h — detecta nivel ≤ 15% ou data_fim ≤ hoje+7dias

---

## Regras críticas de banco
- `status` é GENERATED pelo trigger — nunca incluir no insert/update manual
- `data_fim_estimada`: calculado como `data_abertura + dias` (diaria=30, semanal=90, mensal=180, raramente=365)
- `origem`: 'manual' | 'busca_ml' | 'ocr_foto' | 'da_wishlist'
</content>
</invoke>
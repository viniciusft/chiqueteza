# Feature: Armário Digital

**Status:** ✅ Concluído — v2 (7 novas features)
**Última atualização:** 2026-04-11

---

## O que é
Registro dos produtos de beleza que a usuária possui. Rastreia nível de uso através de
check-ins manuais, validade e preço no ML. A v2 transforma o armário num diário de uso inteligente.

---

## Arquivos principais

| Arquivo | O que faz |
|---|---|
| `app/app/armario/page.tsx` | Orquestrador: estado global, data fetching, handlers |
| `app/app/armario/_components/ProdutoCard.tsx` | Card de produto com todas as ações |
| `app/app/armario/_components/FormAdicionarProduto.tsx` | Formulário add/edit (manual + OCR) |
| `app/app/armario/_components/AvaliacaoSheet.tsx` | Bottom sheet de avaliação pós-finalização |
| `app/app/armario/_components/AlertaRotatividade.tsx` | Card de sugestão de rotatividade |
| `app/api/armario/buscar-ml/route.ts` | Busca ML server-side |
| `app/api/armario/ocr-foto/route.ts` | OCR de embalagem via Gemini |

---

## Banco de dados — `armario_produtos`

### Colunas v1 (existentes)
- `status` — calculado pelo trigger `trg_status_armario` (NUNCA forçar manualmente)
- `nivel_atual` (0-100) → ≤15 muda status para `acabando` automaticamente
- `ml_produto_id`, `ml_preco_atual`, `ml_deeplink` — preenchidos pelo auto-match
- `frequencia_uso` ('diaria'|'semanal'|'mensal'|'raramente')
- `ciclos_finalizados` (int, default 0)

### Colunas v2 (adicionadas via migration)
- `avaliacao` (smallint 1–5) — avaliação da usuária ao finalizar
- `avaliacao_texto` (text) — review escrita ao finalizar
- `data_finalizacao` (date) — quando o produto foi finalizado
- `ciclos_finalizados` (int, default 0) — quantas vezes esse produto foi finalizado (conta frascos)
- `rotatividade_ativa` (boolean, default false) — incluir nas sugestões de rotatividade
- `ultimo_uso_em` (date) — última vez que a usuária registrou uso (para ordenação e rotatividade)

---

## Features v2

### 1. Registrar Uso ("Usar ✓")
- Botão em cada card de produto ativo
- Decremento por uso: `Math.max(1, Math.round(100 / diasEstimados))`
  - Diária (30d) → ~3% por uso
  - Semanal (90d) → ~1% por uso
- Limita 1 uso por dia por produto (`ultimo_uso_em === hoje`)
- Se nivel cair a 0 após uso → abre avaliação automaticamente
- Badge "Usado hoje ✓" quando já registrou no dia

### 2. Edição de produto
- Ícone de lápis no card
- Abre FormAdicionarProduto com `produtoExistente` preenchido
- Salva via UPDATE (mesmo formulário, modo diferente)

### 3. Fluxo "Acabou" com avaliação
- Clica "Acabou" → abre AvaliacaoSheet
- Estrelinhas 1–5 + campo de texto (review — estrutura para compartilhar futuramente)
- Confirmar → produto vai para Finalizados, `ciclos_finalizados++`
- Após confirmar: CTA "Comprar de novo no ML" (deeplink ou busca)

### 4. Seção Finalizados + Reativação
- Tab "Finalizados" na página
- Card: foto/emoji, nome, "Xº frasco" (ciclos_finalizados), avaliação em estrelas, data
- Botão "Reativar" → volta com `nivel_atual=100`, `status` calculado pelo trigger
  - `ciclos_finalizados` mantido (NÃO zera)
  - `data_finalizacao` limpa, `avaliacao`/`avaliacao_texto` limpos para nova avaliação
- Botão "Comprar de novo" (deeplink ML se disponível)

### 5. Indicador ML no card
- Mostra `ml_preco_atual` formatado junto ao botão "Ver no ML"
- Botão "×" para desvincular (limpa ml_produto_id, ml_preco_atual, ml_deeplink)

### 6. Ordenação inteligente
- Tab "Em Uso" ordenada por:
  1. Status acabando (nivel ≤ 15) primeiro
  2. Produtos não usados hoje antes dos já usados
  3. `ultimo_uso_em` mais antigo (mais esquecido) primeiro
  4. Frequência diária antes de semanal/mensal

### 7. Rotatividade
- Toggle `rotatividade_ativa` no formulário de edição
- AlertaRotatividade: detecta 2+ produtos da mesma categoria com rotatividade ativa
- Sugere o produto com `ultimo_uso_em` mais antigo (ou null = nunca usado)
- Card de alerta na tela principal do Armário

---

## Progresso v2

- ✅ Migration aplicada no Supabase
- ✅ STATUS.md e features/armario.md atualizados
- ✅ ProdutoCard.tsx
- ✅ FormAdicionarProduto.tsx
- ✅ AvaliacaoSheet.tsx
- ✅ AlertaRotatividade.tsx
- ✅ page.tsx reescrito como orquestrador slim
- ✅ _types.ts com interfaces e constantes compartilhadas

---

## Regras críticas de banco
- `status` é GENERATED pelo trigger — nunca incluir no insert/update manual
- `ciclos_finalizados` — incrementar com `.update({ ciclos_finalizados: produto.ciclos_finalizados + 1 })`
- `data_fim_estimada`: calculado como `data_abertura + dias` (diaria=30, semanal=90, mensal=180, raramente=365)
- `origem`: 'manual' | 'busca_ml' | 'ocr_foto' | 'da_wishlist'

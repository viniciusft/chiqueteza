# Plano: Armário v2 — 7 features

**Data:** 2026-04-11
**Status:** ✅ Implementado
**Branch:** `claude/init-nextjs-project-Pu4XH`

---

## Contexto

O Armário Digital v1 era um registro estático: a usuária adicionava produtos, via o nível via slider manual, e clicava "Acabou" para remover. Não havia histórico, edição, avaliação nem inteligência de uso.

A v2 transforma o Armário num **diário de uso inteligente** — o nível cai quando a usuária registra uso real, produtos finalizados têm avaliação e histório de ciclos, e o app sugere rotatividade entre produtos similares.

---

## Decisões técnicas

### Por que o nível não decrementa por tempo
Discutido com a usuária: se ela ficar 15 dias sem abrir o app, o nível não deveria cair — isso seria impreciso. O nível só cai quando ela toca em "Usar ✓", refletindo uso real.

### Avaliação estruturada para compartilhamento futuro
O campo `avaliacao_texto` foi projetado para ser compartilhado futuramente como resenha pública. Por ora é privado.

### Ciclos (contagem de frascos)
`ciclos_finalizados` nunca zera ao reativar — conta quantas vezes aquele produto foi finalizado no total. Ao reativar, `data_finalizacao`, `avaliacao` e `avaliacao_texto` são limpos para nova avaliação no próximo ciclo.

---

## Migration aplicada

```sql
ALTER TABLE armario_produtos
  ADD COLUMN IF NOT EXISTS avaliacao SMALLINT CHECK (avaliacao >= 1 AND avaliacao <= 5),
  ADD COLUMN IF NOT EXISTS avaliacao_texto TEXT,
  ADD COLUMN IF NOT EXISTS data_finalizacao DATE,
  ADD COLUMN IF NOT EXISTS ciclos_finalizados INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rotatividade_ativa BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ultimo_uso_em DATE;
```

---

## Arquivos criados/modificados

| Arquivo | Mudança |
|---|---|
| `app/app/armario/_types.ts` | CRIADO — interfaces e constantes compartilhadas |
| `app/app/armario/_components/ProdutoCard.tsx` | CRIADO — card com todas as ações |
| `app/app/armario/_components/FormAdicionarProduto.tsx` | CRIADO — formulário add/edit com toggle rotatividade |
| `app/app/armario/_components/AvaliacaoSheet.tsx` | CRIADO — bottom sheet de avaliação pós-finalização |
| `app/app/armario/_components/AlertaRotatividade.tsx` | CRIADO — card de sugestão de rotatividade |
| `app/app/armario/page.tsx` | REESCRITO — orquestrador slim ~260 linhas |
| `.claude/STATUS.md` | Armário v2 → concluído |
| `.claude/features/armario.md` | Atualizado com v2 completo |

---

## Features implementadas

1. **Usar ✓** — decremento por uso, 1x/dia, badge "Usado hoje", se nivel→0 abre avaliação
2. **Edição** — lápis no card abre formulário preenchido com UPDATE
3. **Fluxo Acabou** — estrelinhas 1-5 + texto + CTA recompra ML
4. **Finalizados** — tab Hist. com contador de ciclos e reativação
5. **Indicador ML** — preço no card + botão × para desvincular
6. **Ordenação inteligente** — acabando → não usado hoje → mais esquecido → frequência diária
7. **Rotatividade** — toggle no form + alerta quando há 2+ produtos parados da mesma categoria

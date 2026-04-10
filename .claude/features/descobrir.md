# Feature: Descobrir

**Status:** ✅ Concluído (dependente do ML_REFRESH_TOKEN para busca funcionar)
**Última atualização:** 2026-04-10

---

## O que é
Página dedicada à descoberta de produtos de beleza. Não é uma aba do tab bar — é acessada
via quick action na home (`/app`). Permite busca por texto + filtro por categoria.
Salva produto direto na wishlist com um toque.

---

## Arquivos principais

| Arquivo | O que faz |
|---|---|
| `app/app/descobrir/page.tsx` | Página completa |
| `app/api/descobrir/route.ts` | Endpoint alternativo (usa lib/produtos multi-provider) |
| `lib/produtos/types.ts` | `CATEGORIAS_BELEZA`, `CATEGORIA_ML_QUERY` |

---

## Progresso

- ✅ Input de busca com debounce 400ms
- ✅ Pills de categoria (Skincare, Maquiagem, Perfume, Cabelo, Corpo, Unhas)
- ✅ Grid 2 colunas com skeleton loading
- ✅ Card: thumbnail, nome, preço, badge do provider, "Ver no ML" + salvar wishlist
- ✅ Salvar na wishlist: insert com `ml_produto_id` + `ml_deeplink`
- ✅ Toast de confirmação ao salvar
- ✅ Banner "Em breve: Shopee, Magalu" quando há resultados
- ✅ Quick action na home: ícone Compass + label "Descobrir"
- ✅ Interface `Produto` definida localmente (sem import de clientSearch — removido)

---

## Contexto técnico

### Como a busca funciona
```
Input → debounce 400ms → GET /api/armario/buscar-ml?q={termoCat} {query}&limit=12
→ map results: add provider: 'mercadolivre'
→ setProdutos(resultados)
```

### Enriquecimento de categoria
Cada categoria tem um termo ML específico em `CATEGORIA_ML_QUERY`:
```typescript
// lib/produtos/types.ts
export const CATEGORIA_ML_QUERY: Record<string, string> = {
  skincare: 'skincare cuidados rosto',
  maquiagem: 'maquiagem cosméticos',
  perfume: 'perfume fragrância',
  // ...
}
```
A busca concatena o termo da categoria com o texto digitado para melhor relevância.

### Por que não é uma aba do tab bar
Tab bar tem 5 abas fixas: Início | Looks | Autocuidado | Agenda | Profissionais.
Descobrir é uma funcionalidade de exploração — fica como quick action na home para
não poluir a navegação principal.

---

## Próximos passos possíveis
- Paginação / scroll infinito
- Filtro de preço (range)
- Integração Shopee + Magalu (multi-provider já preparado em `lib/produtos/`)
- Histórico de buscas recentes
</content>
</invoke>
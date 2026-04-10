# Status do Projeto — Chiqueteza
> Atualizar este arquivo sempre que uma feature for concluída, iniciada ou bloqueada.

**Última atualização:** 2026-04-10
**Branch de trabalho:** `claude/init-nextjs-project-Pu4XH`

---

## 🔄 Em andamento agora

### ML OAuth — Busca de Produtos
**Feature doc:** `.claude/features/ml-oauth.md`
**Status:** Implementado, aguardando ação manual da usuária
**Bloqueio:** Usuária precisa:
1. Habilitar "Código de Autorização" + "Refresh Token" no portal ML
2. Mudar redirect URI para `https://chiqueteza.vercel.app/api/ml/callback`
3. Visitar `/api/ml/setup` → autorizar → copiar `ML_REFRESH_TOKEN`
4. Adicionar na Vercel → Redeploy

---

## ⏳ Pendente de configuração (código pronto, env var faltando)

| Feature | O que falta |
|---|---|
| Busca ML | `ML_REFRESH_TOKEN` na Vercel (ver bloqueio acima) |
| Push Notifications | `NEXT_PUBLIC_VAPID_KEY` + `VAPID_PRIVATE_KEY` na Vercel |

---

## ✅ Concluído

| Feature | Observação |
|---|---|
| Armário Digital | Auto-match ML silencioso pós-save |
| Wishlist | Busca ML integrada + badge "Ver no ML" |
| Descobrir | Página de busca por categoria |
| Push Notifications | Arquitetura completa (sw.js + endpoints) |
| Multi-provider ML | lib/produtos/ preparada para Shopee/Magalu |
| Visagismo + Colorimetria | Gemini Flash, resultado completo |
| Diário de Looks | Galeria pública + curtidas |
| Checklist Autocuidado | Streaks + drag-and-drop |
| Jobs Inngest | Verificação diária de preços + alertas de reposição |
| OCR de embalagem | Gemini extrai nome/marca/categoria |
| OAuth ML endpoints | `/api/ml/setup` + `/api/ml/callback` |
| Admin Dashboard | `/app/admin` — env health + stats + feature status |

---

## 📋 Próximas features (backlog)

- [ ] Try-On de maquiagem (V2) — provider de imagem a definir (FLUX Kontext Pro via fal.ai)
- [ ] PremiumGate — componente de paywall com Stripe
- [ ] Ideias de corte de cabelo (V3) — usa dados do visagismo
- [ ] Matching de base colaborativo (V3)

---

## ⚠️ Regras de contexto para o Claude

Ao iniciar uma sessão:
1. Leia este arquivo (`STATUS.md`)
2. Leia o CLAUDE.md na raiz do projeto
3. Se for trabalhar em uma feature específica, leia `.claude/features/[feature].md`
4. Sempre commitar antes de iniciar uma tarefa nova

# Status do Projeto — Chiqueteza
> Atualizar este arquivo sempre que uma feature for concluída, iniciada ou bloqueada.

**Última atualização:** 2026-04-12
**Branch de trabalho:** `claude/init-nextjs-project-Pu4XH`

---

## 🔄 Em andamento agora

Nenhuma feature em andamento. Ver backlog abaixo.

---

## ⏳ Pendente de configuração (código pronto, env var faltando)

| Feature | O que falta |
|---|---|
| Busca ML | `ML_REFRESH_TOKEN` na Vercel — visitar `/api/ml/setup` em produção |
| Push Notifications | `NEXT_PUBLIC_VAPID_KEY` + `VAPID_PRIVATE_KEY` na Vercel |

---

## ✅ Concluído

| Feature | Observação |
|---|---|
| **Rede Social** | Perfis @username, seguir/seguindo, galeria Explorar/Seguindo, busca de usuárias, toggle público por item |
| Armário Digital v2 | Usar ✓, edição, avaliação, finalizados, rotatividade, ordenação inteligente, toggle público |
| Wishlist | Busca ML integrada + badge "Ver no ML" + toggle público |
| Descobrir | Página de busca por categoria |
| Push Notifications | Arquitetura completa (sw.js + endpoints) |
| Multi-provider ML | lib/produtos/ preparada para Shopee/Magalu |
| Visagismo + Colorimetria | Gemini Flash, resultado completo |
| Diário de Looks | Galeria pública + curtidas + feed social |
| Checklist Autocuidado | Streaks + drag-and-drop |
| Jobs Inngest | Verificação diária de preços + alertas de reposição |
| OCR de embalagem | Gemini extrai nome/marca/categoria |
| OAuth ML endpoints | `/api/ml/setup` + `/api/ml/callback` |
| Admin Dashboard | `/app/admin` — env health + stats + feature status (inclui social) |

---

## 📋 Próximas features (backlog)

- [ ] Try-On de maquiagem (V2) — provider de imagem a definir (FLUX Kontext Pro via fal.ai)
- [ ] PremiumGate — componente de paywall com Stripe
- [ ] Ideias de corte de cabelo (V3) — usa dados do visagismo
- [ ] Matching de base colaborativo (V3)
- [ ] Notificação push de novo seguidor (V2 social)
- [ ] Comentários em looks (V2 social)

---

## ⚠️ Regras de contexto para o Claude

Ao iniciar uma sessão:
1. Leia este arquivo (`STATUS.md`)
2. Leia o CLAUDE.md na raiz do projeto
3. Se for trabalhar em uma feature específica, leia `.claude/features/[feature].md`
4. Sempre commitar antes de iniciar uma tarefa nova

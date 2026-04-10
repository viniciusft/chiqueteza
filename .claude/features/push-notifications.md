# Feature: Push Notifications

**Status:** 🚫 Bloqueado (VAPID keys não configuradas na Vercel)
**Última atualização:** 2026-04-10

---

## O que é
Sistema de notificações push para alertar a usuária sobre: reposição de produto acabando,
queda de preço no ML, lembretes de rotina. Usa Web Push API com VAPID keys.

---

## Arquivos principais

| Arquivo | O que faz |
|---|---|
| `public/sw.js` | Service Worker — listeners `push` e `notificationclick` |
| `components/ui/NotificationPermission.tsx` | Banner de permissão (aparece 4s após abrir o app) |
| `app/api/push/subscribe/route.ts` | POST salva subscription / DELETE remove |
| `app/api/push/send/route.ts` | POST envia push via web-push + VAPID |
| `app/app/layout.tsx` | Monta `<NotificationPermission />` |

---

## Banco de dados — `push_subscriptions`

| Coluna | Tipo |
|---|---|
| id | uuid |
| usuario_id | uuid → perfis |
| subscription_json | jsonb (PushSubscription completo) |

---

## Progresso

- ✅ `public/sw.js` — listeners `push` e `notificationclick` adicionados
- ✅ `NotificationPermission.tsx` — banner com delay 4s, chama PushManager.subscribe()
- ✅ `/api/push/subscribe` — salva/remove subscription no Supabase
- ✅ `/api/push/send` — envia push via `web-push` com VAPID
- ✅ Jobs Inngest `alertas-reposicao` — detecta produto acabando e dispara push
- 🚫 **Bloqueado:** VAPID keys não estão na Vercel ainda

---

## Contexto técnico

### VAPID keys
```bash
# Gerar uma vez:
npx web-push generate-vapid-keys

# Resultado:
NEXT_PUBLIC_VAPID_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- `NEXT_PUBLIC_VAPID_KEY` → passada para o browser (PushManager.subscribe)
- `VAPID_PRIVATE_KEY` → apenas server-side (web-push sign)

### Como o subscribe funciona
```typescript
// NotificationPermission.tsx
const reg = await navigator.serviceWorker.ready
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY, // string direta
})
await fetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify(sub) })
```
Atenção: `applicationServerKey` aceita string direta no browser — não precisa converter para `Uint8Array` (evita problema de tipo TypeScript com `BufferSource`).

### Como o send funciona
```typescript
// POST /api/push/send
// Busca subscriptions da usuária no Supabase
// webpush.sendNotification(sub, JSON.stringify({ title, body, url }))
```
Autenticado via `SUPABASE_SERVICE_ROLE_KEY`.

### Fluxo de alerta de reposição (Inngest)
```
Job alertas-reposicao (8h diário)
  → busca armario_produtos onde nivel_atual ≤ 15 ou data_fim ≤ hoje+7
  → para cada produto: POST /api/push/send
  → notificação: "Seu [produto] está acabando — veja no ML"
```

---

## Para desbloquear
1. Gerar: `npx web-push generate-vapid-keys`
2. Vercel → Environment Variables:
   - `NEXT_PUBLIC_VAPID_KEY` = chave pública (All Environments)
   - `VAPID_PRIVATE_KEY` = chave privada (All Environments)
3. Redeploy
4. Testar: abrir app → aceitar permissão → enviar push via `/api/push/send`
</content>
</invoke>
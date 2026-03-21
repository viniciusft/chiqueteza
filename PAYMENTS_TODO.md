# TODO — Sistema de Pagamentos

## Quando implementar
Após validação do produto com usuárias reais.

## Stack recomendada
- **Stripe** — pagamentos recorrentes (assinaturas)
  * stripe/stripe-node para backend
  * @stripe/stripe-js para frontend
  * Webhook para controlar ativação/cancelamento de planos

## O que precisa ser construído
- [ ] Integração Stripe (checkout, webhook, portal do cliente)
- [ ] Tabela `assinaturas` no Supabase
- [ ] Página /premium com planos e CTA
- [ ] Fluxo de upgrade: free → premium
- [ ] Fluxo de cancelamento e downgrade
- [ ] Renovação automática de créditos mensais via cron job
- [ ] E-mail de confirmação de pagamento

## Nota Fiscal (LGPD + NF-e)
- Integração com **Omie** ou **NFSe.io** para emissão automática
- Dados do usuário necessários: CPF/CNPJ, endereço
- Configurar no perfil antes de assinar

## Segurança
- Nunca armazenar dados de cartão (Stripe cuida disso)
- Chaves Stripe NUNCA no frontend
- Webhook secret obrigatório para validar eventos

## Variáveis de ambiente necessárias (futuro)
```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PREMIUM_PRICE_ID=
NFSE_API_KEY=
```

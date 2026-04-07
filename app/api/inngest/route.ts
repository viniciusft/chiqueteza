import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { verificarPrecos } from '@/lib/inngest/verificarPrecos'
import { alertasReposicao } from '@/lib/inngest/alertasReposicao'
import { popularCidade } from '@/lib/inngest/popularCidade'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [verificarPrecos, alertasReposicao, popularCidade],
})

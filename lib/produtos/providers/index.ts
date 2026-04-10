// Orquestrador de providers
// Para adicionar um novo provider (Shopee, Magalu, etc):
//   1. Criar lib/produtos/providers/shopee.ts seguindo o padrão de ml.ts
//   2. Adicionar ao mapa PROVIDERS abaixo
//   3. Adicionar 'shopee' ao tipo Provider em types.ts
//   4. Configurar env vars e credenciais do provider

import { buscarML } from './ml'
import type { BuscaParams, BuscaResultado, Provider } from '../types'

type ProviderFn = (params: BuscaParams) => Promise<BuscaResultado>

const PROVIDERS: Partial<Record<Provider, ProviderFn>> = {
  mercadolivre: buscarML,
  // shopee: buscarShopee,     // futuro
  // magalu: buscarMagalu,     // futuro
  // amazon: buscarAmazon,     // futuro
}

// Busca em um provider específico
export async function buscarEmProvider(provider: Provider, params: BuscaParams): Promise<BuscaResultado> {
  const fn = PROVIDERS[provider]
  if (!fn) {
    return { provider, produtos: [], total: 0, erro: `Provider "${provider}" não disponível` }
  }
  return fn(params)
}

// Busca em todos os providers ativos (para comparação de preços futura)
export async function buscarEmTodosProviders(params: BuscaParams): Promise<BuscaResultado[]> {
  const ativos = Object.keys(PROVIDERS) as Provider[]
  const resultados = await Promise.allSettled(
    ativos.map(p => buscarEmProvider(p, params))
  )
  return resultados
    .filter((r): r is PromiseFulfilledResult<BuscaResultado> => r.status === 'fulfilled')
    .map(r => r.value)
}

export const providersAtivos: Provider[] = ['mercadolivre']

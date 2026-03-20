export const CREDIT_COSTS = {
  VISAGISMO_IMAGEM: 10,
  TRYON_LOOK: 15,
  VISAGISMO_REFAZER: 5,
  CORTE_CABELO: 10,
} as const

export type FeatureKey = keyof typeof CREDIT_COSTS

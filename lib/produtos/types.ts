// Tipos unificados para busca de produtos multi-provider
// Suporta ML hoje, Shopee/Magalu/Amazon no futuro

export type Provider = 'mercadolivre' | 'shopee' | 'magalu' | 'amazon'

export interface ProdutoUnificado {
  id: string
  provider: Provider
  titulo: string
  preco: number
  precoOriginal?: number // para exibir desconto
  thumbnail: string
  permalink: string        // link original do provider
  deeplink: string         // link de afiliado
  disponivel: boolean
  vendedor: string | null
  avaliacao?: number       // 0-5
  totalAvaliacoes?: number
  condicao: 'new' | 'used' | string
  frete?: {
    gratis: boolean
    valor?: number
  }
}

export interface BuscaParams {
  query: string
  limit?: number
  categoria?: string
  precoMin?: number
  precoMax?: number
  condicao?: 'new' | 'used'
}

export interface BuscaResultado {
  provider: Provider
  produtos: ProdutoUnificado[]
  total: number
  erro?: string
}

// Categorias de beleza padronizadas (agnósticas de provider)
export const CATEGORIAS_BELEZA = [
  { value: 'skincare', label: 'Skincare', emoji: '✨' },
  { value: 'maquiagem', label: 'Maquiagem', emoji: '💄' },
  { value: 'cabelo', label: 'Cabelo', emoji: '💆' },
  { value: 'corpo', label: 'Corpo', emoji: '🧴' },
  { value: 'perfume', label: 'Perfume', emoji: '🌸' },
  { value: 'unhas', label: 'Unhas', emoji: '💅' },
  { value: 'solar', label: 'Proteção Solar', emoji: '☀️' },
  { value: 'higiene', label: 'Higiene', emoji: '🪥' },
] as const

// Mapeamento para termos de busca no ML
export const CATEGORIA_ML_QUERY: Record<string, string> = {
  skincare: 'skincare cuidados rosto',
  maquiagem: 'maquiagem cosmeticos',
  cabelo: 'shampoo condicionador tratamento cabelo',
  corpo: 'hidratante corpo loção',
  perfume: 'perfume colonia feminino',
  unhas: 'esmalte nail art',
  solar: 'protetor solar FPS',
  higiene: 'sabonete creme higiene pessoal',
}

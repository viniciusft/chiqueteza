export interface ArmarioProduto {
  id: string
  usuario_id: string
  nome: string
  marca: string | null
  categoria: string | null
  subcategoria: string | null
  volume_total: string | null
  foto_url: string | null
  data_abertura: string | null
  frequencia_uso: 'diaria' | 'semanal' | 'mensal' | 'raramente'
  nivel_atual: number
  data_validade: string | null
  data_fim_estimada: string | null
  ml_produto_id: string | null
  ml_preco_atual: number | null
  ml_deeplink: string | null
  status: 'em_uso' | 'acabando' | 'finalizado' | 'guardado'
  notas: string | null
  // v2
  avaliacao: number | null
  avaliacao_texto: string | null
  data_finalizacao: string | null
  ciclos_finalizados: number
  rotatividade_ativa: boolean
  ultimo_uso_em: string | null
  created_at: string
}

export const FREQUENCIA_CONFIG = {
  diaria:    { label: 'Diária',    diasEstimados: 30  },
  semanal:   { label: 'Semanal',   diasEstimados: 90  },
  mensal:    { label: 'Mensal',    diasEstimados: 180 },
  raramente: { label: 'Raramente', diasEstimados: 365 },
} as const

export const CATEGORIAS = [
  { value: 'skincare',    emoji: '🧴', label: 'Skincare' },
  { value: 'maquiagem',  emoji: '💄', label: 'Maquiagem' },
  { value: 'cabelo',     emoji: '💆', label: 'Cabelo' },
  { value: 'corpo',      emoji: '🛁', label: 'Corpo' },
  { value: 'perfume',    emoji: '🌸', label: 'Perfume' },
  { value: 'unhas',      emoji: '💅', label: 'Unhas' },
  { value: 'ferramenta', emoji: '🔧', label: 'Ferramenta' },
] as const

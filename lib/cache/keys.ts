export const CACHE_KEYS = {
  // Agendamentos: cache de 2 minutos (muda com frequência)
  agendamentos: (userId: string) => `agendamentos_${userId}`,
  AGENDAMENTOS_TTL: 2 * 60 * 1000,

  // Profissionais: cache de 10 minutos (muda raramente)
  profissionais: (userId: string) => `profissionais_${userId}`,
  PROFISSIONAIS_TTL: 10 * 60 * 1000,

  // Visagismo: cache de 24 horas (quase nunca muda)
  analise: (userId: string) => `analise_${userId}`,
  ANALISE_TTL: 24 * 60 * 60 * 1000,

  // Créditos: cache de 5 minutos
  creditos: (userId: string) => `creditos_${userId}`,
  CREDITOS_TTL: 5 * 60 * 1000,

  // Plano: cache de 1 hora
  plano: (userId: string) => `plano_${userId}`,
  PLANO_TTL: 60 * 60 * 1000,
}

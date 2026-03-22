type CacheEntry<T> = {
  data: T
  timestamp: number
  ttl: number // em ms
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

export function setCache<T>(key: string, data: T, ttlMs = 60_000) {
  memoryCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
  try {
    localStorage.setItem(`chiqueteza_${key}`, JSON.stringify({ data, timestamp: Date.now(), ttl: ttlMs }))
  } catch {}
}

export function getCache<T>(key: string): T | null {
  // Primeiro tenta memória (mais rápido)
  const mem = memoryCache.get(key)
  if (mem && Date.now() - mem.timestamp < mem.ttl) {
    return mem.data as T
  }
  // Depois tenta localStorage (persiste entre sessões)
  try {
    const stored = localStorage.getItem(`chiqueteza_${key}`)
    if (stored) {
      const entry = JSON.parse(stored) as CacheEntry<T>
      if (Date.now() - entry.timestamp < entry.ttl) {
        memoryCache.set(key, entry) // restaura na memória
        return entry.data
      }
    }
  } catch {}
  return null
}

export function invalidateCache(key: string) {
  memoryCache.delete(key)
  try { localStorage.removeItem(`chiqueteza_${key}`) } catch {}
}

export function invalidateCachePrefix(prefix: string) {
  memoryCache.forEach((_, key) => { if (key.startsWith(prefix)) memoryCache.delete(key) })
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(`chiqueteza_${prefix}`))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}

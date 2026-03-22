'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCache, setCache } from './index'

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
) {
  const [data, setData] = useState<T | null>(() => getCache<T>(key))
  const [loading, setLoading] = useState(!getCache<T>(key))
  const [error, setError] = useState<Error | null>(null)

  const revalidate = useCallback(async () => {
    try {
      const fresh = await fetcher()
      setCache(key, fresh, ttl)
      setData(fresh)
    } catch (e) {
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl])

  useEffect(() => {
    revalidate()
  }, [revalidate])

  return { data, loading, error, revalidate }
}

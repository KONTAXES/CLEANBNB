'use client'
import { useState, useCallback } from 'react'
import { getCurrentPosition, type GpsPosition } from '@/lib/gps'

export function useGps() {
  const [position, setPosition] = useState<GpsPosition | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const capture = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const pos = await getCurrentPosition()
      setPosition(pos)
      return pos
    } catch (err: any) {
      setError(err.message ?? 'Error obteniendo ubicación')
      return null
    } finally { setLoading(false) }
  }, [])

  return { position, loading, error, capture }
}

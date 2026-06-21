import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { type BirthProfile, loadProfiles } from '@/lib/birthProfiles'

export function useBirthProfiles() {
  const [profiles, setProfiles] = useState<BirthProfile[]>([])
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    try {
      setProfiles(await loadProfiles())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    }
  }, [])

  useFocusEffect(useCallback(() => { void refresh() }, [refresh]))

  return { profiles, refresh, error }
}

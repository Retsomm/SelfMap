import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { type BirthProfile, loadProfiles } from '@/lib/birthProfiles'

export function useBirthProfiles() {
  const [profiles, setProfiles] = useState<BirthProfile[]>([])

  const refresh = useCallback(async () => {
    try {
      setProfiles(await loadProfiles())
    } catch {
      // keep stale list rather than resetting to empty
    }
  }, [])

  useFocusEffect(useCallback(() => { void refresh() }, [refresh]))

  return { profiles, refresh }
}

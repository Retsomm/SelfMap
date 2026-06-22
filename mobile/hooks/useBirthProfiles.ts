import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { type BirthProfile, loadProfiles } from '@/lib/birthProfiles'

export function useBirthProfiles() {
  const { getToken } = useAuth()
  const getTokenRef = useRef(getToken)
  useEffect(() => { getTokenRef.current = getToken }, [getToken])

  const [profiles, setProfiles] = useState<BirthProfile[]>([])
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    try {
      const token = await getTokenRef.current()
      if (!token) return
      setProfiles(await loadProfiles(token))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    }
  }, []) // getToken 透過 ref 取用，不放 deps 避免無限觸發

  useFocusEffect(useCallback(() => { void refresh() }, [refresh]))

  return { profiles, refresh, error }
}

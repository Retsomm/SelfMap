'use client'

import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export type BirthProfile = {
  id: string
  label: string
  date: string
  time: string
  timezone: string
  location: string
}

type DbProfile = BirthProfile & { sortOrder?: number; createdAt?: string; updatedAt?: string }

const isValidClerkProfile = (p: unknown): p is BirthProfile =>
  typeof p === 'object' && p !== null &&
  typeof (p as BirthProfile).id === 'string' &&
  typeof (p as BirthProfile).label === 'string' &&
  typeof (p as BirthProfile).date === 'string' &&
  typeof (p as BirthProfile).time === 'string' &&
  typeof (p as BirthProfile).timezone === 'string' &&
  typeof (p as BirthProfile).location === 'string'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const msg = await res.json().then((d: { error?: string }) => d.error).catch(() => `HTTP ${res.status}`)
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

const toBirthProfile = (p: DbProfile): BirthProfile => ({
  id: p.id, label: p.label, date: p.date, time: p.time, timezone: p.timezone, location: p.location,
})

const birthProfilesKey = (userId: string | undefined) => ['birthProfiles', userId] as const

// Module-level guard: only for one-time Clerk → DB migration, not for fetching
const migratedUserIds = new Set<string>()
// Module-level guard: prevents concurrent migration runs for the same user
const migratingUserIds = new Set<string>()

export const useBirthProfiles = () => {
  const { isSignedIn, user } = useUser()
  const queryClient = useQueryClient()
  const queryKey = birthProfilesKey(user?.id)

  // ── 從 DB 讀取（伺服器狀態交給 React Query 管快取/重試/重新整理）───────
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => apiFetch<{ profiles: DbProfile[] }>('/api/birth-profiles'),
    enabled: !!isSignedIn,
  })

  const profiles = (data?.profiles ?? []).map(toBirthProfile)

  // ── 一次性遷移：若 DB 空且 Clerk metadata 有舊資料 → 自動遷移 ──────────
  useEffect(() => {
    if (!isSignedIn || !user || migratedUserIds.has(user.id) || migratingUserIds.has(user.id)) return
    const userId = user.id
    migratingUserIds.add(userId)

    const migrate = async () => {
      const clerkRaw = user.unsafeMetadata?.birthProfiles
      const clerkProfiles: BirthProfile[] = Array.isArray(clerkRaw)
        ? clerkRaw.filter(isValidClerkProfile)
        : []
      if (clerkProfiles.length === 0) { migratedUserIds.add(userId); return }

      // 只在 DB 空時才遷移
      const dbData = await apiFetch<{ profiles: DbProfile[] }>('/api/birth-profiles')
      if (dbData.profiles.length > 0) { migratedUserIds.add(userId); return }

      console.log('[useBirthProfiles] migrating', clerkProfiles.length, 'profiles from Clerk to DB')
      await apiFetch<{ profiles: DbProfile[] }>('/api/birth-profiles', {
        method: 'POST',
        body: JSON.stringify({
          profiles: clerkProfiles.map((p, i) => ({ ...p, sortOrder: i })),
        }),
      })
      console.log('[useBirthProfiles] migration done')
      migratedUserIds.add(userId)
      await queryClient.invalidateQueries({ queryKey: birthProfilesKey(userId) })
    }

    migrate()
      .catch(err => console.error('[useBirthProfiles] migration error:', err))
      .finally(() => migratingUserIds.delete(userId))
  }, [isSignedIn, user, queryClient])

  // ── CRUD：mutate 完直接寫回 query cache，維持原本「立即反映在畫面」的體驗 ──
  const saveMutation = useMutation<DbProfile, Error, BirthProfile>({
    mutationFn: async (profile: BirthProfile) => {
      const exists = profiles.some(p => p.id === profile.id)
      if (exists) {
        const data = await apiFetch<{ profile: DbProfile }>(`/api/birth-profiles/${profile.id}`, {
          method: 'PATCH',
          body: JSON.stringify(profile),
        })
        return data.profile
      }
      const data = await apiFetch<{ profile: DbProfile }>('/api/birth-profiles', {
        method: 'POST',
        body: JSON.stringify({ ...profile, sortOrder: profiles.length }),
      })
      return data.profile
    },
    onSuccess: (savedDbProfile) => {
      queryClient.setQueryData<{ profiles: DbProfile[] }>(queryKey, old => {
        if (!old) return old
        const exists = old.profiles.some(p => p.id === savedDbProfile.id)
        return {
          profiles: exists
            ? old.profiles.map(p => p.id === savedDbProfile.id ? { ...p, ...savedDbProfile } : p)
            : [...old.profiles, savedDbProfile],
        }
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/birth-profiles/${id}`, { method: 'DELETE' }),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<{ profiles: DbProfile[] }>(queryKey, old =>
        old ? { profiles: old.profiles.filter(p => p.id !== id) } : old
      )
    },
  })

  return {
    profiles,
    loading: isLoading,
    error: error as Error | null,
    saveProfile: saveMutation.mutateAsync,
    deleteProfile: deleteMutation.mutateAsync,
    refresh: refetch,
    isSignedIn: !!isSignedIn,
  }
}

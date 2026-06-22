'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useRef, useState } from 'react'

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

// Module-level guard: survives component remounts (React StrictMode / nav back)
const migratedUserIds = new Set<string>()

export const useBirthProfiles = () => {
  const { isSignedIn, user } = useUser()
  const [profiles, setProfiles] = useState<BirthProfile[]>([])
  const [loading, setLoading] = useState(false)

  // ── 登出時清除狀態 ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSignedIn) {
      setProfiles([])
    }
  }, [isSignedIn])

  // ── 從 DB 讀取 ──────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!isSignedIn) return
    setLoading(true)
    try {
      const data = await apiFetch<{ profiles: DbProfile[] }>('/api/birth-profiles')
      setProfiles(data.profiles.map(p => ({
        id: p.id,
        label: p.label,
        date: p.date,
        time: p.time,
        timezone: p.timezone,
        location: p.location,
      })))
    } finally {
      setLoading(false)
    }
  }, [isSignedIn])

  // ── 首次載入：從 DB 讀取；若 DB 空且 Clerk metadata 有舊資料 → 自動遷移 ──
  useEffect(() => {
    if (!isSignedIn || !user || migratedUserIds.has(user.id)) return
    migratedUserIds.add(user.id)

    const run = async () => {
      const dbData = await apiFetch<{ profiles: DbProfile[] }>('/api/birth-profiles')
      if (dbData.profiles.length > 0) {
        setProfiles(dbData.profiles.map(p => ({
          id: p.id, label: p.label, date: p.date,
          time: p.time, timezone: p.timezone, location: p.location,
        })))
        return
      }
      // DB 空，檢查 Clerk metadata 舊資料
      const clerkRaw = user.unsafeMetadata?.birthProfiles
      const clerkProfiles: BirthProfile[] = Array.isArray(clerkRaw)
        ? clerkRaw.filter(isValidClerkProfile)
        : []
      if (clerkProfiles.length === 0) return

      // 批次匯入到 DB（Clerk 資料保留不刪除，作為備份）
      console.log('[useBirthProfiles] migrating', clerkProfiles.length, 'profiles from Clerk to DB')
      const imported = await apiFetch<{ profiles: DbProfile[] }>('/api/birth-profiles', {
        method: 'POST',
        body: JSON.stringify({
          profiles: clerkProfiles.map((p, i) => ({ ...p, sortOrder: i })),
        }),
      })
      console.log('[useBirthProfiles] migration done, imported', imported.profiles.length)
      setProfiles(imported.profiles.map(p => ({
        id: p.id, label: p.label, date: p.date,
        time: p.time, timezone: p.timezone, location: p.location,
      })))
    }

    run().catch(err => console.error('[useBirthProfiles] migration error:', err))
  }, [isSignedIn, user])

  // ── CRUD ────────────────────────────────────────────────────────────────
  const saveProfile = useCallback(async (profile: BirthProfile) => {
    const exists = profiles.some(p => p.id === profile.id)
    if (exists) {
      await apiFetch(`/api/birth-profiles/${profile.id}`, {
        method: 'PATCH',
        body: JSON.stringify(profile),
      })
      setProfiles(prev => prev.map(p => p.id === profile.id ? profile : p))
    } else {
      const data = await apiFetch<{ profile: DbProfile }>('/api/birth-profiles', {
        method: 'POST',
        body: JSON.stringify({ ...profile, sortOrder: profiles.length }),
      })
      setProfiles(prev => [...prev, {
        id: data.profile.id, label: data.profile.label, date: data.profile.date,
        time: data.profile.time, timezone: data.profile.timezone, location: data.profile.location,
      }])
    }
  }, [profiles])

  const deleteProfile = useCallback(async (id: string) => {
    await apiFetch(`/api/birth-profiles/${id}`, { method: 'DELETE' })
    setProfiles(prev => prev.filter(p => p.id !== id))
  }, [])

  return { profiles, loading, saveProfile, deleteProfile, refresh, isSignedIn: !!isSignedIn }
}

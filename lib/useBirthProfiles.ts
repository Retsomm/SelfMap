'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useRef } from 'react'

export type BirthProfile = {
  id: string
  label: string
  date: string
  time: string
  timezone: string
  location: string
}

const isValidProfile = (p: unknown): p is BirthProfile =>
  typeof p === 'object' && p !== null &&
  typeof (p as BirthProfile).id === 'string' &&
  typeof (p as BirthProfile).label === 'string' &&
  typeof (p as BirthProfile).date === 'string' &&
  typeof (p as BirthProfile).time === 'string' &&
  typeof (p as BirthProfile).timezone === 'string' &&
  typeof (p as BirthProfile).location === 'string'

export const useBirthProfiles = () => {
  const { isSignedIn, user } = useUser()
  const raw = isSignedIn ? user?.unsafeMetadata?.birthProfiles : undefined
  const profiles: BirthProfile[] = Array.isArray(raw) ? raw.filter(isValidProfile) : []

  // 永遠持有最新的 user 物件，供 queue 內的 task 讀取
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  // 所有寫入操作串成 Promise 鏈，避免 read-modify-write 競態
  const writeQueue = useRef<Promise<void>>(Promise.resolve())

  const enqueue = useCallback(<T>(task: () => Promise<T>): Promise<T> => {
    const result = writeQueue.current.then(task, task)
    writeQueue.current = result.then(() => undefined, () => undefined)
    return result
  }, [])

  const saveProfile = useCallback((profile: BirthProfile) =>
    enqueue(async () => {
      const u = userRef.current
      if (!u) throw new Error('Not authenticated')
      const current = (u.unsafeMetadata?.birthProfiles as BirthProfile[] | undefined) ?? []
      const updated = current.some(p => p.id === profile.id)
        ? current.map(p => p.id === profile.id ? profile : p)
        : [...current, profile]
      await u.update({ unsafeMetadata: { ...u.unsafeMetadata, birthProfiles: updated } })
    }), [enqueue])

  const deleteProfile = useCallback((id: string) =>
    enqueue(async () => {
      const u = userRef.current
      if (!u) throw new Error('Not authenticated')
      const current = (u.unsafeMetadata?.birthProfiles as BirthProfile[] | undefined) ?? []
      await u.update({
        unsafeMetadata: { ...u.unsafeMetadata, birthProfiles: current.filter(p => p.id !== id) },
      })
    }), [enqueue])

  return { profiles, saveProfile, deleteProfile, isSignedIn: !!isSignedIn }
}

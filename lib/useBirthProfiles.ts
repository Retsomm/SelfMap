'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback } from 'react'

export type BirthProfile = {
  id: string
  label: string
  date: string
  time: string
  timezone: string
  location: string
}

export const useBirthProfiles = () => {
  const { isSignedIn, user } = useUser()
  const profiles = (isSignedIn
    ? (user?.unsafeMetadata?.birthProfiles as BirthProfile[] | undefined)
    : undefined) ?? []

  const saveProfile = useCallback(async (profile: BirthProfile) => {
    if (!user) return
    const current = (user.unsafeMetadata?.birthProfiles as BirthProfile[] | undefined) ?? []
    const updated = current.some(p => p.id === profile.id)
      ? current.map(p => p.id === profile.id ? profile : p)
      : [...current, profile]
    await user.update({ unsafeMetadata: { ...user.unsafeMetadata, birthProfiles: updated } })
  }, [user])

  const deleteProfile = useCallback(async (id: string) => {
    if (!user) return
    const current = (user.unsafeMetadata?.birthProfiles as BirthProfile[] | undefined) ?? []
    await user.update({
      unsafeMetadata: { ...user.unsafeMetadata, birthProfiles: current.filter(p => p.id !== id) },
    })
  }, [user])

  return { profiles, saveProfile, deleteProfile, isSignedIn: !!isSignedIn }
}

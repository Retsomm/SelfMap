import {
  getBirthProfiles,
  createBirthProfile,
  importBirthProfiles,
  updateBirthProfile,
  deleteBirthProfile,
  type RemoteBirthProfile,
  type BirthProfilePayload,
} from './api'

// 對外公開的格式（與網頁端統一）
export type BirthProfile = {
  id: string
  label: string
  date: string       // "YYYY-MM-DD"
  time: string       // "HH:mm"
  timezone: string
  location: string
}

function toProfile(r: RemoteBirthProfile): BirthProfile {
  return { id: r.id, label: r.label, date: r.date, time: r.time, timezone: r.timezone, location: r.location }
}

export async function loadProfiles(token: string): Promise<BirthProfile[]> {
  const { profiles } = await getBirthProfiles(token)
  return profiles.map(toProfile)
}

export async function saveProfile(token: string, profile: BirthProfile, allProfiles: BirthProfile[]): Promise<BirthProfile[]> {
  const exists = allProfiles.some(p => p.id === profile.id)
  if (exists) {
    await updateBirthProfile(token, profile.id, {
      label: profile.label,
      date: profile.date,
      time: profile.time,
      timezone: profile.timezone,
      location: profile.location,
    })
    return allProfiles.map(p => p.id === profile.id ? profile : p)
  } else {
    const payload: BirthProfilePayload = {
      label: profile.label,
      date: profile.date,
      time: profile.time,
      timezone: profile.timezone,
      location: profile.location,
      sortOrder: allProfiles.length,
    }
    const { profile: created } = await createBirthProfile(token, payload)
    return [...allProfiles, toProfile(created)]
  }
}

export async function deleteProfile(token: string, id: string, allProfiles: BirthProfile[]): Promise<BirthProfile[]> {
  await deleteBirthProfile(token, id)
  return allProfiles.filter(p => p.id !== id)
}

export async function importProfiles(token: string, payloads: BirthProfilePayload[]): Promise<BirthProfile[]> {
  const { profiles } = await importBirthProfiles(token, payloads)
  return profiles.map(toProfile)
}

export function makeProfileId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function profileSummary(p: BirthProfile): string {
  return `${p.date}  ${p.time}  ${p.location}`
}

// 舊格式轉新格式（AsyncStorage 遷移用）
export type LegacyBirthProfile = {
  id: string
  label: string
  date: { year: number; month: number; day: number }
  time: { hour: number; minute: number }
  city: string
  timezone: string
}

export function legacyToProfile(old: LegacyBirthProfile): Omit<BirthProfile, 'id'> & { id: string } {
  const { year, month, day } = old.date
  const { hour, minute } = old.time
  return {
    id: old.id,
    label: old.label,
    date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    timezone: old.timezone,
    location: old.city,
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@selfmap/birth_profiles'

export type BirthProfile = {
  id: string
  label: string
  date: { year: number; month: number; day: number }
  time: { hour: number; minute: number }
  city: string
  timezone: string
}

export async function loadProfiles(): Promise<BirthProfile[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as BirthProfile[]
  } catch {
    return []
  }
}

export async function saveProfile(profile: BirthProfile): Promise<BirthProfile[]> {
  const list = await loadProfiles()
  const idx = list.findIndex(p => p.id === profile.id)
  if (idx >= 0) {
    list[idx] = profile
  } else {
    list.push(profile)
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return list
}

export async function deleteProfile(id: string): Promise<BirthProfile[]> {
  const list = await loadProfiles()
  const next = list.filter(p => p.id !== id)
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function makeProfileId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function profileSummary(p: BirthProfile): string {
  const d = p.date
  return `${d.year}/${String(d.month).padStart(2, '0')}/${String(d.day).padStart(2, '0')}  ${String(p.time.hour).padStart(2, '0')}:${String(p.time.minute).padStart(2, '0')}  ${p.city}`
}

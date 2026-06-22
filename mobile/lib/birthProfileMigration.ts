import AsyncStorage from '@react-native-async-storage/async-storage'
import { legacyToProfile, type LegacyBirthProfile } from './birthProfiles'
import { getBirthProfiles, importBirthProfiles } from './api'

const LEGACY_KEY = '@selfmap/birth_profiles'
const MIGRATION_DONE_KEY = '@selfmap/birth_profiles_migrated'

function isLegacyProfile(obj: unknown): obj is LegacyBirthProfile {
  if (!obj || typeof obj !== 'object') return false
  const p = obj as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.label === 'string' &&
    typeof p.city === 'string' &&
    typeof p.timezone === 'string' &&
    p.date !== null && typeof p.date === 'object' &&
    p.time !== null && typeof p.time === 'object'
  )
}

// 啟動時執行一次性遷移：AsyncStorage 舊資料 → DB
// 若 DB 已有資料則跳過，確保不覆蓋網頁端已存的資料
export async function migrateLocalProfilesToDb(token: string): Promise<void> {
  try {
    const done = await AsyncStorage.getItem(MIGRATION_DONE_KEY)
    if (done === 'true') return

    const raw = await AsyncStorage.getItem(LEGACY_KEY)
    if (!raw) {
      await AsyncStorage.setItem(MIGRATION_DONE_KEY, 'true')
      return
    }

    let legacy: unknown[]
    try {
      const parsed: unknown = JSON.parse(raw)
      legacy = Array.isArray(parsed) ? parsed : []
    } catch {
      legacy = []
    }

    const oldProfiles = legacy.filter(isLegacyProfile)
    if (oldProfiles.length === 0) {
      await AsyncStorage.setItem(MIGRATION_DONE_KEY, 'true')
      return
    }

    // DB 若已有資料（來自網頁端），跳過匯入，以 DB 為準
    const { profiles: existing } = await getBirthProfiles(token)
    if (existing.length === 0) {
      const payloads = oldProfiles.map((p, i) => ({
        ...legacyToProfile(p),
        sortOrder: i,
      }))
      await importBirthProfiles(token, payloads)
    }

    // 不論有沒有匯入，都標記完成並清除舊 AsyncStorage
    await AsyncStorage.setItem(MIGRATION_DONE_KEY, 'true')
    await AsyncStorage.removeItem(LEGACY_KEY)
  } catch (err) {
    // 遷移失敗不 crash，下次啟動再試
    console.warn('[birthProfileMigration]', err)
  }
}

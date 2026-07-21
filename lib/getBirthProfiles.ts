import { after } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveDbUser } from '@/lib/dbUser'
import type { BirthProfile } from './useBirthProfiles'

type SerializedProfile = BirthProfile & { sortOrder: number; createdAt: string; updatedAt: string }

/**
 * 取得某使用者的出生資料清單（去重複＋序列化成純值），供 API route handler
 * 與 Server Component 的 prefetch 共用，避免 Server Component 端還要多繞一次
 * HTTP self-fetch 才能拿到同一份資料。
 */
export async function getBirthProfilesForUser(userId: string): Promise<SerializedProfile[]> {
  const user = await resolveDbUser(userId)
  if (!user) return []

  const profiles = await prisma.birthProfile.findMany({
    where: { userId: user.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  // Deduplicate by (label, date, time, location) — keeps earliest record
  const seen = new Set<string>()
  const duplicateIds: string[] = []
  const uniqueProfiles = profiles.filter(p => {
    const key = `${p.label}|${p.date}|${p.time}|${p.location}`
    if (seen.has(key)) { duplicateIds.push(p.id); return false }
    seen.add(key)
    return true
  })

  if (duplicateIds.length > 0) {
    console.log(`[getBirthProfilesForUser] removing ${duplicateIds.length} duplicate(s)`)
    after(async () => {
      await prisma.birthProfile.deleteMany({ where: { id: { in: duplicateIds } } })
        .catch(e => console.error('[getBirthProfilesForUser] dedup cleanup error:', e))
    })
  }

  return uniqueProfiles.map(p => ({
    id: p.id,
    label: p.label,
    date: p.date,
    time: p.time,
    timezone: p.timezone,
    location: p.location,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))
}

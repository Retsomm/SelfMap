import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import type { User } from '@prisma/client'

/**
 * 解析目前登入者對應的 DB User：優先用 clerkId，找不到時退而用 email 配對，
 * 並把 clerkId 補接回去。避免同一封 email 換了 Clerk userId（例如 Clerk 環境
 * 重建、或帳號遷移）後，舊資料在只認 clerkId 的查詢下憑空消失。
 */
export async function resolveDbUser(userId: string): Promise<User | null> {
  const existing = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (existing) return existing

  const clerkUser = await currentUser()
  const primaryAddr = clerkUser?.emailAddresses.find(
    e => e.id === clerkUser.primaryEmailAddressId && e.verification?.status === 'verified'
  )
  const email = primaryAddr?.emailAddress
  if (!email) return null

  const byEmail = await prisma.user.findUnique({ where: { email } })
  if (!byEmail) return null

  return prisma.user.update({ where: { email }, data: { clerkId: userId } })
}

/** 取得或建立目前登入者對應的 DB User（寫入類端點用，確保一定有一筆 User）。 */
export async function getOrCreateDbUser(userId: string): Promise<User> {
  const clerkUser = await currentUser()
  const existing = await resolveDbUser(userId)

  const primaryAddr = clerkUser?.emailAddresses.find(
    e => e.id === clerkUser.primaryEmailAddressId && e.verification?.status === 'verified'
  )
  const email = primaryAddr?.emailAddress ?? `clerk_${userId}@placeholder.local`
  const updateData: { email?: string; name?: string | null } = {}
  if (!email.endsWith('@placeholder.local')) updateData.email = email
  if (clerkUser?.fullName != null) updateData.name = clerkUser.fullName

  if (existing) {
    if (Object.keys(updateData).length > 0) {
      return prisma.user.update({ where: { clerkId: userId }, data: updateData })
    }
    return existing
  }

  return prisma.user.create({ data: { clerkId: userId, email, name: clerkUser?.fullName ?? null } })
}

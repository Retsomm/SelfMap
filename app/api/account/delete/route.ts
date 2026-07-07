import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 刪除帳號：Prisma User 連帶 Cascade 刪除 BirthProfile/Chart，再刪除 Clerk 帳號本身
export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.user.deleteMany({ where: { clerkId: userId } })

    const clerk = await clerkClient()
    await clerk.users.deleteUser(userId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/account/delete]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

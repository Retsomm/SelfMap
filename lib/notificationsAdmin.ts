import { auth, currentUser } from '@clerk/nextjs/server'

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

// 回傳目前登入者的 email（未登入則為 null），供 GET 端點附帶 isAdmin 旗標使用
export async function getCurrentUserEmail(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  return user?.primaryEmailAddress?.emailAddress ?? null
}

export function isAdminEmail(email: string | null): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

// 供 POST / DELETE 使用：未登入或非管理員回傳 null
export async function requireAdmin(): Promise<string | null> {
  const email = await getCurrentUserEmail()
  return isAdminEmail(email) ? email : null
}

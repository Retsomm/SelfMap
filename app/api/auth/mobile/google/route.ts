import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

async function verifyGoogleIdToken(idToken: string) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
  if (!res.ok) throw new Error('Google token 驗證失敗')
  const payload = await res.json()
  if (!payload.email_verified) throw new Error('Google email 未驗證')
  return payload as {
    sub: string
    email: string
    email_verified: boolean
    given_name?: string
    family_name?: string
    picture?: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) return NextResponse.json({ error: '缺少 idToken' }, { status: 400 })

    const payload = await verifyGoogleIdToken(idToken)

    const clerk = await clerkClient()

    // 查找既有用戶
    const { data: users } = await clerk.users.getUserList({
      emailAddress: [payload.email],
    })

    let userId: string
    if (users.length > 0) {
      userId = users[0].id
    } else {
      // 建立新用戶
      const newUser = await clerk.users.createUser({
        emailAddress: [payload.email],
        firstName: payload.given_name ?? '',
        lastName: payload.family_name ?? '',
        skipPasswordRequirement: true,
      })
      userId = newUser.id
    }

    // 產生短效 sign-in token（5 分鐘內有效）
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 300,
    })

    return NextResponse.json({ token: signInToken.token })
  } catch (err) {
    console.error('[mobile/google]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '驗證失敗' },
      { status: 401 }
    )
  }
}

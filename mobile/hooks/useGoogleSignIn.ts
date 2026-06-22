import { useSignIn } from '@clerk/expo'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { Alert } from 'react-native'

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL

export function useGoogleSignIn(onSuccess?: () => void) {
  const { signIn, setActive, isLoaded } = useSignIn()

  async function handleGoogleSignIn() {
    if (!isLoaded) return
    try {
      GoogleSignin.configure({ webClientId: WEB_CLIENT_ID })
      await GoogleSignin.hasPlayServices()
      const { data } = await GoogleSignin.signIn()
      const idToken = data?.idToken
      if (!idToken) throw new Error('無法取得 Google ID Token')

      const res = await fetch(`${API_BASE}/api/auth/mobile/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? '後端驗證失敗')
      }
      const { token } = await res.json()

      const result = await signIn!.create({ strategy: 'ticket', ticket: token })
      await setActive!({ session: result.createdSessionId })
      onSuccess?.()
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === statusCodes.SIGN_IN_CANCELLED) return
      console.error('[GoogleSignIn]', err)
      Alert.alert('登入失敗', err instanceof Error ? err.message : '請稍後再試')
    }
  }

  return { handleGoogleSignIn }
}

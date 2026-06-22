import { useSignIn } from '@clerk/expo'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Radius, Spacing } from '@/constants/tokens'

const WEB_CLIENT_ID = '679544930449-vo4mgolhcfm8qp1v374phl611p6nv597.apps.googleusercontent.com'
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const isLoading = useRef(false)

  useEffect(() => {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID })
  }, [])

  async function handleGoogleSignIn() {
    if (isLoading.current || !isLoaded) return
    isLoading.current = true
    try {
      // 1. 取得 Google ID Token
      await GoogleSignin.hasPlayServices()
      const { data } = await GoogleSignin.signIn()
      const idToken = data?.idToken
      if (!idToken) throw new Error('無法取得 Google ID Token')

      // 2. 後端驗證 → 換成 Clerk sign-in token
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

      // 3. 用 ticket 策略登入（不需要 redirect URL）
      const result = await signIn!.create({ strategy: 'ticket', ticket: token })
      await setActive!({ session: result.createdSessionId })
      router.replace('/(tabs)')
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return
      console.error('[SignIn]', err)
      Alert.alert('登入失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      isLoading.current = false
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>SelfMap</Text>
        <Text style={styles.subtitle}>人類圖自我探索</Text>
        <Pressable style={styles.button} onPress={handleGoogleSignIn}>
          <Text style={styles.buttonText}>使用 Google 登入</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  inner:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, padding: Spacing.xl },
  title:      { fontSize: 36, fontWeight: '700', color: Colors.text },
  subtitle:   { fontSize: 16, color: Colors.sub, marginBottom: 32 },
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: Radius.md,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
})

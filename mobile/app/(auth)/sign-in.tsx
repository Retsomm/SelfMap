import { useOAuth } from '@clerk/expo'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useRef } from 'react'
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { Colors, Radius, Spacing } from '@/constants/tokens'

export default function SignInScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })
  const router = useRouter()
  const isLoading = useRef(false)

  async function handleGoogleSignIn() {
    if (isLoading.current) return
    isLoading.current = true
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'selfmap' }),
      })
      if (createdSessionId) {
        await setActive?.({ session: createdSessionId })
        router.replace('/(tabs)')
      }
    } catch (err) {
      console.error('OAuth error', err)
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

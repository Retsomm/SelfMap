import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn'
import { useLineSignIn } from '@/hooks/useLineSignIn'

export default function SignInScreen() {
  console.log('[SignIn] 元件載入，版本含 LINE 按鈕')
  const router = useRouter()
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingLine, setLoadingLine] = useState(false)
  const { handleGoogleSignIn } = useGoogleSignIn(() => router.replace('/(tabs)'))
  const { handleLineSignIn } = useLineSignIn(() => router.replace('/(tabs)'))

  async function onGooglePress() {
    if (loadingGoogle || loadingLine) return
    setLoadingGoogle(true)
    try {
      await handleGoogleSignIn()
    } catch {
      Alert.alert('登入失敗', '請稍後再試')
    } finally {
      setLoadingGoogle(false)
    }
  }

  async function onLinePress() {
    if (loadingGoogle || loadingLine) return
    setLoadingLine(true)
    try {
      await handleLineSignIn()
    } catch {
      Alert.alert('登入失敗', '請稍後再試')
    } finally {
      setLoadingLine(false)
    }
  }

  const isLoading = loadingGoogle || loadingLine

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>SelfMap</Text>
        <Text style={styles.subtitle}>人類圖自我探索</Text>

        <Pressable
          style={[styles.button, styles.googleButton, isLoading && styles.buttonDisabled]}
          onPress={onGooglePress}
          disabled={isLoading}
        >
          {loadingGoogle
            ? <ActivityIndicator color={Colors.surface} />
            : <Text style={styles.googleButtonText}>使用 Google 登入</Text>
          }
        </Pressable>

        <Pressable
          style={[styles.button, styles.lineButton, isLoading && styles.buttonDisabled]}
          onPress={onLinePress}
          disabled={isLoading}
        >
          {loadingLine
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.lineButtonText}>使用 LINE 登入</Text>
          }
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.bg },
  inner:            { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, padding: Spacing.xl },
  title:            { fontSize: 36, fontWeight: '700', color: Colors.text },
  subtitle:         { fontSize: 16, color: Colors.sub, marginBottom: 32 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: Radius.md,
    width: '100%',
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled:   { opacity: 0.6 },
  googleButton:     { backgroundColor: Colors.accent },
  googleButtonText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
  lineButton:       { backgroundColor: '#06C755' },
  lineButtonText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
})

import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn'

export default function SignInScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { handleGoogleSignIn } = useGoogleSignIn(() => router.replace('/(tabs)'))

  async function onPress() {
    if (loading) return
    setLoading(true)
    try {
      await handleGoogleSignIn()
    } catch {
      Alert.alert('登入失敗', '請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>SelfMap</Text>
        <Text style={styles.subtitle}>人類圖自我探索</Text>
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onPress} disabled={loading}>
          {loading
            ? <ActivityIndicator color={Colors.surface} />
            : <Text style={styles.buttonText}>使用 Google 登入</Text>
          }
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.bg },
  inner:          { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, padding: Spacing.xl },
  title:          { fontSize: 36, fontWeight: '700', color: Colors.text },
  subtitle:       { fontSize: 16, color: Colors.sub, marginBottom: 32 },
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: Radius.md,
    width: '100%',
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: Colors.surface, fontSize: 16, fontWeight: '600' },
})

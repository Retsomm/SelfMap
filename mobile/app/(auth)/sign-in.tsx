import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn'

export default function SignInScreen() {
  const router = useRouter()
  const { handleGoogleSignIn } = useGoogleSignIn(() => router.replace('/(tabs)'))

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

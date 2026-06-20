import { useAuth, useUser } from '@clerk/expo'
import { useState } from 'react'
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'

export default function ProfileScreen() {
  const { signOut } = useAuth()
  const { user } = useUser()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      Alert.alert('登出失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.heading}>帳號</Text>
        <View style={styles.card}>
          <Text style={styles.name}>{user?.fullName ?? user?.username ?? '使用者'}</Text>
          <Text style={styles.email}>{user?.emailAddresses[0]?.emailAddress}</Text>
        </View>
        <Pressable style={[styles.signOutBtn, signingOut && styles.btnDisabled]} onPress={handleSignOut} disabled={signingOut}>
          <Text style={styles.signOutText}>{signingOut ? '登出中…' : '登出'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  inner: { flex: 1, padding: 24, gap: 16 },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff' },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 20,
    gap: 6,
  },
  name: { fontSize: 18, fontWeight: '600', color: '#fff' },
  email: { fontSize: 14, color: '#8888aa' },
  signOutBtn: {
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  signOutText: { color: '#ff6b6b', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
})

import { useAuth, useUser } from '@clerk/clerk-expo'
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'

export default function ProfileScreen() {
  const { signOut } = useAuth()
  const { user } = useUser()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.heading}>帳號</Text>
        <View style={styles.card}>
          <Text style={styles.name}>{user?.fullName ?? user?.username ?? '使用者'}</Text>
          <Text style={styles.email}>{user?.emailAddresses[0]?.emailAddress}</Text>
        </View>
        <Pressable style={styles.signOutBtn} onPress={() => signOut()}>
          <Text style={styles.signOutText}>登出</Text>
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
})

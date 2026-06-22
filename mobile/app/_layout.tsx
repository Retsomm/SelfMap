import { ClerkProvider, useAuth } from '@clerk/expo'
import * as SecureStore from 'expo-secure-store'
import * as WebBrowser from 'expo-web-browser'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect, useRef } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Colors } from '@/constants/tokens'
import { migrateLocalProfilesToDb } from '@/lib/birthProfileMigration'

WebBrowser.maybeCompleteAuthSession()

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key)
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value)
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key)
  },
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
if (!publishableKey) {
  throw new Error('Missing required environment variable: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY')
}

// 不需登入即可存取的路由
function isPublicRoute(segments: string[]): boolean {
  if (segments[0] === '(auth)') return true
  if (segments[0] === '(tabs)' && (segments[1] === 'create' || segments[1] === 'index' || !segments[1])) return true
  if (segments[0] === 'chart' && segments[1] === 'preview') return true
  return false
}

function AuthGuard() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const migrationRanRef = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn && !isPublicRoute(segments)) {
      router.replace('/(auth)/sign-in')
    } else if (isSignedIn && segments[0] === '(auth)') {
      router.replace('/(tabs)')
    }
  }, [isLoaded, isSignedIn, segments])

  const getTokenRef = useRef(getToken)
  useEffect(() => { getTokenRef.current = getToken }, [getToken])

  // 登入後執行一次性遷移
  useEffect(() => {
    if (!isSignedIn || migrationRanRef.current) return
    migrationRanRef.current = true
    getTokenRef.current().then(token => {
      if (token) migrateLocalProfilesToDb(token)
    }).catch(err => console.warn('[AuthGuard] migration token error:', err))
  }, [isSignedIn])

  return null
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ErrorBoundary>
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chart/preview" options={{ headerShown: true, title: '圖表預覽', headerBackButtonDisplayMode: 'minimal', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.text, headerTitleStyle: { color: Colors.text } }} />
          <Stack.Screen name="chart/[id]" options={{ headerShown: true, title: '圖表詳情', headerBackButtonDisplayMode: 'minimal', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.text, headerTitleStyle: { color: Colors.text } }} />
        </Stack>
      </ErrorBoundary>
    </ClerkProvider>
  )
}

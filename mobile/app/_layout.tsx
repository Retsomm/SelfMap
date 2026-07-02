import { ClerkProvider, useAuth } from '@clerk/expo'
import * as WebBrowser from 'expo-web-browser'
import * as SecureStore from 'expo-secure-store'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect, useRef } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'
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

// 需要強制跳轉登入的路由（目前無，帳號頁在 component 內部處理未登入狀態）
function isProtectedRoute(_segments: string[]): boolean {
  return false
}

function AuthGuard() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const migrationRanRef = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn && isProtectedRoute(segments)) {
      router.replace('/(auth)/sign-in')
    } else if (isSignedIn && (segments[0] === '(auth)' || segments[0] === 'oauth-native-callback')) {
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
    <SafeAreaProvider>
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ErrorBoundary>
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chart/preview" options={{ headerShown: false }} />
          <Stack.Screen name="chart/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="learn/[topic]" options={{ headerShown: false }} />
          <Stack.Screen name="oauth-native-callback" options={{ headerShown: false }} />
        </Stack>
      </ErrorBoundary>
    </ClerkProvider>
    </SafeAreaProvider>
  )
}

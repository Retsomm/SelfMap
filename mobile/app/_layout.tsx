import { ClerkProvider, useAuth } from '@clerk/expo'
import * as SecureStore from 'expo-secure-store'
import * as WebBrowser from 'expo-web-browser'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Colors } from '@/constants/tokens'

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

function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in')
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isLoaded, isSignedIn, segments])

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
          <Stack.Screen name="chart/[id]" options={{ headerShown: true, title: '圖表詳情', headerBackButtonDisplayMode: 'minimal', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.text, headerTitleStyle: { color: Colors.text } }} />
        </Stack>
      </ErrorBoundary>
    </ClerkProvider>
  )
}

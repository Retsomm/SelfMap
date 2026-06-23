import { useSSO } from '@clerk/expo'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { useEffect } from 'react'

WebBrowser.maybeCompleteAuthSession()

export function useGoogleSignIn(onSuccess?: () => void) {
  const { startSSOFlow } = useSSO()

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => { void WebBrowser.coolDownAsync() }
  }, [])

  async function handleGoogleSignIn() {
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ path: 'oauth-native-callback' })
      console.log('[GoogleSignIn] redirectUrl:', redirectUrl)
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      })
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        onSuccess?.()
      } else {
        throw new Error('Google 登入未完成，請重試')
      }
    } catch (err) {
      console.error('[GoogleSignIn]', err)
      throw err
    }
  }

  return { handleGoogleSignIn }
}

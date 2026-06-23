import { useSSO } from '@clerk/expo'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { useEffect } from 'react'

WebBrowser.maybeCompleteAuthSession()

export function useLineSignIn(onSuccess?: () => void) {
  const { startSSOFlow } = useSSO()

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => { void WebBrowser.coolDownAsync() }
  }, [])

  async function handleLineSignIn() {
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ path: 'oauth-native-callback' })
      console.log('[LineSignIn] redirectUrl:', redirectUrl)
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_line',
        redirectUrl,
      })
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        onSuccess?.()
      }
      // createdSessionId 為 null 代表使用者取消，不視為錯誤
    } catch (err) {
      console.error('[LineSignIn]', err)
      throw err
    }
  }

  return { handleLineSignIn }
}

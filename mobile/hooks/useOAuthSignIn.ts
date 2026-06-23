import { useSSO } from '@clerk/expo'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { useEffect } from 'react'

WebBrowser.maybeCompleteAuthSession()

type SSOStrategy = Exclude<Parameters<ReturnType<typeof useSSO>['startSSOFlow']>[0]['strategy'], 'enterprise_sso'>

export function useOAuthSignIn(strategy: SSOStrategy, label: string, onSuccess?: () => void) {
  const { startSSOFlow } = useSSO()

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => { void WebBrowser.coolDownAsync() }
  }, [])

  async function handleSignIn() {
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ path: 'oauth-native-callback' })
      const { createdSessionId, setActive } = await startSSOFlow({ strategy, redirectUrl })
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        onSuccess?.()
      }
      // createdSessionId 為 null 代表使用者取消，不視為錯誤
    } catch (err) {
      console.error(`[${label}]`, err)
      throw err
    }
  }

  return { handleSignIn }
}

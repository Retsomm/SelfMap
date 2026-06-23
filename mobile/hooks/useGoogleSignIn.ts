import { useSSO } from '@clerk/expo'
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
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: 'oauth_google' })
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        onSuccess?.()
      }
    } catch (err) {
      console.error('[GoogleSignIn]', err)
      throw err
    }
  }

  return { handleGoogleSignIn }
}

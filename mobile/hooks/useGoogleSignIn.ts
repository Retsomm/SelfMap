import { useOAuthSignIn } from './useOAuthSignIn'

export function useGoogleSignIn(onSuccess?: () => void) {
  const { handleSignIn } = useOAuthSignIn('oauth_google', 'GoogleSignIn', onSuccess)
  return { handleGoogleSignIn: handleSignIn }
}

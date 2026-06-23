import { useOAuthSignIn } from './useOAuthSignIn'

export function useLineSignIn(onSuccess?: () => void) {
  const { handleSignIn } = useOAuthSignIn('oauth_line', 'LineSignIn', onSuccess)
  return { handleLineSignIn: handleSignIn }
}

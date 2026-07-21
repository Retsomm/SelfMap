import { auth } from '@clerk/nextjs/server'
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getBirthProfilesForUser } from '@/lib/getBirthProfiles'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const { userId } = await auth()
  const queryClient = new QueryClient()

  if (userId) {
    await queryClient.prefetchQuery({
      queryKey: ['birthProfiles', userId],
      queryFn: async () => ({ profiles: await getBirthProfilesForUser(userId) }),
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AccountClient />
    </HydrationBoundary>
  )
}

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      charts: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const charts = user?.charts ?? []

  return <DashboardClient charts={charts} />
}

import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import MapClient from './MapClient'

interface Props {
  params: Promise<{ chartId: string }>
}

export default async function MapPage({ params }: Props) {
  const { chartId } = await params
  const { userId } = await auth()

  const chart = await prisma.chart.findUnique({
    where: { id: chartId },
    include: { user: true },
  })

  if (!chart) notFound()

  if (chart.user.clerkId !== userId) notFound()

  return <MapClient chart={chart} />
}

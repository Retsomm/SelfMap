'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import SelfMap from '@/components/SelfMap'
import CenterDrawer from '@/components/CenterDrawer'
import type { HumanDesignChart, Center } from '@/lib/humanDesign'

interface ChartRecord {
  id: string
  name: string | null
  birthDate: string
  birthTime: string
  birthCity: string
  type: string
  authority: string
  profile: string
  definition: string
  centers: unknown
  channels: unknown
  gates: unknown
}

export default function MapClient({ chart }: { chart: ChartRecord }) {
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null)

  const hdChart: HumanDesignChart = {
    type: chart.type as HumanDesignChart['type'],
    authority: chart.authority as HumanDesignChart['authority'],
    profile: chart.profile,
    definition: chart.definition,
    centers: chart.centers as HumanDesignChart['centers'],
    channels: chart.channels as HumanDesignChart['channels'],
    gates: chart.gates as HumanDesignChart['gates'],
  }

  const definedCount = hdChart.centers.filter((c) => c.defined).length

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="fixed top-0 inset-x-0 z-30 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            SelfMap
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-[12px] md:text-base text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              我的圖表
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row pt-16">
        <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-zinc-100 p-6 lg:pt-10 lg:overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 mb-1">
              {chart.name || '我的地圖'}
            </h1>
            <p className="text-[12px] md:text-base text-zinc-400">
              {chart.birthDate} · {chart.birthTime} · {chart.birthCity}
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: '類型', value: chart.type },
              { label: '內在權威', value: chart.authority },
              { label: '輪廓', value: chart.profile },
              { label: '定義', value: chart.definition },
              {
                label: '定義中心',
                value: `${definedCount} / 9`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2.5 border-b border-zinc-50"
              >
                <span className="text-[12px] md:text-base text-zinc-400">{label}</span>
                <span className="text-[12px] md:text-base font-medium text-zinc-800">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-indigo-50 rounded-2xl p-4">
            <p className="text-[12px] md:text-base text-indigo-600 font-medium mb-1">探索提示</p>
            <p className="text-[12px] md:text-base text-indigo-700 leading-relaxed">
              點擊地圖上任意中心，即可查看該中心對你行為模式的深度解讀
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center p-6 lg:p-10">
          <div className="w-full max-w-sm">
            <SelfMap chart={hdChart} onCenterClick={setSelectedCenter} />
          </div>
        </div>
      </main>

      <CenterDrawer
        center={selectedCenter}
        onClose={() => setSelectedCenter(null)}
      />
    </div>
  )
}

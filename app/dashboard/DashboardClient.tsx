'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

interface Chart {
  id: string
  name: string | null
  birthCity: string
  birthDate: string
  type: string
  authority: string
  profile: string
  createdAt: Date
}

export default function DashboardClient({ charts }: { charts: Chart[] }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            SelfMap
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/create"
              className="text-[12px] md:text-base bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-700 transition-colors"
            >
              + 新圖表
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">我的圖表</h1>
          <p className="text-zinc-500 text-[12px] md:text-base">{charts.length} 份地圖</p>
        </div>

        {charts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-zinc-400 mb-6">還沒有任何圖表</p>
            <Link
              href="/create"
              className="bg-zinc-900 text-white text-[12px] md:text-base font-medium px-8 py-3.5 rounded-full hover:bg-zinc-700 transition-colors"
            >
              建立第一份地圖
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {charts.map((chart) => (
              <Link
                key={chart.id}
                href={`/map/${chart.id}`}
                className="bg-white rounded-2xl p-5 border border-zinc-100 hover:border-indigo-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                      {chart.name || '未命名地圖'}
                    </h3>
                    <p className="text-[12px] md:text-base text-zinc-400 mt-0.5">
                      {chart.birthCity} · {chart.birthDate}
                    </p>
                  </div>
                  <span className="text-[12px] md:text-base bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                    {chart.type}
                  </span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="text-[12px] md:text-base text-zinc-500">
                    <span className="text-zinc-400">內在權威：</span>
                    {chart.authority}
                  </div>
                  <div className="text-[12px] md:text-base text-zinc-500">
                    <span className="text-zinc-400">輪廓：</span>
                    {chart.profile}
                  </div>
                </div>
                <div className="mt-4 text-[12px] md:text-base text-zinc-300">
                  {new Date(chart.createdAt).toLocaleDateString('zh-TW')}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

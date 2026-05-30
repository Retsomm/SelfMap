'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import toast from 'react-hot-toast'

export default function CreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ birthDate: '', birthTime: '', birthCity: '', name: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.birthDate || !form.birthTime || !form.birthCity) {
      toast.error('請填寫所有必填欄位')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error || '建立失敗')
      const { chartId } = await res.json()
      router.push(`/map/${chartId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '建立失敗，請稍後再試')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            SelfMap
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[12px] md:text-base text-zinc-500 hover:text-zinc-900 transition-colors">
              我的圖表
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-lg mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">建立你的地圖</h1>
            <p className="text-zinc-500 text-[12px] md:text-base">輸入出生資料，生成專屬的 Human Design 內在地圖</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[12px] md:text-base font-medium text-zinc-700">圖表名稱（選填）</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：我的主圖、25歲版本…"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[12px] md:text-base text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] md:text-base font-medium text-zinc-700">
                出生日期 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-base text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] md:text-base font-medium text-zinc-700">
                出生時間 <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={form.birthTime}
                onChange={(e) => setForm({ ...form, birthTime: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-base text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <p className="text-[12px] md:text-base text-zinc-500">不確定出生時間？可先輸入 12:00，之後再更新</p>
            </div>
            <div className="space-y-2">
              <label className="text-[12px] md:text-base font-medium text-zinc-700">
                出生城市 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.birthCity}
                onChange={(e) => setForm({ ...form, birthCity: e.target.value })}
                placeholder="例：台北、東京、New York…"
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-[12px] md:text-base text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white text-[12px] md:text-base font-medium py-3.5 rounded-full hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '生成中…' : '開始探索'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

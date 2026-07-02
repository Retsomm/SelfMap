'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import toast from 'react-hot-toast'
import LocationPicker from '@/components/humanDesign/LocationPicker'

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const selectClass =
  'flex-1 px-3 py-3 rounded-xl border border-zinc-200 text-base font-medium text-white [-webkit-text-fill-color:white] bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none'

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export default function CreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ birthCity: '', name: '', timezone: '' })
  const [dateFields, setDateFields] = useState({ year: '', month: '', day: '' })
  const [timeFields, setTimeFields] = useState({ hour: '', minute: '' })

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  const dayCount = useMemo(() => {
    if (!dateFields.year || !dateFields.month) return 31
    return daysInMonth(Number(dateFields.year), Number(dateFields.month))
  }, [dateFields.year, dateFields.month])

  const days = Array.from({ length: dayCount }, (_, i) => i + 1)

  const birthDate =
    dateFields.year && dateFields.month && dateFields.day
      ? `${dateFields.year}-${String(dateFields.month).padStart(2, '0')}-${String(dateFields.day).padStart(2, '0')}`
      : ''

  const birthTime =
    timeFields.hour !== '' && timeFields.minute !== ''
      ? `${String(timeFields.hour).padStart(2, '0')}:${String(timeFields.minute).padStart(2, '0')}`
      : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!birthDate || !birthTime || !form.birthCity || !form.timezone) {
      toast.error('請填寫所有必填欄位，並從下拉選單選擇出生城市')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, birthDate, birthTime }),
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
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-base text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] md:text-base font-medium text-zinc-700">
                出生日期 <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={dateFields.year}
                  onChange={(e) => setDateFields({ ...dateFields, year: e.target.value, day: '' })}
                  className={selectClass}
                >
                  <option value="">年</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={dateFields.month}
                  onChange={(e) => setDateFields({ ...dateFields, month: e.target.value, day: '' })}
                  className={selectClass}
                >
                  <option value="">月</option>
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={dateFields.day}
                  onChange={(e) => setDateFields({ ...dateFields, day: e.target.value })}
                  className={selectClass}
                >
                  <option value="">日</option>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}日</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] md:text-base font-medium text-zinc-700">
                出生時間 <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={timeFields.hour}
                  onChange={(e) => setTimeFields({ ...timeFields, hour: e.target.value })}
                  className={selectClass}
                >
                  <option value="">時</option>
                  {hours.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}時</option>
                  ))}
                </select>
                <select
                  value={timeFields.minute}
                  onChange={(e) => setTimeFields({ ...timeFields, minute: e.target.value })}
                  className={selectClass}
                >
                  <option value="">分</option>
                  {minutes.map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}分</option>
                  ))}
                </select>
              </div>
              <p className="text-[12px] md:text-base text-zinc-500">不確定出生時間？可先選 12:00，之後再更新</p>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] md:text-base font-medium text-zinc-700">
                出生城市 <span className="text-red-400">*</span>
              </label>
              <LocationPicker
                value={form.birthCity}
                onSelect={(tz, label) => setForm(prev => ({ ...prev, birthCity: label, timezone: tz }))}
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

'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

type Tab = 'birth' | 'upload'

export default function CreatePage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('birth')

  // 出生資料表單
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ birthDate: '', birthTime: '', birthCity: '', name: '' })

  // 圖片上傳
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [confidence, setConfidence] = useState<string | null>(null)

  // ── 出生資料提交 ──────────────────────────────────────────────────────────
  const handleBirthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.birthDate || !form.birthTime || !form.birthCity) {
      setError('請填寫所有必填欄位')
      return
    }
    setLoading(true)
    setError('')
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
      setError(err instanceof Error ? err.message : '建立失敗，請稍後再試')
      setLoading(false)
    }
  }

  // ── 圖片選取 ──────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('請上傳圖片檔案')
      return
    }
    setImageFile(file)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // ── 圖片分析提交 ──────────────────────────────────────────────────────────
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) { setError('請先選取人類圖圖片'); return }
    setLoading(true)
    setError('')
    setConfidence(null)

    try {
      const fd = new FormData()
      fd.append('image', imageFile)
      fd.append('name', uploadName)

      const res = await fetch('/api/charts/analyze', { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error || '分析失敗')

      const { chartId, confidence: conf, notes } = await res.json()
      setConfidence(conf)

      if (conf === 'low' && notes) {
        setError(`分析完成但信心度較低：${notes}`)
        setLoading(false)
        // 仍然跳轉
        setTimeout(() => router.push(`/map/${chartId}`), 2000)
      } else {
        router.push(`/map/${chartId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失敗，請稍後再試')
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
            <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
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
            <p className="text-zinc-500 text-sm">選擇輸入方式，生成專屬的 Human Design 內在地圖</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-zinc-100 rounded-xl p-1 mb-8">
            {([['birth', '輸入出生資料'], ['upload', '上傳人類圖']] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === key
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── 出生資料 ── */}
          {tab === 'birth' && (
            <form onSubmit={handleBirthSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">圖表名稱（選填）</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：我的主圖、25歲版本…"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  出生日期 <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  出生時間 <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={form.birthTime}
                  onChange={(e) => setForm({ ...form, birthTime: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <p className="text-xs text-zinc-500">不確定出生時間？可先輸入 12:00，之後再更新</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  出生城市 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.birthCity}
                  onChange={(e) => setForm({ ...form, birthCity: e.target.value })}
                  placeholder="例：台北、東京、New York…"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-white text-sm font-medium py-3.5 rounded-full hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '生成中…' : '開始探索'}
              </button>
            </form>
          )}

          {/* ── 上傳圖片 ── */}
          {tab === 'upload' && (
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">圖表名稱（選填）</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="例：我的主圖…"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  上傳人類圖圖片 <span className="text-red-400">*</span>
                </label>

                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${
                    dragging
                      ? 'border-indigo-400 bg-indigo-50'
                      : imagePreview
                      ? 'border-indigo-200 bg-zinc-50'
                      : 'border-zinc-200 bg-zinc-50 hover:border-indigo-300 hover:bg-indigo-50/30'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="預覽"
                        className="w-full max-h-72 object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="opacity-0 hover:opacity-100 bg-white/90 text-zinc-700 text-xs px-3 py-1.5 rounded-full font-medium transition-opacity">
                          點擊更換圖片
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                      <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center mb-4 text-zinc-400 text-xl">
                        ↑
                      </div>
                      <p className="text-sm font-medium text-zinc-700 mb-1">拖曳或點擊上傳</p>
                      <p className="text-xs text-zinc-400">支援 JPG、PNG、WEBP，最大 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>

              <div className="bg-indigo-50 rounded-2xl p-4">
                <p className="text-xs font-medium text-indigo-700 mb-1">AI 分析說明</p>
                <p className="text-xs text-indigo-600 leading-relaxed">
                  上傳你的人類圖圖片後，AI 會自動識別：類型、內在權威、輪廓、已定義中心與通道。建議上傳清晰、完整的圖表截圖。
                </p>
              </div>

              {confidence === 'low' && (
                <div className="bg-amber-50 border border-amber-100 text-amber-700 text-sm px-4 py-3 rounded-xl">
                  ⚠ 分析信心度較低，即將跳轉，部分資訊可能不準確
                </div>
              )}
              {error && !confidence && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading || !imageFile}
                className="w-full bg-zinc-900 text-white text-sm font-medium py-3.5 rounded-full hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI 分析中…
                  </span>
                ) : '開始 AI 分析'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

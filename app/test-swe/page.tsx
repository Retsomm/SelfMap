'use client'

import { useState, useRef } from 'react'
import { initSwissEph, Planet, LunarPoint } from '@/lib/swissEph'
import { calculatePlanetGates, type PlanetGateResult } from '@/lib/humanDesign'

// 加 Z 強制當作 UTC 解析，避免瀏覽器套用本地時區導致偏移算兩次
const toUtcDate = (date: string, time: string, offsetHours: number): Date => {
  const asUtcMs = new Date(`${date}T${time}:00Z`).getTime()
  return new Date(asUtcMs - offsetHours * 3600 * 1000)
}

// Design JD：精確找到太陽退後 88° 的時刻（迭代法）
// 88 曆日只是初始估算，月亮每天移動 ~13°，幾小時的誤差就會導致線數錯誤
const getDesignJd = (
  swe: { calculatePosition: (jd: number, body: number) => { longitude: number } },
  birthJd: number
): number => {
  const birthSun = swe.calculatePosition(birthJd, 0 /* Planet.Sun */).longitude
  const targetSun = ((birthSun - 88) + 360) % 360

  let jd = birthJd - 88  // 初始估算

  for (let i = 0; i < 10; i++) {
    const currentSun = swe.calculatePosition(jd, 0).longitude
    let diff = ((currentSun - targetSun) + 360) % 360
    if (diff > 180) diff -= 360   // 歸一化到 [-180, 180]
    if (Math.abs(diff) < 0.00001) break
    jd -= diff  // 太陽每天移動約 1°，diff 度 ≈ diff 天
  }

  return jd
}

interface PlanetRow extends PlanetGateResult {
  persLon: number
  desLon: number
}

interface Result {
  jd: number
  designJd: number
  utcTime: string
  designUtcTime: string
  planets: PlanetRow[]
}

export default function TestSwePage() {
  const [date, setDate] = useState('1996-12-14')
  const [time, setTime] = useState('19:00')
  const [offset, setOffset] = useState(8)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const sweRef = useRef<Awaited<ReturnType<typeof initSwissEph>> | null>(null)

  const calculate = async () => {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      if (!sweRef.current) {
        sweRef.current = await initSwissEph()
      }
      const swe = sweRef.current
      const birthUtc = toUtcDate(date, time, offset)
      const jd       = swe.dateToJulianDay(birthUtc)
      const designJd = getDesignJd(swe, jd)   // 精確：找太陽退後 88° 的 JD
      // 將 JD 轉回 Date 以顯示用
      const designUtc = new Date((designJd - 2440587.5) * 86400 * 1000)

      // 不傳 flag，使用函式庫預設（瀏覽器環境 = Moshier，精度已足夠）
      const lon = (body: Parameters<typeof swe.calculatePosition>[1], jdVal: number) =>
        swe.calculatePosition(jdVal, body).longitude

      const sunP = lon(Planet.Sun, jd)
      const sunD = lon(Planet.Sun, designJd)
      const nnP  = lon(LunarPoint.TrueNode, jd)
      const nnD  = lon(LunarPoint.TrueNode, designJd)

      const rows: [string, number, number][] = [
        ['太陽',   sunP,                         sunD],
        ['地球',   (sunP + 180) % 360,           (sunD + 180) % 360],
        ['月亮',   lon(Planet.Moon,    jd),      lon(Planet.Moon,    designJd)],
        ['北交點', nnP,                           nnD],
        ['南交點', (nnP + 180) % 360,            (nnD + 180) % 360],
        ['水星',   lon(Planet.Mercury, jd),      lon(Planet.Mercury, designJd)],
        ['金星',   lon(Planet.Venus,   jd),      lon(Planet.Venus,   designJd)],
        ['火星',   lon(Planet.Mars,    jd),      lon(Planet.Mars,    designJd)],
        ['木星',   lon(Planet.Jupiter, jd),      lon(Planet.Jupiter, designJd)],
        ['土星',   lon(Planet.Saturn,  jd),      lon(Planet.Saturn,  designJd)],
        ['天王星', lon(Planet.Uranus,  jd),      lon(Planet.Uranus,  designJd)],
        ['海王星', lon(Planet.Neptune, jd),      lon(Planet.Neptune, designJd)],
        ['冥王星', lon(Planet.Pluto,   jd),      lon(Planet.Pluto,   designJd)],
      ]

      const planets: PlanetRow[] = rows.map(([name, pLon, dLon]) => ({
        ...calculatePlanetGates(pLon, dLon, name),
        persLon: pLon,
        desLon: dLon,
      }))

      setResult({ jd, designJd, utcTime: birthUtc.toISOString(), designUtcTime: designUtc.toISOString(), planets })
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono">
      <h1 className="text-2xl font-bold mb-8">Swiss Ephemeris 測試頁</h1>

      <section className="bg-gray-900 rounded-xl p-6 mb-8 max-w-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-gray-400 text-sm">出生日期</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-gray-800 rounded px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400 text-sm">出生時間（本地）</span>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="bg-gray-800 rounded px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400 text-sm">時區（UTC+?）</span>
            <input
              type="number"
              value={offset}
              onChange={e => setOffset(Number(e.target.value))}
              min={-12}
              max={14}
              step={0.5}
              className="bg-gray-800 rounded px-3 py-2 text-white"
            />
          </label>
        </div>
        <button
          onClick={calculate}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg py-2 font-semibold transition-colors"
        >
          {loading ? '計算中...' : '計算行星位置'}
        </button>
      </section>

      {error && <p className="text-red-400 mb-6">❌ {error}</p>}

      {result && (
        <section className="max-w-4xl overflow-x-auto">
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-400">
            <div>
              <p className="text-white font-semibold mb-1">Personality（意識）</p>
              <p>JD：{result.jd.toFixed(4)}</p>
              <p>UTC：{result.utcTime}</p>
            </div>
            <div>
              <p className="text-red-400 font-semibold mb-1">Design（潛意識）</p>
              <p>JD：{result.designJd.toFixed(4)}</p>
              <p>UTC：{result.designUtcTime}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse whitespace-nowrap">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 text-xs">
                <th className="text-left py-2 pr-4">行星</th>
                <th className="text-left py-2 pr-4 text-gray-500">P 經度</th>
                <th className="text-left py-2 pr-6 text-white">黑色（意識）</th>
                <th className="text-left py-2 pr-4 text-gray-500">D 經度</th>
                <th className="text-left py-2 text-red-400">紅色（潛意識）</th>
              </tr>
            </thead>
            <tbody>
              {result.planets.map(p => (
                <tr key={p.planetName} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4 text-gray-300">{p.planetName}</td>
                  <td className="py-2 pr-4 text-gray-500 text-xs">{p.persLon.toFixed(3)}°</td>
                  <td className="py-2 pr-6 text-emerald-400 font-bold">{p.black.full}</td>
                  <td className="py-2 pr-4 text-gray-500 text-xs">{p.desLon.toFixed(3)}°</td>
                  <td className="py-2 text-red-400 font-bold">{p.red.full}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  )
}

import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import Navbar from '@/components/Navbar'

export default async function HomePage() {
  const { userId } = await auth()
  const isSignedIn = !!userId

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isSignedIn={isSignedIn} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-16">
        <div className="max-w-3xl mx-auto text-center space-y-8 py-24">
          <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            人類圖自我探索平台
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 leading-tight">
            探索你的
            <br />
            <span className="text-indigo-600">內在地圖</span>
          </h1>

          <p className="text-xl text-zinc-500 max-w-xl mx-auto leading-relaxed">
            用互動式地圖重新認識自己。輸入出生資料，即刻生成你的人類圖，點擊每個能量中心，探索你的行為模式與潛力。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isSignedIn ? (
              <>
                <Link
                  href="/create"
                  className="bg-zinc-900 text-white text-sm font-medium px-8 py-3.5 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  建立新圖表
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  查看我的圖表
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="bg-zinc-900 text-white text-sm font-medium px-8 py-3.5 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  立即探索
                </Link>
                <Link
                  href="/sign-in"
                  className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  已有帳號？登入
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="w-full max-w-5xl mx-auto pb-24 grid grid-cols-1 sm:grid-cols-3 gap-6 px-6">
          {[
            {
              icon: '◉',
              title: '9 個能量中心',
              desc: '每個中心代表你生命中不同的能量主題，從思維到身體都有對應',
            },
            {
              icon: '⌁',
              title: '互動式探索',
              desc: '點擊任何中心，立刻查看該中心對你行為、優勢與盲點的深度解讀',
            },
            {
              icon: '⊕',
              title: '個人化洞察',
              desc: '根據你的出生資訊生成專屬圖表，沒有兩個人的地圖是完全相同的',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-zinc-50 rounded-2xl p-6 space-y-3 border border-zinc-100"
            >
              <div className="text-2xl text-indigo-500">{item.icon}</div>
              <h3 className="font-semibold text-zinc-900">{item.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-100 py-8 text-center text-sm text-zinc-400">
        SelfMap © 2024 — 用科學視角探索人類圖
      </footer>
    </div>
  )
}

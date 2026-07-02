'use client'

export default function AboutClient() {
  return (
    <main className="max-w-360 mx-auto px-3 md:px-14 pt-28 pb-20">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-base tracking-[0.18em] uppercase text-(--ink-soft) mb-3">
          關於 SelfMap
        </p>
        <h1 className="font-serif italic text-4xl text-(--ink) mb-8 leading-tight">
          把人類圖的複雜結構，變成一個能被看見、被理解、被使用的工具。
        </h1>
        <div className="border-t border-(--ink) pt-8 space-y-8">
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              這是什麼
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              SelfMap 讓你把出生資料轉成清楚的人類圖分析，從九大中心、閘門、通道到輪迴交叉，一步一步幫你看見自己。
            </p>
          </section>
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              技術與設計
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              我們使用 Swiss Ephemeris 與即時計算引擎，將複雜的天體與身體圖關係整理成可讀的視覺與文字摘要。
            </p>
          </section>
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              隱私與資料
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              你的出生資料與圖表僅用於計算與呈現，帳號資料會妥善保管，並且可由你自行管理。
            </p>
          </section>
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              聯絡與合作
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              若你對這個專案有任何想法、回饋或合作機會，歡迎透過網站聯絡我們。
            </p>
          </section>
          <section className="border border-(--ink-soft) rounded-md p-5 bg-(--surface-muted)">
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              免責聲明
            </h2>
            <p className="text-sm leading-relaxed text-(--ink-soft)">
              人類圖是一種自我探索與反思工具，提供的資訊僅供參考，不代表任何醫療或心理診斷。
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

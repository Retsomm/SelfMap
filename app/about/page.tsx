export default function AboutPage() {
  return (
    <main className="max-w-360 mx-auto px-14 pt-28 pb-20">
      <div className="max-w-2xl">
        <p className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-(--ink-soft) mb-3">
          About · 關於
        </p>
        <h1 className="font-serif italic text-4xl text-(--ink) mb-8 leading-tight">
          關於 SelfMap
        </h1>
        <div className="border-t border-(--ink) pt-8 space-y-8">
          <section>
            <h2 className="font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              這個網站是什麼？
            </h2>
            <p className="text-[12px] md:text-base leading-relaxed text-(--ink)">
              SelfMap 是一個熱愛人類圖的投射者，創立的推廣人類圖網站，致力於讓很多人認識人類圖後，進而瞭解自己，並且發揮自己的天賦在生活中。
            </p>
          </section>
          <section>
            <h2 className="font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              技術架構
            </h2>
            <p className="text-[12px] md:text-base leading-relaxed text-(--ink)">
              SelfMap 採用 Swiss Ephemeris 星曆計算核心，透過 WebAssembly 在瀏覽器端進行行星位置計算，確保每一份圖表的精準性。前端使用 Next.js 搭配 Tailwind CSS 構建，資料儲存於 PostgreSQL。
            </p>
          </section>
          <section>
            <h2 className="font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              隱私聲明
            </h2>
            <p className="text-[12px] md:text-base leading-relaxed text-(--ink)">
              你的出生資料僅用於計算人類圖，不會被用於任何廣告投放或第三方分析。帳號資料透過 Clerk 安全管理，圖表資料加密儲存。
            </p>
          </section>
          <section>
            <h2 className="font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              聯絡
            </h2>
            <p className="text-[12px] md:text-base leading-relaxed text-(--ink)">
              如有任何問題或建議，歡迎透過 Email 聯繫112182ssss@gmail.com。SelfMap 目前仍在持續開發中，未來可能會支援ＡＰＰ或是其他進階功能，敬請期待。
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

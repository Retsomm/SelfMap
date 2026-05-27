export default function HumanDesignPage() {
  return (
    <main className="max-w-360 mx-auto px-14 pt-28 pb-20">
      <div className="max-w-2xl">
        <p className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-(--ink-soft) mb-3">
          Human Design · 人類圖
        </p>
        <h1 className="font-serif italic text-4xl text-(--ink) mb-8 leading-tight">
          認識人類圖
        </h1>
        <div className="border-t border-(--ink) pt-8 space-y-8">
          <section>
            <h2 className="font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              什麼是人類圖？
            </h2>
            <p className="text-[12px] md:text-base leading-relaxed text-(--ink)">
              人類圖（Human Design）是一套整合了占星學、易經、卡巴拉生命之樹、印度脈輪系統與量子物理學的綜合體系，由 Ra Uru Hu 於 1987 年在西班牙伊比薩島接收而成。它透過你的出生時間、日期與地點，計算出一張獨特的身體圖（Body Graph）。
            </p>
          </section>
          <section>
            <h2 className="font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              五種類型
            </h2>
            <ul className="space-y-3 text-[12px] md:text-base leading-relaxed text-(--ink)">
              <li>
                <span className="font-medium">顯示者（Manifestor）</span>
                <span className="text-(--ink-soft)"> — 約 9%，有能量發起行動，策略是告知。</span>
              </li>
              <li>
                <span className="font-medium">生產者（Generator）</span>
                <span className="text-(--ink-soft)"> — 約 37%，薦骨有持續能量，策略是回應。</span>
              </li>
              <li>
                <span className="font-medium">顯示生產者（Manifesting Generator）</span>
                <span className="text-(--ink-soft)"> — 約 33%，兼具顯示者與生產者特質。</span>
              </li>
              <li>
                <span className="font-medium">投射者（Projector）</span>
                <span className="text-(--ink-soft)"> — 約 20%，善於引導他人，策略是等待邀請。</span>
              </li>
              <li>
                <span className="font-medium">反映者（Reflector）</span>
                <span className="text-(--ink-soft)"> — 約 1%，如月亮般反映環境，策略是等待月亮週期。</span>
              </li>
            </ul>
          </section>
          <section>
            <h2 className="font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              閘門與通道
            </h2>
            <p className="text-[12px] md:text-base leading-relaxed text-(--ink)">
              身體圖由 9 個能量中心、36 個通道與 64 個閘門組成，對應易經的 64 卦。當兩個閘門連接形成完整通道時，該通道所連結的中心便被「定義」，成為你穩定的能量來源。
            </p>
          </section>
          <section>
            <h2 className="font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              如何使用
            </h2>
            <p className="text-[12px] md:text-base leading-relaxed text-(--ink)">
              在 SelfMap 輸入你的出生資料，即可獲得完整的人類圖分析，包含類型、權威、輪廓、定義中心與個人主題，幫助你更深入認識自己的本質與決策方式。
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

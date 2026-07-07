'use client'

const SECTIONS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: '簡介',
    paragraphs: [
      'SelfMap 為一款以出生日期、時間與地點計算並視覺化「人類圖（Human Design）」的應用，包含 Web（Next.js）與 Mobile（Expo / React Native）兩套前端，服務端 API 提供圖表儲存、合圖與流日快照等功能。本政策說明我們如何收集、使用、儲存與保護使用者資料，以及使用者的權利。',
    ],
  },
  {
    heading: '營運者',
    paragraphs: ['聯絡信箱：112182ssss@gmail.com'],
  },
  {
    heading: '我們收集哪些資料（類別與用途）',
    paragraphs: [
      '我們僅收集應用所需的資料以提供核心功能，主要資料類別包括：',
      '帳戶與身分資料 — 內容：電子郵件地址、姓名（當使用第三方登入時由該提供者提供）。來源：使用者透過 Clerk 註冊 / 第三方登入（Google、Line）。用途：建立與管理使用者帳號、登入驗證、回傳短效 sign-in token（mobile）。',
      '出生資料與圖表資料（關鍵個人資料） — 內容：出生日期、出生時間、出生城市 / 時區 / 地點、使用者自訂的圖表名稱、儲存的 Chart 與 BirthProfile 資料（包含計算結果、閘門、中心、通道等）。來源：使用者在應用中輸入或匯入。用途：計算與產生人類圖、合圖、流日分析、儲存與匯出（PNG / PDF）之用。這些資料為個人識別性資料（PII），我們會謹慎處理並取得同意後才蒐集。',
      '使用行為與統計資料 — 內容：頁面檢視計數（僅以站方統計）、API 抽樣統計（例如後端 /api/stats 統計）。來源：伺服器端統計（Umami）或服務端記錄。用途：流量分析、服務改善、錯誤監控（僅限伺服器端）。',
      '裝置與技術資料（Mobile） — 內容：裝置類型、平台（iOS/Android）、錯誤訊息、部分快取或本機設定。來源：由 mobile 應用在裝置端收集（例如用於 EAS 建置與除錯）。用途：改善相容性與偵錯。',
      '安全性與審計日誌 — 內容：登入 / 管理操作記錄（例如 admin 建立通知的日誌）。用途：維護服務安全、偵測濫用。',
    ],
  },
  {
    heading: '我們如何收集資料',
    paragraphs: [
      '直接由使用者輸入：建立圖表、儲存出生資料、輸入個人資訊。',
      '第三方授權：使用 Google Sign-In、Line 登入時，我們會透過 Google 的 token 驗證（server-side 呼叫 Google tokeninfo）取得被授權的 email 與基本資訊；Clerk 會處理帳號管理與 session。',
      '伺服器端統計：網站流量統計透過 Umami API（後端呼叫）取得聚合數據；伺服器端才會使用 UMAMI_API_TOKEN 與 Umami 互動（未於客戶端嵌入 Google Analytics 等追蹤程式碼）。',
    ],
  },
  {
    heading: '第三方服務與分享',
    paragraphs: [
      '為運作服務，我們會使用並可能與下列第三方互動：',
      'Clerk（身份驗證與使用者管理） — 處理登入、使用者 ID 與 session。',
      'Google（Google Sign-In） — 驗證 Google id_token（僅在使用者選擇 Google 登入時）。',
      'Line（Line 登入） — 當使用者選擇 Line 登入時使用。',
      'Umami（站方後端分析） — 提供聚合流量統計；後端以 API key 呼叫 Umami。',
      'Supabase / PostgreSQL（資料庫託管） — 儲存 Charts、BirthProfiles、Notifications 等資料。',
      'Vercel（Web 部署）／EAS & Expo（Mobile 建置與分發） — 程式碼部署與建置服務。',
      '我們不會在未經使用者同意下出售個人資料給任何第三方。只會在法律要求或為保護我們、使用者或第三方權利時，根據法定程序提供必要資料。',
    ],
  },
  {
    heading: '資料保留與刪除',
    paragraphs: [
      '我們會將使用者的圖表與出生資料保留至使用者主動刪除帳號或資料、或依法律與營運需求另行保留。一般情況下，若使用者刪除特定圖表或出生資料，該資料會從資料庫中移除（或標記為已刪除）並在合理時間內完全清除備份。',
      '若使用者想要刪除帳號或要求刪除其所有個人資料，可透過應用內「帳號」/「設定」功能執行刪除（若應用提供），或聯絡我們（請以隱私聯絡信箱）。',
    ],
  },
  {
    heading: '使用者權利',
    paragraphs: [
      '視管轄法規（例如 GDPR、台灣個資法等），使用者可能擁有以下權利：查詢與存取、更正、刪除、匯出、反對或限制處理（在適用情況下）。',
      '若要行使上述權利，請透過隱私聯絡信箱提出申請，我們會在合理期間內回覆並處理。',
    ],
  },
  {
    heading: '在地端（裝置）資料儲存與安全',
    paragraphs: [
      'Mobile 應用會在裝置上暫存或儲存部分 token 與使用者設定：短效 sign-in token 與機密型資訊會儲存在 expo-secure-store（安全儲存）或其他受限儲存；非敏感快取可能使用 AsyncStorage。請勿在公用或不安全的裝置上保留登入狀態。',
      '圖表匯出（PNG / PDF）由應用產生，預設不會自動上傳至任何第三方；若使用者透過系統分享功能上傳或分享到第三方，該分享行為即受該第三方平台政策約束。',
    ],
  },
  {
    heading: '資料傳輸與安全措施',
    paragraphs: [
      '我們在網路傳輸上使用 HTTPS（TLS）以加密與保護使用者與伺服器之間的通訊。',
      '伺服器端使用環境變數管理機密（Clerk keys、UMAMI_API_TOKEN、DATABASE_URL 等），只有授權服務能存取。',
      '資料庫存取透過 Prisma 並由受控的 DB 使用者與連線管理。',
      '我們會定期更新相依套件並修補已知安全性弱點。',
    ],
  },
  {
    heading: '與兒童有關的政策',
    paragraphs: [
      '本服務並非針對未滿法定年齡的兒童（請依各國法律定義）設計。我們不會故意蒐集未成年人（未滿法定年齡）可識別資訊；若家長發現其子女於未經同意下向我們提供資料，請聯絡我們，我們會在合理時間內移除該等資料。',
    ],
  },
  {
    heading: '自動化決策與服務性質',
    paragraphs: [
      '本應用以演算法（Swiss Ephemeris 計算）自動產生人類圖與分析結果；此類結果為參考性質，不構成專業醫療、心理或法律建議。使用者應以自身判斷與專業諮詢為準。',
    ],
  },
  {
    heading: 'Google Play 要求的資料披露',
    paragraphs: [
      '我們會收集使用者提供的個人資訊（電子郵件、出生日期 / 時間 / 地點、圖表內容）。',
      '我們會儲存此資料至後端資料庫以提供圖表儲存與同步功能。',
      '我們使用第三方登入（Google、Line、Clerk）以驗證與帳號建立；使用者可選擇不使用第三方登入。',
      '我們使用後端分析（Umami）來收集聚合流量統計；不會使用 Google Analytics 或廣告追蹤 SDK 作個人追蹤。',
      '無廣告投放、無將資料出售給第三方。',
    ],
  },
  {
    heading: '常見操作與如何刪除資料',
    paragraphs: [
      '刪除單一圖表：登入後於「我的圖表」或圖表詳細頁選擇刪除。',
      '刪除出生資料（BirthProfile）：登入後於「出生資料管理」中刪除。',
      '刪除帳號 / 匯出資料：若應用內無專門刪帳或匯出頁面，請以隱私聯絡信箱提出（請提供帳號 email 與必要驗證資訊），我們會在受理後處理。',
    ],
  },
  {
    heading: '本政策變更',
    paragraphs: [
      '我們會不時更新隱私權政策。若變更幅度重大，我們會透過應用內公告或電子郵件通知使用者並在本頁標示生效日期。',
    ],
  },
  {
    heading: '聯絡我們',
    paragraphs: [
      '如對本隱私權政策有疑問或欲行使資料權利，請寄信至：112182ssss@gmail.com。',
    ],
  },
  {
    heading: '附錄：開發者與技術備註（供內部或法務參考）',
    paragraphs: [
      '身分與認證：使用 Clerk 作為身份驗證服務；Mobile 端若以 Google 登入，後端會呼叫 Google tokeninfo 驗證 id_token（參見 /api/auth/mobile/google）。',
      '統計：後端向 Umami 取得聚合統計（/api/stats），Umami API token 儲存在環境變數，後端呼叫並回傳聚合數據（shields.io badge 用）。',
      '資料庫：使用 PostgreSQL via Prisma（Supabase 托管）；資料表：User、BirthProfile、Chart、Notification 等。',
      'WASM：Swiss Ephemeris 在客戶端以 WebAssembly 運算（public/swisseph.wasm），該檔案本身非個人資料。',
      '裝置儲存：Mobile 使用 expo-secure-store（儲存 token）與 AsyncStorage（快取與非敏感設定）。',
      '日誌與錯誤：伺服器端保留操作與錯誤日誌以便偵錯；若採用額外錯誤追蹤服務（如 Sentry），需另行在政策中揭露（目前程式碼中未見）。',
    ],
  },
]

export default function PrivateClient() {
  return (
    <main className="max-w-360 mx-auto px-3 md:px-14 pt-28 pb-20">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-base tracking-[0.18em] uppercase text-(--ink-soft) mb-3">
          隱私權政策
        </p>
        <h1 className="font-serif italic text-4xl text-(--ink) mb-2 leading-tight">
          SelfMap
        </h1>
        <p className="text-sm text-(--ink-soft) mb-8">生效日期：2026-07-07</p>
        <div className="border-t border-(--ink) pt-8 space-y-8">
          {SECTIONS.map(section => (
            <section key={section.heading}>
              <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
                {section.heading}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-base leading-relaxed text-(--ink)">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

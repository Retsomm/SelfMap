# SelfMap — 探索你的內在地圖

SelfMap 是一個精準的人類圖（Human Design）計算器，透過出生日期、時間與地點，即時計算並視覺化呈現完整身體圖（Body Graph）。專案包含 **Web（Next.js）** 與 **Mobile（Expo / React Native）** 兩個獨立前端，共用同一組後端 API 與資料庫。

![Views](https://img.shields.io/endpoint?url=https://selfmap.tw/api/stats)

---

## 功能特色

- **即時人類圖計算** — 輸入出生資料後生成完整身體圖，計算所有 13 顆行星的 Personality 與 Design 位置
- **互動式身體圖（BodyGraph）** — SVG 渲染 9 大能量中心、64 個閘門、36 條通道，點擊可展開詳細說明
- **完整人類圖分析** — 類型（Type）、人生角色（Profile）、決策權威（Authority）、定義（Definition）、輪迴交叉（Incarnation Cross）、四箭頭（Variables）
- **合圖分析（Composite）** — 兩人圖表合併檢視，分析關係連結動態
- **流日分析（Transit）** — 即時計算當下行星閘門位置，對照個人圖表查看能量流動與影響
- **AuraFlow 能量流動時鐘** — 獨立顯示頁（`/aura-flow`），供 Raspberry Pi 等常駐螢幕以 Kiosk 模式輪播「個人圖 × 當下流日」合圖，每 30 分鐘自動刷新
- **出生資料管理** — 登入後可儲存多組常用出生資料（獨立 `BirthProfile` 資料表），一鍵快速填入個人圖表或合圖分析
- **儲存圖表** — 登入後可儲存多份人類圖至個人帳號
- **圖表下載** — 匯出為 PNG/PDF 留存
- **AI 提示詞** — 一鍵複製結構化提示詞，貼至任何 AI 進行深度解讀
- **通知系統** — 站方公告 / 新功能 / 修正通知，Web 與 Mobile 皆可讀取與標示已讀
- **人類圖教學內容** — 涵蓋五大類型、九大中心、通道、閘門、輪迴交叉等主題說明
- **雙語介面** — 繁體中文 / English（Web 透過 cookie 切換）
- **Mobile App**（Expo / React Native）— 涵蓋個人圖、合圖、流日、教學、出生資料管理、通知，並支援 Google / Line 第三方登入

---

## 技術架構

### Web（根目錄）

| 層級 | 技術 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript |
| 樣式 | Tailwind CSS 4 |
| 星曆計算 | Swiss Ephemeris (`@swisseph/browser` WebAssembly) |
| 身份驗證 | Clerk (`@clerk/nextjs`) |
| 資料庫 | PostgreSQL via Prisma（Supabase 托管） |
| UI 元件 | Radix UI（Select / Popover）+ react-day-picker |
| 動畫 | Framer Motion |
| 圖表匯出 | html-to-image + jsPDF |
| 部署 | Vercel |

### Mobile（`mobile/`）

| 層級 | 技術 |
|------|------|
| 框架 | Expo 56 + React Native 0.85 + Expo Router |
| 身份驗證 | Clerk (`@clerk/expo`) + Google Sign-In + Line 登入（透過 `/api/auth/mobile/google` 換發 Clerk session） |
| 儲存 | expo-secure-store（token）、AsyncStorage |
| 圖形 | react-native-svg |
| 圖表匯出 | expo-print（PDF） |
| 平台 | iOS / Android（`ios/`、`android/` 原生專案已 prebuild） |

Web 與 Mobile 都呼叫同一組 `app/api` 後端，計算邏輯（星曆轉換、Profile / Type / Authority 判斷）在兩端各自實作對應版本（`lib/humanDesign/` 對照 `mobile/lib/hd-*`），資料模型與 API 契約共用。

---

## 計算原理

SelfMap 採用 Swiss Ephemeris（天文星曆標準函式庫）作為計算核心：

1. **時間轉換** — 依出生地點時區，將本地時間轉為 UTC，再轉為儒略日（Julian Day）
2. **Personality 時刻** — 出生當下的行星黃道位置
3. **Design 時刻** — 出生前太陽退行 88° 的時間點（約 88 天前），再計算全天球行星位置
4. **閘門轉換** — 將黃道度數（0–360°）映射至易經 64 卦對應的人類圖閘門與爻線
5. **中心 / 通道定義** — 兩閘門同時激活時形成通道，通道所連接的中心被「定義」
6. **類型推導** — 依薦骨（Sacral）、喉嚨（Throat）等關鍵中心的定義狀態判斷五大類型
7. **權威優先順序** — 情緒 → 薦骨 → 脾 → 意志力 → G 中心 → 腦部 → 環境 / 月亮
8. **輪迴交叉** — 以太陽 / 地球（Personality + Design）四個閘門組成
9. **四箭頭 Variables** — 以太陽與北交點的 Personality / Design 爻線判斷
10. **流日（Transit）** — 只取當下時刻的 Personality（意識層）閘門位置，與個人圖疊圖比對能量變化

計算範圍：1900–2040 年。Web 端在瀏覽器透過 WASM 計算；部分流程（合圖建立、流日快照儲存）在伺服器端執行（`lib/computeHdResultServer.ts`、`lib/swissEphServer.ts`）。

---

## 頁面結構

### Web

```
/                       主頁 — 人類圖計算器
/map/[chartId]          已儲存圖表的獨立分享頁
/human-design           人類圖教學內容（含子導覽）
/aura-flow              AuraFlow 常駐顯示頁（個人圖 × 流日合圖）
/about                  關於 SelfMap
/account                個人帳號 + 儲存的圖表
/dashboard              圖表管理儀表板
/create                 建立新圖表（替代表單入口）
/sign-in                Clerk 登入頁
```

### Mobile（Expo Router）

```
(tabs)/index            首頁 — 個人圖表列表
(tabs)/create           建立新圖表
(tabs)/learn            人類圖教學
(tabs)/profile          個人帳號 / 出生資料管理
(auth)/sign-in          登入頁（Clerk + Google + Line）
chart/[id]              圖表詳情（個人 / 合圖 / 流日）
chart/preview           圖表預覽（儲存前）
learn/[topic]           教學主題詳情
oauth-native-callback   第三方登入回呼頁
```

---

## 專案目錄

```
selfmap/
├── app/                          Next.js App Router 頁面
│   ├── page.tsx                  主頁（計算器）
│   ├── map/[chartId]/            已儲存圖表分享頁
│   ├── human-design/             人類圖教學頁
│   ├── aura-flow/                AuraFlow 常駐顯示頁
│   ├── about/                    關於頁
│   ├── account/                  帳號頁
│   ├── dashboard/                儀表板
│   ├── create/                   建立頁
│   └── api/
│       ├── charts/               個人圖表 CRUD
│       ├── charts/[id]/          單一圖表操作（GET / DELETE）
│       ├── birth-profiles/       出生資料 CRUD
│       ├── composite/            合圖分析（不儲存）/ 建立並儲存合圖
│       ├── transit/              流日快照建立 / 查詢 / 影響分析
│       ├── aura-flow/            AuraFlow 資料與即時 SVG
│       ├── notifications/        站內通知 CRUD
│       ├── auth/mobile/google/   Mobile Google 登入換發 Clerk session
│       ├── compute/              通用人類圖計算端點
│       └── stats/                頁面流量統計
├── components/
│   ├── humanDesign/               人類圖相關元件
│   │   ├── BodyGraph.tsx          SVG 身體圖主體
│   │   ├── ChartView.tsx          個人圖表詳情檢視
│   │   ├── CompositeView.tsx      合圖雙人比對檢視
│   │   ├── CompositeTab.tsx       合圖分頁
│   │   ├── TransitTab.tsx         流日分析分頁
│   │   ├── TransitView.tsx        流日行星閘門視覺化
│   │   ├── BirthFormModal.tsx     共用出生資料表單 Modal
│   │   ├── BirthProfileManager.tsx 出生資料管理（新增 / 編輯 / 刪除）
│   │   ├── DetailDrawer.tsx       閘門 / 通道詳情抽屜
│   │   ├── PersonalTab.tsx        個人資訊分頁
│   │   ├── LocationPicker.tsx     城市時區選擇器
│   │   ├── DateSelect.tsx / TimeSelect.tsx  日期 / 時間選擇
│   │   ├── HdSubNav.tsx / HdContentFilter.tsx / HdMarkdown.tsx  教學頁相關
│   │   ├── PlanetIcon.tsx         行星圖示
│   │   ├── hd-chart-data.ts / hd-cross-data.ts / hd-summary-data.ts  靜態資料
│   │   └── locationData/          城市時區資料
│   ├── ui/                        基礎 UI 元件（Radix UI 封裝）
│   ├── Navbar.tsx                 頂部導覽列
│   ├── CenterDrawer.tsx           中心詳情抽屜
│   ├── ConfirmModal.tsx           確認對話框
│   ├── LoadingSpinner.tsx         載入動畫
│   └── SelfMapLogo.tsx            Logo 元件
├── lib/
│   ├── computeHdResult.ts         人類圖主計算流程（瀏覽器端入口）
│   ├── computeHdResultServer.ts   人類圖計算（伺服器端，供 API 使用）
│   ├── computeTransit.ts          流日行星閘門計算（只取當下意識層）
│   ├── transitImpact.ts           流日對個人圖的影響分析
│   ├── compositeAnalysis.ts       合圖關係分析邏輯
│   ├── useBirthProfiles.ts        出生資料管理 hook
│   ├── notificationsAdmin.ts      通知管理（後台用）
│   ├── buildAiPrompt.ts           AI 提示詞組合
│   ├── swissEph.ts / swissEphServer.ts  Swiss Ephemeris WASM 封裝（瀏覽器 / 伺服器）
│   ├── saveChart.ts               圖表儲存（個人 / 合圖 / 流日）
│   ├── downloadChart.ts           圖表下載（PNG / PDF）
│   ├── clerkAppearance.ts         Clerk UI 主題設定
│   ├── utils.ts                   通用工具函式
│   ├── db.ts                      Prisma client 單例
│   └── humanDesign/               計算模組
│       ├── engine.ts              行星計算主引擎
│       ├── constants.ts           閘門 / 通道映射常數
│       ├── gates.ts               閘門定義資料
│       ├── types.ts               TypeScript 型別定義
│       ├── hd-topics.ts           教學主題清單
│       └── index.ts               模組統一匯出
├── data/                          人類圖教學 Markdown 內容（9 篇）
├── i18n/                          多語言翻譯（zh / en）+ useLang hook
├── utils/                         星曆輔助計算 / 格式化工具
├── prompt/                        計算邏輯說明文件（01–13）
├── prisma/schema.prisma           資料庫 Schema
├── public/swisseph.wasm           Swiss Ephemeris WebAssembly 二進位
└── mobile/                        Expo / React Native App（獨立子專案）
    ├── app/                       Expo Router 頁面
    │   ├── (tabs)/                首頁 / 建立 / 教學 / 個人帳號
    │   ├── (auth)/                登入流程
    │   ├── chart/                 圖表詳情 / 預覽
    │   └── learn/                 教學主題詳情
    ├── components/                個人圖 / 合圖 / 流日 / 教學元件（對應 Web humanDesign/）
    │   ├── chart/                 圖表拆解元件（Composite / Transit）
    │   └── learn/                 教學內容元件
    ├── lib/                       計算與 API 封裝（hd-*、cities.ts、api.ts、chartPdf.ts）
    ├── hooks/                     useBirthProfiles、useGoogleSignIn、useLineSignIn、useKeyboardHeight 等
    ├── contexts/                  ScrollLockContext
    ├── ios/ / android/            原生專案（已 prebuild，EAS Build 用）
    └── eas.json                   EAS Build 設定
```

---

## 資料庫 Schema

```
User          id, clerkId, email, name, createdAt, updatedAt
              → charts[], birthProfiles[]

BirthProfile  id, userId, label, date, time, timezone, location,
              sortOrder, createdAt, updatedAt

Notification  id, title, body, type (feature|bugfix|announcement),
              publishedAt, createdAt, updatedAt

Chart         id, userId, name, birthDate, birthTime, birthCity, timezone,
              type, authority, profile, definition,
              centers (Json), channels (Json), gates (Json),
              personalityGates (Json?), designGates (Json?), planets (Json?),
              chartKind (personal | composite | transit，預設 personal),
              meta (Json?), createdAt, updatedAt
```

> `chartKind` 決定 `Chart` 各欄位的語意（例如 transit 記錄的 `birthDate` 代表快照時間而非出生日）。判斷圖表種類時一律呼叫統一的 `kindOf()` 輔助函式，避免各處重複解讀邏輯。

---

## API 路由

| 方法 | 路徑 | 說明 |
|------|------|------|
| `GET` | `/api/charts` | 取得目前用戶所有圖表 |
| `POST` | `/api/charts` | 建立並儲存新圖表 |
| `GET` | `/api/charts/[id]` | 取得單一圖表（公開） |
| `DELETE` | `/api/charts/[id]` | 刪除圖表（需為擁有者） |
| `GET` | `/api/birth-profiles` | 取得目前用戶所有出生資料 |
| `POST` | `/api/birth-profiles` | 新增出生資料 |
| `PATCH` / `DELETE` | `/api/birth-profiles/[id]` | 更新 / 刪除單一出生資料 |
| `POST` | `/api/composite` | 計算合圖分析（不儲存） |
| `POST` | `/api/composite/create` | 建立並儲存合圖 |
| `GET` | `/api/transit` | 取得流日快照 |
| `POST` | `/api/transit/create` | 建立流日快照 |
| `POST` | `/api/transit/impact` | 計算流日對個人圖的影響 |
| `GET` | `/api/aura-flow` | 取得 AuraFlow 顯示資料（個人圖 × 當下流日） |
| `GET` | `/api/aura-flow/live-svg` | 即時 SVG（供 Kiosk 顯示裝置直接嵌入） |
| `GET` / `POST` | `/api/notifications` | 取得通知列表 / 建立通知 |
| `PATCH` / `DELETE` | `/api/notifications/[id]` | 更新（已讀）/ 刪除通知 |
| `POST` | `/api/compute` | 通用人類圖計算端點 |
| `POST` | `/api/auth/mobile/google` | Mobile Google 登入換發 Clerk session |
| `GET` | `/api/stats` | 頁面瀏覽統計（Umami） |

---

## 本機開發

### Web（根目錄）

**前置需求**：Node.js 18+、yarn、PostgreSQL（或 Supabase 連線字串）、Clerk 帳號

```bash
yarn                        # 安裝依賴
cp .env.example .env.local  # 設定環境變數
yarn prisma migrate dev     # 套用資料庫 migration
yarn dev                    # 啟動開發伺服器
```

開啟 [http://localhost:3000](http://localhost:3000)。

```env
# Clerk 身份驗證
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# 資料庫
DATABASE_URL=          # 連線池 URL（Prisma 用）
DIRECT_URL=            # 直連 URL（migration 用）
```

```bash
yarn dev          # 開發伺服器（webpack 模式）
yarn build        # 正式建構（含 prisma generate）
yarn start        # 啟動正式伺服器
yarn lint         # ESLint 檢查
```

### Mobile（`mobile/`）

**前置需求**：Expo CLI、Xcode（iOS）/ Android Studio（Android）、Clerk Expo 金鑰

```bash
cd mobile
yarn                # 或 npm install
cp .env.example .env

yarn start          # Expo dev server
yarn ios            # 建置並在模擬器啟動 iOS
yarn android        # 建置並在模擬器啟動 Android
yarn web            # 網頁預覽（開發用）
```

原生專案（`ios/`、`android/`）已 prebuild，正式建置與上架由 EAS Build 管理（`eas.json`）。

---

## 部署

- **Web** 部署於 [Vercel](https://vercel.com)，設定於 `vercel.json`。建構指令：`prisma generate && next build --webpack`。Swiss Ephemeris `.wasm` 檔案在建構時透過 `CopyPlugin` 複製至 `/_next/static/chunks/swisseph.wasm`，確保部署包含此必要二進位。
- **Mobile** 透過 EAS Build 建置 iOS / Android 正式版與內部測試版（`mobile/eas.json` 定義 development / preview / production profile）。

---

## 關於人類圖

Human Design 是整合占星學、易經、卡巴拉生命之樹、印度脈輪系統與量子物理學的綜合體系，由 Ra Uru Hu 於 1987 年建立。本網站提供的計算與內容**僅供參考**，無法取代具備專業資格的人類圖分析師所提供的個人諮詢服務。

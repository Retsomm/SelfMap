# SelfMap — 探索你的內在地圖

SelfMap 是一個精準的人類圖（Human Design）計算器，透過出生日期、時間與地點，在瀏覽器端即時計算並視覺化呈現完整身體圖（Body Graph）。
</br>
<img width="464" height="638" alt="截圖 2026-05-29 晚上8 16 18" src="https://github.com/user-attachments/assets/f0c4c607-8671-40b6-8584-02bdde387ee1" />
<img width="680" height="723" alt="截圖 2026-05-29 晚上8 17 19" src="https://github.com/user-attachments/assets/7241b4e9-1cb9-4dbc-9edf-c810cad664af" />

![Views](https://img.shields.io/endpoint?url=https://selfmap.tw/api/stats)

---

## 功能特色

- **即時人類圖計算** — 輸入出生資料後生成完整身體圖，計算所有 13 顆行星的 Personality 與 Design 位置
- **互動式身體圖（BodyGraph）** — SVG 渲染 9 大能量中心、64 個閘門、36 條通道，點擊可展開詳細說明
- **完整人類圖分析** — 類型（Type）、人生角色（Profile）、決策權威（Authority）、定義（Definition）、輪迴交叉（Incarnation Cross）、四箭頭（Variables）
- **合圖分析（Composite）** — 兩人圖表合併檢視，分析關係連結動態
- **流日分析（Transit）** — 即時計算當下行星閘門位置，對照個人圖表查看能量流動
- **出生資料管理** — 登入後可儲存多組常用出生資料，一鍵快速填入個人圖表或合圖分析
- **儲存圖表** — 登入後可儲存多份人類圖至個人帳號
- **圖表下載** — 匯出為 PNG/PDF 留存
- **AI 提示詞** — 一鍵複製結構化提示詞，貼至任何 AI 進行深度解讀
- **人類圖教學內容** — 涵蓋五大類型、九大中心、通道、閘門、輪迴交叉等主題說明
- **雙語介面** — 繁體中文 / English（透過 cookie 切換）

---

## 技術架構

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

---

## 計算原理

SelfMap 採用 Swiss Ephemeris（天文星曆標準函式庫）作為計算核心，透過 WebAssembly 在瀏覽器端直接執行：

1. **時間轉換** — 依出生地點時區，將本地時間轉為 UTC，再轉為儒略日（Julian Day）
2. **Personality 時刻** — 出生當下的行星黃道位置
3. **Design 時刻** — 出生前太陽退行 88° 的時間點（約 88 天前），再計算全天球行星位置
4. **閘門轉換** — 將黃道度數（0–360°）映射至易經 64 卦對應的人類圖閘門與爻線
5. **中心 / 通道定義** — 兩閘門同時激活時形成通道，通道所連接的中心被「定義」
6. **類型推導** — 依薦骨（Sacral）、喉嚨（Throat）等關鍵中心的定義狀態判斷五大類型
7. **權威優先順序** — 情緒 → 薦骨 → 脾 → 意志力 → G 中心 → 腦部 → 環境 / 月亮
8. **輪迴交叉** — 以太陽 / 地球（Personality + Design）四個閘門組成
9. **四箭頭 Variables** — 以太陽與北交點的 Personality / Design 爻線判斷

計算範圍：1900–2040 年。

---

## 頁面結構

```
/                       主頁 — 人類圖計算器
/map/[chartId]          已儲存圖表的獨立分享頁
/human-design           人類圖教學內容（含子導覽）
/about                  關於 SelfMap
/account                個人帳號 + 儲存的圖表
/dashboard              圖表管理儀表板
/create                 建立新圖表（替代表單入口）
/sign-in                Clerk 登入頁
```

---

## 專案目錄

```
selfmap/
├── app/                      Next.js App Router 頁面
│   ├── page.tsx              主頁（計算器）
│   ├── map/[chartId]/        已儲存圖表分享頁
│   ├── human-design/         人類圖教學頁
│   ├── about/                關於頁
│   ├── account/              帳號頁
│   ├── dashboard/            儀表板
│   ├── create/               建立頁
│   └── api/
│       ├── charts/           圖表 CRUD API（GET / POST）
│       ├── charts/[id]/      單一圖表操作（GET / DELETE）
│       └── stats/            頁面流量統計
├── components/
│   ├── humanDesign/          人類圖相關元件
│   │   ├── BodyGraph.tsx     SVG 身體圖主體
│   │   ├── ChartView.tsx     個人圖表詳情檢視
│   │   ├── CompositeView.tsx 合圖雙人比對檢視
│   │   ├── CompositeTab.tsx  合圖分頁（含自動填入出生資料）
│   │   ├── TransitTab.tsx    流日分析分頁
│   │   ├── TransitView.tsx   流日行星閘門視覺化
│   │   ├── BirthProfileManager.tsx 出生資料管理（新增 / 編輯 / 刪除）
│   │   ├── DetailDrawer.tsx  閘門 / 通道詳情抽屜
│   │   ├── PersonalTab.tsx   個人資訊分頁（含自動填入出生資料）
│   │   ├── LocationPicker.tsx 城市時區選擇器
│   │   ├── DateSelect.tsx    日期選擇元件
│   │   ├── TimeSelect.tsx    時間選擇元件
│   │   ├── HdSubNav.tsx      教學頁子導覽
│   │   ├── HdContentFilter.tsx 教學內容篩選
│   │   ├── HdMarkdown.tsx    Markdown 渲染
│   │   ├── PlanetIcon.tsx    行星圖示
│   │   ├── hd-chart-data.ts  圖表靜態資料（閘門 / 通道說明）
│   │   ├── hd-cross-data.ts  輪迴交叉靜態資料
│   │   └── hd-summary-data.ts 中心摘要靜態資料
│   ├── ui/                   基礎 UI 元件（Radix UI 封裝）
│   ├── Navbar.tsx            頂部導覽列
│   ├── CenterDrawer.tsx      中心詳情抽屜
│   ├── ConfirmModal.tsx      確認對話框
│   ├── LoadingSpinner.tsx    載入動畫
│   └── SelfMapLogo.tsx       Logo 元件
├── lib/
│   ├── computeHdResult.ts    人類圖主計算流程（整合入口）
│   ├── computeTransit.ts     流日行星閘門計算（只取當下意識層）
│   ├── useBirthProfiles.ts   出生資料管理 hook（Clerk unsafeMetadata 儲存）
│   ├── compositeAnalysis.ts  合圖關係分析邏輯
│   ├── buildAiPrompt.ts      AI 提示詞組合
│   ├── swissEph.ts           Swiss Ephemeris WASM 封裝
│   ├── saveChart.ts          圖表儲存（個人 / 合圖）
│   ├── downloadChart.ts      圖表下載（PNG / PDF）
│   ├── clerkAppearance.ts    Clerk UI 主題設定
│   ├── utils.ts              通用工具函式
│   ├── db.ts                 Prisma client 單例
│   └── humanDesign/          計算模組
│       ├── engine.ts         行星計算主引擎
│       ├── constants.ts      閘門 / 通道映射常數
│       ├── gates.ts          閘門定義資料
│       ├── types.ts          TypeScript 型別定義
│       ├── hd-topics.ts      教學主題清單
│       └── index.ts          模組統一匯出
├── data/                     人類圖教學 Markdown 內容
│   ├── 人類圖是什麼.md
│   ├── 五大類型.md
│   ├── 五大定義.md
│   ├── 九大中心.md
│   ├── 內在權威.md
│   ├── 人生角色.md
│   ├── 通道.md
│   ├── 閘門.md
│   └── 輪迴交叉.md
├── i18n/                     多語言翻譯（zh / en）
│   ├── chinese.json
│   ├── english.json
│   └── index.tsx             useLang hook
├── utils/                    工具函式
│   ├── ephemeris.ts          星曆輔助計算
│   └── format.ts             格式化工具
├── prompt/                   計算邏輯說明文件（01–13）
├── prisma/schema.prisma      資料庫 Schema
└── public/swisseph.wasm      Swiss Ephemeris WebAssembly 二進位
```

---

## 資料庫 Schema

```
User    id, clerkId, email, name, createdAt, updatedAt
Chart   id, userId, name, birthDate, birthTime, birthCity, timezone,
        type, authority, profile, definition,
        centers (Json), channels (Json), gates (Json),
        createdAt, updatedAt
```

---

## API 路由

| 方法 | 路徑 | 說明 |
|------|------|------|
| `GET` | `/api/charts` | 取得目前用戶所有圖表 |
| `POST` | `/api/charts` | 建立並儲存新圖表 |
| `GET` | `/api/charts/[id]` | 取得單一圖表（公開） |
| `DELETE` | `/api/charts/[id]` | 刪除圖表（需為擁有者） |
| `GET` | `/api/stats` | 頁面瀏覽統計（Umami） |

---

## 本機開發

### 前置需求

- Node.js 18+
- yarn
- PostgreSQL（或 Supabase 連線字串）
- Clerk 帳號

### 安裝與啟動

```bash
# 安裝依賴
yarn

# 設定環境變數（參考下方說明）
cp .env.example .env.local

# 套用資料庫 migration
yarn prisma migrate dev

# 啟動開發伺服器
yarn dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

### 環境變數

```env
# Clerk 身份驗證
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# 資料庫
DATABASE_URL=          # 連線池 URL（Prisma 用）
DIRECT_URL=            # 直連 URL（migration 用）
```

### 常用指令

```bash
yarn dev          # 開發伺服器（webpack 模式）
yarn build        # 正式建構（含 prisma generate）
yarn start        # 啟動正式伺服器
yarn lint         # ESLint 檢查
```

---

## 部署

本專案部署於 [Vercel](https://vercel.com)，設定於 `vercel.json`。

建構指令：`prisma generate && next build --webpack`

Swiss Ephemeris `.wasm` 檔案在建構時透過 `CopyPlugin` 複製至 `/_next/static/chunks/swisseph.wasm`，確保 Vercel 部署包含此必要二進位。

---

## 關於人類圖

Human Design 是整合占星學、易經、卡巴拉生命之樹、印度脈輪系統與量子物理學的綜合體系，由 Ra Uru Hu 於 1987 年建立。本網站提供的計算與內容**僅供參考**，無法取代具備專業資格的人類圖分析師所提供的個人諮詢服務。

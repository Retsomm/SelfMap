# SelfMap 學習路徑：從 vibe coding 到看懂底層邏輯

這份文件是為了讓你不用每次都從頭問「這段程式碼在幹嘛」而寫的。目標讀者是你自己：一個想搞懂
「狀態怎麼流動、Next.js 跟 React Native 底層各自在做什麼」的工程師，不是要新增功能。

**建議讀法**：照 Stage 0 → 5 的順序讀，每個 Stage 讀完先自己回答「自問自答」，答不出來再回頭重讀
對應的檔案，或直接叫 Claude 講解那個 Stage。

---

## Stage 0：Next.js App Router 基礎心智模型（本專案版本特化）

**先讀這個，因為這個專案的 Next.js 版本比你（或任何人的訓練資料）認知的還新。**

- 專案用的是 `next@16.2.6`（見根目錄 `package.json`），`AGENTS.md` 明確警告：
  > 這版本有 breaking changes，寫程式前要先讀 `node_modules/next/dist/docs/` 裡的說明。
- 在動手改任何 `app/` 底下的檔案之前，先去 `node_modules/next/dist/docs/` 找 App Router、
  Server Component、Route Handler 相關文件過一遍，不要完全套用你熟悉的舊版 Next.js 心智模型
  （尤其是 Server/Client Component 邊界、快取行為這幾塊，各版本改動最大）。

**核心問題**：
1. `.tsx` 檔案預設是 Server Component 還是 Client Component？什麼時候需要 `'use client'`？
2. `app/api/xxx/route.ts` 裡的 `route.ts` 是什麼？跟一般的 API 有什麼差異？

---

## Stage 1：SelfMap Web 端架構（優先重點）

### 1.1 目錄總覽

專案根目錄本身就是 Next.js App（不是放在子資料夾）：

```
app/            → Next.js App Router 頁面與 API
components/     → Web 端 React 元件
lib/            → 商業邏輯、DB client、人類圖計算
i18n/           → 多語系字典（見下方陷阱提醒）
data/           → 人類圖知識庫（.md 內容，非程式邏輯）
prisma/         → schema.prisma（Postgres）
public/         → 靜態檔案，含 swisseph.wasm、/ephe 曆表
utils/          → ephemeris.ts（時區/儒略日轉換）、format.ts
mobile/         → 完全獨立的 Expo App（見 Stage 4）
```

### 1.2 App Router 路由與 Server/Client 切分模式

確認過**沒有 `pages/` 目錄**，純 App Router。頁面清單：
`app/about`、`app/account`、`app/create`、`app/dashboard`、`app/aura-flow`、`app/human-design`、
`app/map/[chartId]`、`app/private`、`app/sign-in/[[...sign-in]]`。

**這個專案的固定模式**：`app/xxx/page.tsx` 是 Server Component（會 export `metadata`），
它會 import 一個同目錄下的 `XxxClient.tsx`（標記 `'use client'`）來處理實際互動邏輯。
例如：
- `app/page.tsx` → `HomeClient.tsx`
- `app/dashboard/page.tsx` → `DashboardClient.tsx`
- `app/map/[chartId]/page.tsx` → `MapClient.tsx`
- `app/private/page.tsx` → `PrivateClient.tsx`

這代表：**server component 負責 SEO/metadata，實際的 state、事件處理都在 Client 元件裡**。
讀任何一個頁面時，先看 `page.tsx` 只是薄殼，真正邏輯要去對應的 `*Client.tsx` 找。

沒有發現任何 `'use server'` Server Action —— 資料寫入都是「Client 元件 `fetch` 打
`app/api/**/route.ts`」這種傳統 REST 風格，不是 Next.js 較新的 Server Action 模式。

### 1.3 API Route Handler 清單

`app/api/` 底下：`account/delete`、`auth/mobile/google`、`birth-profiles[/[id]]`、
`charts[/[id]]`、`composite[/create]`、`compute`、`notifications[/[id]]`、`stats`、
`transit[/create|/impact]`、`aura-flow/live-svg`。

**陷阱提醒**：`app/api/compute/route.ts` 目前**查無任何呼叫者**——是孤兒端點，可能是舊設計
殘留或預留給未來用。真正被使用的計算相關端點是 `charts`（存檔/讀檔會觸發伺服器端重算，
細節見 Stage 3）。

### 1.4 Auth（Clerk）與 DB（Prisma）

- `app/layout.tsx` 掛載 `ClerkProvider`（`@clerk/nextjs`），外觀設定在 `lib/clerkAppearance.ts`。
- `lib/db.ts` 是 Prisma Client 的 singleton。
- `prisma/schema.prisma` 定義四個 model：`User`、`BirthProfile`、`Notification`、`Chart`。

### 1.5 一個容易誤踩的地雷：`.fp.ts` 孿生檔

`lib/`、`mobile/lib/`、`mobile/hooks/`、`mobile/components/` 底下，幾乎每個檔案都有一個
同名的 `*.fp.ts`/`*.fp.tsx`（例如 `engine.ts` 旁邊有 `engine.fp.ts`）。這些是
`fp-layers`（devDependency，一個叫 "FP Mentor" 的分析工具）自動產生、標註 💥Action 跟
🧮Calculation 的分析副本，**日期是 7/17，比對應的正式檔案新，但沒有任何地方真的 import 它們**。

判斷方法：`lib/humanDesign/index.ts` 這個 barrel file 只 re-export 非 `.fp` 版本；
所有真正的消費端（`ChartView.tsx`、`PersonalTab.tsx`、API routes）也都 import 非 `.fp` 版本。

**讀程式碼時看到 `.fp.ts` 直接忽略，那是實驗性重寫分支，不是主線邏輯。**

**自問自答**：
1. 為什麼 `app/page.tsx` 不直接把邏輯寫在裡面，而要拆一個 `HomeClient.tsx`？拆開的邊界是什麼？
2. 如果你要新增一個「儲存草稿」的功能，應該寫成一個新的 Server Action，還是新增一個
   `app/api/xxx/route.ts`？這個專案目前的慣例是哪一種？

---

## Stage 2：狀態管理與資料流

### 2.1 全專案沒有全域狀態庫

Web（根 `package.json`）跟 Mobile（`mobile/package.json`）都**沒有** Redux、Zustand、Jotai、
Recoil、SWR。專案已在若干 hook（例如 `lib/useBirthProfiles.ts`）採用 TanStack Query（`@tanstack/react-query`）來管理伺服器狀態，資料抓取與快取不再只靠原生 `fetch`。

### 2.2 Context 盤點

| Context | 檔案 | 狀態內容 | 備註 |
|---|---|---|---|
| `ClerkProvider`（Web） | `app/layout.tsx` | Auth session | 第三方，非自寫 |
| `ClerkProvider`（Mobile） | `mobile/app/_layout.tsx` | Auth session + `tokenCache`（`expo-secure-store`） | 第三方 |
| `LangContext`/`LanguageProvider` | `i18n/index.tsx` | i18n 字典/翻譯函式 | **死碼**：從未掛進 `app/layout.tsx`，沒有元件呼叫 `useLang` |
| `ScrollLockContext` | `mobile/contexts/ScrollLockContext.tsx` | 布林值，鎖定捲動 | 只有 Mobile 有，Web 沒有對應機制 |

**沒有**任何 auth/user-profile Context，也沒有 birth-data-form 的共用 Context——表單狀態就是
元件內的 local `useState`，session 資訊直接用 Clerk 自己的 hook（`useUser`/`useAuth`）。

### 2.3 自訂 stateful hooks

**Web**：`lib/useBirthProfiles.ts` —— 內部用 TanStack Query 的 `useQuery` / `useMutation` 管理
`profiles` / `loading` / `error`（伺服器狀態由 React Query 負責快取/重試），用 Clerk 的
`useUser` 拿使用者身份，並跑一次性的「Clerk metadata → Postgres」搬遷邏輯（用 module-level
`Set` 防止重複搬遷）。

**Mobile**（`mobile/hooks/`）：
- `useBirthProfiles.ts` —— **獨立重寫**，用 `useFocusEffect`（Expo Router 慣例）而非
  `useEffect` 觸發 refetch，跟 Web 版邏輯相似但程式碼完全不共用。
- `useOAuthSignIn.ts`/`useGoogleSignIn.ts`/`useLineSignIn.ts` —— 各登入流程的 loading 狀態。
- `useKeyboardHeight.ts` —— 追蹤原生鍵盤高度做版面調整。

### 2.4 Server state / 持久化

- 沒有 Supabase-JS 或 Firebase SDK（Supabase 只在 `PrivateClient.tsx` 的隱私權政策文案裡被
  提到，是資料庫的**主機商**，不是拿來當 client library 用）。沒有任何 realtime 訂閱。
- Mobile 持久化：`expo-secure-store` 存 Clerk JWT；`@react-native-async-storage/async-storage`
  曾存過出生資料（key `@selfmap/birth_profiles`），已透過 `mobile/lib/birthProfileMigration.ts`
  搬到 DB 並刪除舊資料。
- Web 持久化：沒有用 `localStorage` 存應用資料；同樣有一條「Clerk `unsafeMetadata` → Postgres」
  的一次性搬遷路徑（`lib/useBirthProfiles.ts`）。
- 一個值得留意的脆弱模式：`mobile/lib/pendingChart.ts` 用一個 module-level 的裸變數
  （`let _pending`）在畫面間傳遞剛算好的命盤——不是 React state，也沒持久化，App 重啟就消失。

### 2.5 Web vs Mobile 的不一致

- Birth-profile 狀態完全重複實作兩份（觸發時機、錯誤處理都不同）。
- 兩邊各自的「搬遷舊資料」邏輯來源不同（Web 是 Clerk metadata，Mobile 是 AsyncStorage），
  但目的相同，卻是兩套獨立程式碼。
- Mobile 有 `ScrollLockContext` 處理 UI 鎖定，Web 沒有對應 Context（用 local state 處理類似需求）。
- `i18n` Context 只存在 Web 端且是死碼；Mobile 完全沒有 i18n 抽象，字串直接寫死中文。

**自問自答**：
1. 如果你現在要幫這個專案「補一個狀態管理工具」，該補哪一種？（提示：先想清楚痛點是「畫面狀態
   協調太複雜」還是「重複的 fetch/loading/error 樣板碼」，兩種痛點對應的解法完全不同。）
2. 為什麼 Mobile 用 `useFocusEffect` 而不是 `useEffect` 來 refetch？跟 Web 的 `useEffect` 版本
   在使用者體驗上會有什麼差異？

---

## Stage 3：人類圖核心計算引擎（次重點，深度）

這是整個專案「業務邏輯最重」的地方，全部在 `lib/humanDesign/` 跟幾個 `lib/compute*.ts`。

### 3.1 檔案清單（`lib/humanDesign/`）

| 檔案 | 匯出 | 用途 |
|---|---|---|
| `types.ts` | `CenterName`、`HumanDesignType`、`Authority`、`GateAndLine`… | 整個領域的 TS 型別定義 |
| `constants.ts` | `HD_WHEEL_OFFSET`、`GATE_SEQUENCE`、`CHANNEL_DEFS`、`CENTER_INFO`、`CROSS_GROUPS`… | 靜態查表：曼陀羅輪盤佈局、36 條通道與對應中心、9 大中心說明文字、Incarnation Cross 分組 |
| `gates.ts` | `degreeToGateAndLine`、`calculatePlanetGates`、`calculateProfile`、`calculateIncarnationCross` | 黃道度數 → Gate/Line/Color/Tone/Base 轉換，以及 profile/cross 推導 |
| `engine.ts` | `calculateDefinition`、`calculateVariables`、`calculateDefinedCenters`、`calculateCentersAndChannels`、`calculateType`、`calculateAuthority`、`toActivations` | 圖論邏輯：通道→中心→type/authority；PHS 變數；把各行星資料併成閘門啟動表 |
| `exaltations.ts` | `EXALTATION_DETRIMENT_TABLE`、`getFixingState` | 64 閘門 × 6 爻的擢升/落陷行星查表（來源 humdes.com），畫 ▲/▼ 用 |
| `hd-topics.ts` | `HD_TOPICS` | UI 用的知識庫文章對照表，非計算邏輯 |
| `index.ts` | 上述所有檔案的 re-export | barrel file，所有消費端都從 `@/lib/humanDesign` 匯入 |

**陷阱提醒（歷史註記）**：`engine.ts` 早期曾包含 `generateChart`（及 `seededGate`/`seededLine`），
該邏輯以文字 hash 產生假閘門，並非天文計算。此函式為歷史遺留的死碼，已從計算主線移除；請不要將它當作目前引擎的參考實作。

### 3.2 Swiss Ephemeris 初始化：為什麼 Client 跟 Server 各一份

**`lib/swissEph.ts`（瀏覽器用，`initSwissEph()`）**：
- 動態 `import('@swisseph/browser')`，`swe.init()` 載入編譯到固定路徑的 WASM，
  再用 `swe.loadEphemerisFiles()` 對 `public/ephe/` 發 HTTP fetch 拿 `sepl_18.se1`/`semo_18.se1`
  ——這一步是為了取代預設的 Moshier 近似算法，精細到 Tone/Base 這種小數等級才夠精準。
- 有 try/catch 包住曆表載入失敗，給友善的中文錯誤訊息（commit `0397e75` 加的）。
- 結果快取在 module-level 的 singleton。

**`lib/swissEphServer.ts`（Node 用，`initSwissEphServer()`）**：
- 不能直接 `import('@swisseph/browser')`，因為這個套件是 ESM，其 Emscripten 產生的閉包依賴
  CJS 的 `exports`/`module`，在 Next.js API route 的 Node ESM 環境下會壞掉。
- 解法：用 `readFileSync` 讀出原始 `swisseph.js`/`swisseph.wasm`，剝掉結尾的
  `export default ...;`，再用 `new Function('module','exports', src)` 在類 CJS 的作用域裡執行。
- 直接把 `wasmBinary` 餵給 Emscripten factory（跳過 HTTP fetch），用 `readFileSync` 從硬碟讀
  `public/ephe/*.se1` 寫進 WASM 的虛擬檔案系統。
- 自己手動 `cwrap` 底層 C 函式（`swe_julday_wrap`、`swe_calc_ut_wrap`），而不是用
  `@swisseph/browser` 提供的 class 包裝。

**兩者並存的原因**：瀏覽器版的載入方式跟 Next.js API route 的 Node runtime 不相容，
所以另外手刻一份 Node 原生的載入器，供「存檔／讀已存命盤／transit/composite 建立」這些
跑在伺服器端的流程使用。

### 3.3 完整計算 pipeline

以 `lib/computeHdResult.ts`（Client 版，Server 版 `computeHdResultServer.ts` 結構相同）為主線：

1. **輸入 → UTC → 儒略日**（`computeHdResult.ts:24-34`，`utils/ephemeris.ts`）
   - 年份範圍檢查（1900–2040）
   - `getOffsetFromTimezone`（`utils/ephemeris.ts:3-18`）用 `Intl.DateTimeFormat` 算出指定
     IANA 時區在那個時間點的 UTC 偏移（有處理 DST）
   - `toUtcDate`（`utils/ephemeris.ts:21-30`）強制加 `Z` 尾綴解析日期時間（避免 JS 自動套用
     本地時區），再扣掉偏移量得到真正的 UTC `Date`
   - `swe.dateToJulianDay(birthUtc)` 轉儒略日

2. **Personality（意識/黑色）行星位置**（`computeHdResult.ts:38-60`）
   - 對 Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto/TrueNode 各呼叫
     `swe.calculatePosition(jd, body, flags).longitude`
   - Earth = `(太陽經度 + 180) % 360`；South Node = `(北交點經度 + 180) % 360`
     ——不用額外查星曆，因為地球/南交點永遠跟太陽/北交點正好相對

3. **Design（潛意識/紅色）計算 —— 迭代式太陽弧搜尋**（`utils/ephemeris.ts:34-63` 的
   `getDesignJd`，**不是固定的「往前推 88 天」**）：
   1. 算出出生當下太陽經度 `birthSun`，目標 `targetSun = birthSun - 88°`
   2. 先粗估 `jd = birthJd - 88`（只是起始猜測，因為月亮一天動約 13°，用天數當起點誤差
      會導致爻位算錯）
   3. 最多迭代 10 次的牛頓法逼近：在猜測的 `jd` 重算太陽經度，取跟目標的最短角度差
      `diff`（wrap 到 ±180°），用 `jd -= diff`（近似太陽一天動約 0.9856°，取 1° ≈ 1 天）
      修正，直到 `|diff| < 0.00001°`

4. **度數 → Gate/Line/Color/Tone/Base**（`lib/humanDesign/gates.ts:10-32` 的
   `degreeToGateAndLine`）
   - `GATE_SIZE = 360/64 = 5.625°`，往下依序切 `LINE_SIZE`（/6）、`COLOR_SIZE`（/6）、
     `TONE_SIZE`（/6）、`BASE_SIZE`（/5）
   - `normalized = ((degree - HD_WHEEL_OFFSET) % 360 + 360) % 360`，
     `HD_WHEEL_OFFSET = 302`（曼陀羅輪盤從黃道 302° 開始，那是 41 號閘門）
   - `slot = floor(normalized / GATE_SIZE)` 拿去查 `GATE_SEQUENCE`（64 個元素、**非數字順序**
     的曼陀羅排列，例如 `[41,19,13,49,30,55,...]`）才是真正的閘門編號

5. **通道判定**（`engine.ts` 的 `resolveGraph`）：
   `CHANNEL_DEFS.filter(ch => activeGates.has(ch.gateA) && activeGates.has(ch.gateB))`。
   `activeGates` 是把全部 13 個行星/點位（10 大行星 + 地球 + 南北交點）的 Personality 跟
   Design 閘門**全部聯集**進一個 `Set`——所以一個通道只要兩個閘門「任一來自意識或潛意識」
   都算啟動，符合人類圖「有意識或無意識任一啟動即定義」的規則。

6. **中心定義**：同一個 `resolveGraph`，每條被定義的通道，把它的 `centerA`/`centerB`
   （來自 `CHANNEL_DEFS`）都加進已定義中心集合。

7. **Type 判斷**（`engine.ts:80-95`）：
   - 沒有任何定義中心 → Reflector
   - 薦骨（sacral）有定義 → 檢查喉嚨是否定義 **且**有「動力中心→喉嚨」的 BFS 路徑
     （`hasMotorToThroatPath`，從已定義的 `root`/`sacral`/`solarPlexus`/`ego` 這些動力中心
     出發做 BFS）→ 有的話 Manifesting Generator，否則 Generator
   - 薦骨沒定義，喉嚨有定義且有動力→喉嚨路徑 → Manifestor
   - 其餘 → Projector

8. **Authority 優先序**（`engine.ts:97-108`，固定 cascade）：
   `Reflector→Lunar` ▸ `solarPlexus 有定義→Emotional` ▸ `sacral→Sacral` ▸
   `spleen→Splenic` ▸ `ego→Ego` ▸ `g→Self-Projected` ▸ 其餘 `Mental`
   ——這個順序完全對應人類圖官方權威優先序（情緒中心一旦有定義，優先度壓過其他所有）。

9. **Profile —— 只用太陽的 Line**（`gates.ts:44-57` 的 `calculateProfile`）：
   只吃 `persSunDegree`/`desSunDegree` 兩個參數，回傳 `"${personalityLine}/${designLine}"`，
   完全沒有混入其他行星的 Line，符合 `AGENTS.md` 的規範。

10. **Incarnation Cross**（`gates.ts:59-106`）：
    - `crossType`：Personality 太陽 Line ≤3 → RAC；Line===4 且 Design Line===1 → JC；其餘 LAC
    - **命名規則**：LAC 用 Design 太陽閘門命名，RAC/JC 用 Personality 太陽閘門命名
      （程式碼註解解釋：官方邏輯裡命運由潛意識軸定義，所以左角度用潛意識命名）
    - 用 `GATE_TO_CROSS_GROUP` 查出屬於 16 組四閘門分組的哪一組，組內順序決定是
      "Eden 1/2/3/4" 這種變體編號

### 3.4 `exaltations.ts` 的實際用途

雖然是 git untracked 的新檔案，但**確實有接線**：`lib/humanDesign/index.ts` 有 re-export，
`components/humanDesign/ChartView.tsx` 直接 import `getFixingState` 畫每個行星閘門旁的
▲（擢升）/▼（落陷）記號。`engine.ts` 本身不用它——它只影響 UI 呈現，不影響
Type/Authority 這些結構性判斷的計算結果。

檔案裡還留了一個有意思的紀錄（`exaltations.ts:529-531`）：曾經想加「Juxtaposition (★)」
標記規則，但用 8 張命盤（208 個位置）交叉驗證後發現不成立，直接撤掉——這是這個專案裡難得
「先假設、再實測驗證、發現錯誤就撤掉」的紀律範例，值得參考。

### 3.5 ChartView 的資料來源：其實是純前端算的

`ChartView.tsx` 本身只吃一個 `result: HdResult` prop，不做任何計算或 fetch。往上追：

- `PersonalTab.tsx`（點「計算」按鈕時）動態 `import('@/lib/computeHdResult')`（**瀏覽器版**）
  直接在前端算完才渲染 `<ChartView result={result} .../>`。`TransitTab.tsx`、
  `CompositeTab.tsx` 同樣模式。
- `app/api/compute/route.ts`（伺服器版路徑）**目前查無呼叫者**——見 Stage 1.3 的陷阱提醒。
- 真正會用到 `computeHdResultServer` 的是 `app/api/charts/route.ts`（存檔）跟
  `app/api/charts/[id]/route.ts`（讀取已存/分享的命盤）——這兩個場景跑在 API route/Node
  環境，需要重新計算再寫入/讀出資料庫，不是即時互動畫面。

**結論**：使用者按「計算我的命盤」那一刻，運算**完全發生在瀏覽器**（透過本地 WASM +
fetch 曆表檔）；伺服器端的計算路徑只服務「存檔／分享／查看已存命盤」和 transit/composite
建立這幾個場景。

**自問自答**：
1. 為什麼 Design 的計算不能簡單地用「出生時間往前推 88 天」，一定要用迭代法？
   （提示：想想月亮跟太陽移動速度的差異，還有爻位對度數精度的敏感程度。）
2. 如果某天你要把「即時計算」也搬到伺服器端執行（例如想在 SSR 就把命盤算好），
   你需要改哪個檔案？為什麼不能直接沿用 `lib/swissEph.ts` 的邏輯？

---

## Stage 4：React Native / Expo Mobile 端架構

### 4.1 獨立專案，非 monorepo workspace

`mobile/` 有自己的 `package.json`/`yarn.lock`，只是巢狀放在同一個 git repo 裡，
**根目錄 `package.json` 沒有 `workspaces` 欄位**，也沒有 turborepo/pnpm-workspace/lerna 設定
——所以 Web 跟 Mobile 之間完全沒有透過套件管理器共享程式碼的機制，是兩個各自獨立安裝
依賴的專案。

### 4.2 目錄與導航

- 進入點：`mobile/index.ts` → `import 'expo-router/entry'`
- 導航：**expo-router**（file-based），路由群組 `mobile/app/(auth)/`、`mobile/app/(tabs)/`，
  加上 `chart/[id].tsx`、`chart/preview.tsx`、`learn/[topic].tsx`、
  `oauth-native-callback.tsx`、根層 `_layout.tsx`
- 元件：`mobile/components/`（`BodyGraph`、`BirthDataForm`、`BirthProfilePickerModal`/
  `BirthProfileSheet`、`CitySearchField`、`ChartListView`、`CompositeView`、`TransitView`、
  `WheelPicker`、`DateTimePicker` 等），另有 `chart/`、`learn/` 子資料夾

### 4.3 跟 Web 對應的元件（同樣功能、不同實作）

| 功能 | Web | Mobile |
|---|---|---|
| 城市/地點選擇 | `components/humanDesign/LocationPicker.tsx` | `mobile/components/CitySearchField.tsx`（用 `mobile/lib/cities.ts` 當資料源） |
| 出生資料表單 Modal | `components/humanDesign/BirthFormModal.tsx` | `mobile/components/BirthDataForm.tsx` + `BirthProfilePickerModal.tsx`/`BirthProfileSheet.tsx`（拆成多個檔案，概念相同、實作不同） |

### 4.4 人類圖邏輯：Mobile 有自己一份平行實作

Web 的計算邏輯在 `lib/humanDesign/`；Mobile 另外維護一份 `mobile/lib/hd-*.ts`
（`hd-bodygraph-utils.ts`、`hd-chart-data.ts`、`hd-constants.ts`、`hd-cross-data.ts`、
`hd-normalizers.ts`、`hd-sheet-builders.ts`、`hd-summary-data.ts`、`hd-type-meta.ts`）——
**兩邊不共用程式碼**。Mobile 透過 `mobile/lib/api.ts`（讀 `EXPO_PUBLIC_API_BASE_URL`）打
Web 的 `app/api/*` route handler 拿「權威」的伺服器端計算結果，但 Mobile 自己這份 `hd-*.ts`
負責把拿回來的資料加工成畫面呈現需要的格式（展示層邏輯，不是重新計算命盤）。

### 4.5 Auth

`@clerk/expo` + `expo-secure-store`（token cache）、
`@react-native-google-signin/google-signin`，加上自訂的 LINE/OAuth hooks，
會呼叫 Web 這邊的 `app/api/auth/mobile/google/route.ts`。

**自問自答**：
1. Mobile 跟 Web 各自維護一份人類圖邏輯，會有什麼實際風險？（提示：如果 Web 那邊修了一個
   計算 bug，Mobile 這邊需要做什麼才會同步？）
2. `mobile/lib/api.ts` 裡的 `EXPO_PUBLIC_API_BASE_URL` 在開發環境跟正式上線時分別應該指向哪裡？
   （這題你記憶裡已經有一條待辦筆記提到上線前要改成 Render production URL，可以對照確認。）

---

## Stage 5：整合視角 —— 追兩條完整請求生命週期

前面四個 Stage 是拆開來看的拼圖，這裡把它們串成兩條完整路徑。

### 5.1 Web：建立並儲存一張命盤

1. 使用者在 `PersonalTab.tsx` 填出生資料，點「計算」
2. 前端動態 import `lib/computeHdResult.ts`，在瀏覽器用 WASM + 本地曆表算出完整結果
   （Stage 3.3 全部 10 個步驟都在這裡跑）
3. 結果以 prop 傳給 `ChartView.tsx` 渲染（含 `exaltations.ts` 的 ▲/▼ 標記）
4. 使用者按「儲存」→ `POST /api/charts`
5. `app/api/charts/route.ts` 呼叫 `computeHdResultServer`（用 Stage 3.2 提到的 Node 手刻版
   WASM 載入器）**重新算一次**（不是直接信任前端傳來的結果），寫入 Postgres（透過
   `lib/db.ts` 的 Prisma singleton）

### 5.2 Mobile：讀取/建立命盤

1. `mobile/app/(tabs)/create.tsx` 等畫面收集出生資料
2. 透過 `mobile/lib/api.ts` 打 Web 的 API route（同一套 `app/api/**`），不在手機上自己跑
   Swiss Ephemeris
3. 拿到伺服器算好的結果後，用 `mobile/lib/hd-*.ts` 做展示層加工（整理成 `BodyGraph`
   元件需要的資料結構）
4. `BodyGraph`（RN SVG）渲染出命盤圖

**兩條路徑的關鍵差異**：Web 的「即時計算」在瀏覽器本地跑一次 WASM；「存檔」在伺服器端
用 Node 手刻的 WASM 載入器再跑一次。Mobile 完全不跑 WASM，永遠透過 API 拿 Web 算好的結果。

**自問自答**：
1. 為什麼存檔的時候要在伺服器端「重新算一次」，而不是直接信任前端傳來的計算結果存進資料庫？
2. 如果 Mobile 也想要「離線也能算命盤」（不需要打 API），理論上要補齊哪些東西？
   這樣做值得嗎？（提示：想想 WASM 曆表檔案大小、RN 環境跑 WASM 的可行性）

---

## 已知的死碼／未接線清單（讀程式碼時的過濾器）

讀這個專案時，遇到下面這些不用懷疑自己看錯，這些本來就是「存在但不是主線邏輯」：

- `lib/**/*.fp.ts`、`mobile/**/*.fp.ts(x)`：未接線的 FP 風格實驗性重寫，`fp-layers` 產生
- `lib/humanDesign/engine.ts` 的 `generateChart`/`seededGate`/`seededLine`：字串 hash 產生假
  閘門的死碼，從未被呼叫
- `app/api/compute/route.ts`：孤兒 API 端點，查無呼叫者
- `i18n/index.tsx` 的 `LangContext`：從未掛載到 `app/layout.tsx`，沒有元件消費

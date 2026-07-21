# 技術債清單

> 2026-07-21 全專案掃描結果（web + mobile）。之後每次處理完一項就把 checkbox 打勾並補上處理日期/commit，
> 之後新發現的技術債也直接加進對應區塊，讓這份清單能跨對話持續追蹤。
>
> **2026-07-21 Web 段驗證方式說明**：所有項目都跑過 `tsc --noEmit`、`eslint`、`next build`（production build 成功）。
> `DetailDrawer.tsx` 的 dynamic import 額外用 build 產物（`react-loadable-manifest.json`）確認 `hd-cross-data`
> 被拆進獨立 chunk。**但 `AccountClient.tsx` 的 react-query 遷移沒有機會在瀏覽器裡實際登入操作驗證**
> （這個環境沒有 Clerk 登入憑證，`/account` 頁面進不去；直接查 DB 也被 auto mode classifier 擋下），
> 只做到型別/建置層級的驗證，圖表清單/通知的讀取、改名、刪除等互動行為請實際登入測過一輪再放心用。

## Web（Next.js）

### High
- [x] **重複的 Authority 判斷邏輯**（2026-07-21）— 刪除未使用的死碼 `deriveAuthority`（`lib/humanDesign/engine.ts`），`calculateAuthority` 是唯一來源。
- [x] **Client/Server 計算流程重複**（2026-07-21）— 抽成共用的 `lib/computeHdResultCore.ts`（`buildHdResult`），星體常數統一用 `@swisseph/core` 的 `Planet`/`LunarPoint` enum，`computeHdResult.ts`／`computeHdResultServer.ts` 都改成呼叫同一份、只各自負責初始化 swe instance。
- [x] **大型靜態資料被打進 client bundle**（2026-07-21）— `hd-cross-data.ts`（166KB）改在 `DetailDrawer.tsx` 用 `import('./hd-cross-data')` 動態載入，只在使用者打開「交叉」詳情時才抓取；已用 production build 確認它被拆進獨立的 webpack chunk，不在初始頁面 bundle 內。`hd-chart-data.ts` 是 `BodyGraph`/`ChartView` 畫圖表本身就需要的資料，任何看圖表的使用者都會用到，不算是「詳情才需要」的資料，維持現狀。

### Medium
- [x] **`app/account/AccountClient.tsx` 繞過 react-query**（2026-07-21）— 圖表清單/通知清單的 fetch 與 CRUD 抽成 `lib/useCharts.ts`、`lib/useNotifications.ts`（比照 `useBirthProfiles.ts` 的 `useQuery`/`useMutation` 寫法），檔案從 1098 行降到 953 行。**子元件拆分（圖表列表/通知/刪除帳號）尚未做**，風險與效益需要再評估，先保留原狀。
- [x] **`app/api/stats/route.ts` 缺 try/catch**（2026-07-21）— 補上 try/catch，錯誤格式比照其他 route（`{ error: '伺服器錯誤' }` + 500）。
- [x] **`fp-layers` devDependency 孤兒依賴**（2026-07-21）— 已確認全專案零引用，使用者選擇整組移除：`yarn remove` 套件、刪除本機殘留的 `fp-report.html`、清掉 `.gitignore` 對應規則。
- [x] **根目錄工作筆記檔案混雜**（2026-07-21）— 「了解概念了...Exaltation _ Detriment 是根.md」搬到 `docs/Exaltation-Detriment 資料需求筆記.md`。

### Low
- [ ] **完全沒有測試基礎設施** — 對於行星計算、中心定義這類需要精確性的邏輯，目前完全靠肉眼檢查，沒有自動化覆蓋。
- [x] **`lib/humanDesign/exaltations.ts` 資料來源未驗證**（2026-07-21 確認已過時）— 檔案已不存在；Exaltation/Detriment 標記功能已在更早的 commit（9c2e168「chore: 移除未完成的人類圖 Exaltation/Detriment 標記功能」）整個移除，全專案已無 `exaltations`/`Exaltation` 引用，此項目連同該功能一起消失，不用再處理。

---

## Mobile（Expo/React Native, `mobile/`）

### High
- [ ] **`Pressable` 包住 `ScrollView`，重犯已知手勢問題** — `mobile/components/BirthProfilePickerModal.tsx:16` 的 `Pressable` 直接包住 `ScrollView`，是先前在 `DetailBottomSheet.tsx` 已經修正過的「touchable 搶走 iOS 捲動手勢」同一類問題，這裡沒套用已知修法（背景 Pressable 與卡片要是手足關係，不是父子，見全域 CLAUDE.md 的 2026-07-13 追記）。
  → 修法：比照 `DetailBottomSheet.tsx:59-60` 的手足結構重寫。
- [ ] **未追蹤的大型二進位檔案** — `mobile/bugreport-sdk_gphone16k_arm64-*.zip`（5.3MB）不在 `mobile/.gitignore` 規則內，一次 `git add -A` 就會被永久提交進歷史。
  → 修法：加進 `.gitignore` 或直接刪除本機檔案。
- [ ] **無測試/lint 設定** — `mobile/package.json` 完全沒有測試或 lint 腳本。

### Medium
- [ ] **顯示邏輯與 web 端重複實作** — `mobile/lib/hd-type-meta.ts` 重複了 web 端 `lib/humanDesign/constants.ts` 已有的中文標籤資料；mobile 端 `hd-*.ts` 系列（`hd-cross-data.ts`、`hd-chart-data.ts`、`hd-summary-data.ts`、`hd-sheet-builders.ts`，共約 2150 行）整體都在重新實作 web 已有的顯示邏輯，而非共用一份。
  → 修法：評估抽成 shared package 或至少共用資料來源，避免兩邊各自維護、容易分歧（尤其命理正確性要求高）。
- [ ] **舊格式判斷邏輯散落 4 處** — `mobile/app/chart/[id].tsx` 中 pipe 分隔的 legacy composite 格式偵測（`birthDate?.includes('|')`）在約 93、150、202、241 行各自出現一次，沒有抽成 helper。
  → 修法：抽成單一函式集中判斷。
- [ ] **API 層缺重試機制、timeout 一體適用** — `mobile/lib/api.ts:74` 的共用 `request()` 沒有重試邏輯，且所有 endpoint（含較慢的星曆計算 endpoint）共用固定 10 秒 timeout。
  → 修法：依 endpoint 類型調整 timeout，考慮加輕量重試（例如網路暫時性錯誤）。
- [ ] **`mobile/app/chart/[id].tsx` 是 723 行的巨型元件** — 混雜 fetch、legacy 格式遷移、三種圖表（個人/合圖/流日）渲染邏輯，第 203 行註解承認過去曾誤判圖表類型的 bug。
  → 修法：拆成 fetch hook + 各圖表類型的獨立元件。

### Low
- [ ] **`ErrorBoundary` 只掛在 root layout** — `mobile/app/_layout.tsx:68`，任何畫面層級的 crash 會讓整個 app 白屏，而非只降級單一畫面。
  → 修法：評估在關鍵畫面（如圖表詳情頁）各自包一層區域性 ErrorBoundary。

---

## 已確認沒問題（掃描時順帶排除，不用處理）
- Web/Mobile 型別安全良好：全專案無 `any`、無 `@ts-ignore`/`@ts-expect-error`，`tsconfig.json` 為 `strict: true`。
- Mobile `.gitignore` 對 keystore（`*.jks`）、`.DS_Store`、`.env*.local` 處理正確。
- `mobile/assets/store/icon-512.png` 是合法的新 store 上架素材，非垃圾檔。
- `EXPO_PUBLIC_API_BASE_URL` 已經是正式環境網址（`https://selfmap.tw`），舊記憶裡「上線前要改 production URL」的待辦已過時。

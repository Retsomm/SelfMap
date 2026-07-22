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
- [x] **`Pressable` 包住 `ScrollView`，重犯已知手勢問題**（2026-07-21，待實機驗證）— `mobile/components/BirthProfilePickerModal.tsx` 改成 `DetailBottomSheet.tsx` 的手足結構：`backdrop`（`flex:1` 的 `Pressable`，無子元素）與 `sheet`（純 `View`，內含 `ScrollView`）在 `Modal` 底下是同層手足，靠 column flex 排版天然不重疊，不再有任何 Pressable 包住 ScrollView。`tsc --noEmit` 確認沒有新增型別錯誤（`app/_layout.tsx` 既有的一個錯誤跟這次改動無關，在 stash 前就存在）。**這是 iOS 手勢層級的修正，這個環境無法啟動 app 實機測試，請在裝置上確認清單真的能捲動、點卡片空白處不會誤觸關閉背景。**
- [x] **未追蹤的大型二進位檔案**（2026-07-21）— 在 `mobile/.gitignore` 加入 `bugreport-*.zip` 規則，避免以後 `git add -A` 誤把此類 adb bugreport 檔案提交進歷史。**本機殘留的 `mobile/bugreport-sdk_gphone16k_arm64-*.zip` 沒有直接刪除**（不確定是否還在用來排查問題），需要的話請自行刪除或告知我刪。
- [ ] **無測試/lint 設定** — `mobile/package.json` 完全沒有測試或 lint 腳本。

### Medium
- [x] **顯示邏輯與 web 端重複實作（大宗資料檔部分，2026-07-22）** — 逐行 diff 確認 `hd-cross-data.ts`（940 行輪迴交叉長文案）、`hd-summary-data.ts`（347 行類型/人生角色/權威說明）在 web（原 `components/humanDesign/`）與 mobile（原 `mobile/lib/`）兩邊逐字相同；`hd-chart-data.ts` 除了 web 多出 13 行 mobile 沒用到的 `LEGEND_ITEMS` 圖例資料外也逐字相同。三份檔案搬到新的 repo-root `shared/humanDesign/`，web 用既有 `@/*` alias（`@/shared/humanDesign/...`）匯入，mobile 新增 `@shared/*` alias。
  **共用機制的坑（供之後在 shared/ 加新檔案時參考）**：這個 repo 不是 yarn workspaces monorepo，web 在 root、mobile 在 `mobile/` 子目錄各自獨立 package.json。原本想用 Metro 的 `watchFolders` 指向 repo root 或 `shared/`，讓 Metro 直接讀到 `mobile/` 以外的檔案——**實測踩到 Metro 的 bug**：用 `watchman` 直接查詢可以正常列出 `shared/humanDesign/` 底下的檔案，但 Metro 用同一組 `roots`（`projectRoot` + `watchFolders`，兩者有巢狀關係）建立的 file-map 就是解析不到，一路丟 `Unable to resolve module` → 換成手動 `resolver.resolveRequest` 攔截也一路查到 `Failed to get the SHA-1 for: ... (file not watched)`，換過「只 watch shared/」「watch 整個 repo root」「先裝 watchman（原本沒裝）」都一樣。**最後改用 symlink 解決**：`mobile/shared -> ../shared`（symlink 落在 `mobile/` 這個 projectRoot 裡面，Metro 原生就認得，不用碰 `watchFolders`），`mobile/tsconfig.json` 的 `@shared/*` 指到 `./shared/*`，不需要任何 `metro.config.js`（試過保留一份只呼叫 `getDefaultConfig` 的 no-op 版本，bundle 輸出 hash 跟完全不放這個檔案時逐位元組相同，所以直接沒建立這個檔案）。
  **驗證範圍**：`tsc --noEmit`（web + mobile）、`next build --webpack`（production build 成功，`DetailDrawer.tsx` 對 `hd-cross-data` 的 dynamic import 確認仍會被拆進獨立 chunk）、`npx expo export --platform ios` 與 `--platform android`（非互動式打包成功，1426 個模組全部解析成功，反編譯後的 bundle 內容含有 `HD_CROSS_CONTENT`/`CENTERS_GEOM` 等來自 shared 檔案的識別字，確認真的打包進去而不是空模組）。**這個環境沒有模擬器/實機，`expo export` 只能確認打包能成功、資料有進去，無法確認 `expo start` 開發模式（含 Fast Refresh）、實際畫面渲染、以及 iOS/Android 兩個平台的實機/模擬器行為——這幾項麻煩你實際跑一次確認。**
  **保留原狀（未動）**：`mobile/lib/hd-type-meta.ts` 與 `lib/humanDesign/constants.ts` 之間的 `TYPE_LABELS`／`STRATEGY_MAP`／`SIGNATURE_MAP` 也是逐字重複（各自幾十行），但 mobile 端資料結構跟 key 命名方式不同（例如 Authority 提示 mobile 用中文名稱當 key、web 用英文 enum 當 key），不是單純搬檔案就能做完的機械式重構，這次沒有動，需要另外排時間評估怎麼統一資料結構。`hd-sheet-builders.ts`（mobile 專屬的 UI 組裝邏輯，非資料）維持原狀。
- [x] **舊格式判斷邏輯散落多處**（2026-07-21）— 在 `mobile/lib/api.ts` 加入共用 helper `isLegacyPipeComposite()` / `isCompositeChart()`，取代 `mobile/app/chart/[id].tsx`（4 處）與 `mobile/components/ChartListView.tsx`（1 處）裡各自重複的 `birthDate?.includes('|')` / `type === '合圖'` 判斷。
- [x] **API 層缺重試機制、timeout 一體適用**（2026-07-21）— `mobile/lib/api.ts` 的 `request()` 加上 `timeoutMs`／`retries` 選項：星曆計算類 endpoint（個人圖／合圖／流日的算圖與 preview）timeout 從 10 秒延長為 20 秒；只對讀取／preview／idempotent 的 PATCH、DELETE 端點加上 1 次輕量重試（只重試逾時或網路層失敗，不重試已收到的 HTTP 錯誤回應），會建立新資料的 create 類 endpoint（`createChart`/`createCompositeChart`/`createTransitChart`/`createBirthProfile`/`importBirthProfiles`）跟帳號刪除刻意不加重試，避免逾時後重送造成重複建立或非預期的重試行為。
- [x] **`mobile/app/chart/[id].tsx` 是 723 行的巨型元件**（2026-07-21）— 拆成三部分：`mobile/lib/useChartDetail.ts`（fetch/自動補算合圖流日的資料 hook）、`mobile/components/chart/PersonalChartDetails.tsx`（個人圖專屬的類型/設計/九大中心/通道/行星/激活閘門/輪迴交叉/四箭頭區塊）、原檔案降到 443 行，只保留 BodyGraph／出生資訊／流日／合圖區塊組裝與下載/複製按鈕。純搬移程式碼，`activations`/`definedCenterIds` 等命理計算邏輯本身沒有改動，`tsc --noEmit` 確認無新增型別錯誤。

### Low
- [x] **`ErrorBoundary` 只掛在 root layout**（2026-07-21）— 在 `mobile/app/chart/[id].tsx` 與 `mobile/app/chart/preview.tsx` 這兩個複雜度最高、資料流最容易因為邊界資料（舊格式合圖/流日、缺欄位）而在 render 階段丟例外的畫面，各自包一層區域性 `ErrorBoundary`（把原本的畫面本體改成內部的 `...Content` 元件，預設匯出的元件只負責包 `ErrorBoundary`），單一畫面 crash 不會再讓整個 app 白屏。其餘畫面（`profile.tsx`、`create.tsx` 等）風險較低，暫不處理。

---

## 已確認沒問題（掃描時順帶排除，不用處理）
- Web/Mobile 型別安全良好：全專案無 `any`、無 `@ts-ignore`/`@ts-expect-error`，`tsconfig.json` 為 `strict: true`。
- Mobile `.gitignore` 對 keystore（`*.jks`）、`.DS_Store`、`.env*.local` 處理正確。
- `mobile/assets/store/icon-512.png` 是合法的新 store 上架素材，非垃圾檔。
- `EXPO_PUBLIC_API_BASE_URL` 已經是正式環境網址（`https://selfmap.tw`），舊記憶裡「上線前要改 production URL」的待辦已過時。

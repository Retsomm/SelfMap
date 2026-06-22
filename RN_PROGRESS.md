# SelfMap RN 重構進度

> 勾選 = 功能已實作 **且** 實機測試通過

---

## 第一階段：核心功能（MVP）

### 認證
- [x] Clerk OAuth 登入（sign-in 頁）
- [x] 登出功能
- [x] 未登入自動導向 sign-in

### 圖表列表（我的圖表）
- [x] 取得並顯示圖表列表（`GET /api/charts`）
- [x] 空狀態提示
- [x] 下拉更新（pull to refresh）
- [x] 圖表卡片 UI 優化（含 Type / Profile Badge）
- [x] 圖表重新命名
- [x] 刪除圖表（含確認 Modal）

### 建立圖表
- [x] 出生年月日選擇（Picker）
- [x] 出生時間選擇（Picker）
- [x] 城市搜尋（CitySearchField 元件）
- [x] 時區自動帶入
- [x] 圖表名稱（選填）
- [x] 送出並導向圖表詳情頁（`POST /api/charts`）— server 端自動計算，mobile 只送出生資料；返回鍵正常顯示
- [x] 表單驗證錯誤提示優化（改用 inline 錯誤提示）

### 圖表詳情頁
- [x] 出生資訊卡（日期、時間、城市）
- [x] 類型、策略、簽名
- [x] 內在權威
- [x] 人生角色（輪廓）
- [x] 定義
- [x] 九大中心（定義/開放狀態）
- [x] 定義通道列表
- [x] 激活閘門格子（1–64）
- [x] Body Graph SVG 視覺化（react-native-svg，含中心/通道/閘門/輪廓/臉）
- [x] 下方卡片可點擊觸發彈窗（類型、權威、角色、定義、中心、通道、閘門）
- [x] 圖表詳情頁改用 `GET /api/charts/[id]`（單筆 API 已新增）

---

## 第二階段：延伸功能

### 流日分析（Transit）
- [x] 當前行星位置計算（`GET /api/transit`，server-side ephemeris）
- [x] 流日 vs 個人圖對比顯示（`POST /api/transit/impact`）
- [x] 流日 Tab 頁面 UI（三層影響分析：空白中心激活、全新通道、通道補全）

### 合圖分析（Composite）
- [x] 兩人資料輸入（圖表 Picker Modal）
- [x] 電磁連結、陪伴、妥協、支配關係計算（`POST /api/composite`）
- [x] 合圖結果頁面 UI（整合主題、角色共鳴、連結動態分組）

### 詳細解讀
- [x] DetailBottomSheet：中心、閘門、通道、類型、權威、Profile、定義（點擊下方卡片項目觸發）

---

## 第三階段：補充功能

### 帳號設定
- [x] 用戶名編輯（`firstName` 更新）
- [x] 頭像上傳（expo-image-picker@56.0.18，base64 → Clerk setProfileImage）
- [x] 已連結 OAuth 帳號顯示（filter verified + 僅顯示支援的 provider）

### 教育內容
- [x] 9 大主題靜態內容頁（類型、中心、權威…）— `app/(tabs)/learn.tsx` + `app/learn/[topic].tsx`（實機驗證 ✓）
- [x] 閘門 / 通道搜尋篩選 — 通道／閘門主題頁含 TextInput 搜尋（實機驗證 ✓）

### 其他
- [x] 圖表下載為 PDF（`expo-print` + `expo-sharing`，HTML 模板，`mobile/lib/chartPdf.ts`）
- [x] AI 解讀提示詞功能（`generateAiPrompt`，複製到剪貼簿）
- [x] 出生檔案快速填表（BirthProfileManager）— 新增於帳號頁，建立圖表三個 tab（個人/流日/合圖）均支援快速套用，套用後隱藏表單並自動捲至送出按鈕
- [x] 關於頁面 — 獨立 Tab（`app/(tabs)/index.tsx`），含功能介紹、人類圖說明、使用步驟（實機驗證 ✓）

---

## UI / 共用元件

- [x] 統一 Design Token（`mobile/constants/tokens.ts`：Colors、Spacing、Radius）
- [x] 共用 `SectionCard` / `Row` / `Tag` 元件（`components/chart/ChartPrimitives.tsx`）
- [x] 共用 `ScreenHeader` 元件（`components/ScreenHeader.tsx`）
- [x] 共用 `SubTabBar` 元件（`components/SubTabBar.tsx`）
- [x] 共用 `InputModal` 元件（`components/InputModal.tsx`，用於重新命名操作）
- [x] 共用 `StateViews`（`components/StateViews.tsx`：`LoadingView` / `ErrorView`）
- [x] 共用 `BirthProfilePickerModal` 元件（建立圖表三 tab 共用）
- [x] 共用 `AppliedProfileCard` 元件（套用後摘要卡片）
- [x] Bottom Tab Bar 圖示優化（SVG 線條型圖示：菱形/圓加號/書本/人物輪廓）
- [x] Loading / Skeleton 狀態統一（統一使用 `LoadingView` / `ErrorView`）
- [x] 帳號頁整合圖表列表（`ChartListView` 元件）— 帳號 Tab 加外層 SubTabBar（我的圖表 / 個人），圖表列表從 `index.tsx` 抽出為獨立元件（實機驗證 ✓）
- [x] Tab 順序與導覽調整 — 建立圖表移至左一，關於獨立為左二（info 圖示），`index.tsx` 改為關於頁（實機驗證 ✓）
- [x] 錯誤狀態頁（Error Boundary，包裝 root layout）
- [x] 色系統一為網頁端 editorial warm palette（`--paper`/`--ink`/`--crimson`）— `constants/tokens.ts` 全面更新，所有元件同步套用

---

## 已知問題 / 待確認

- [ ] iOS 實機上 Picker 高度與樣式確認
- [ ] Android Picker 行為測試
- [x] Body Graph SVG 套件選擇 → `react-native-svg@15.15.5`（已確認）
- [x] WASM Swiss Ephemeris 是否可在 RN 環境執行（目前 server 端計算）→ **確認 server 端可正常執行**

---

---

## 下一步優先順序

3. ~~**網頁 ↔ APP 出生資料同步**~~ ✅ 已完成
4. **圖表預覽 PDF 強化**（未來可考慮加入 Body Graph SVG 截圖）

---

## 出生資料同步（網頁 ↔ APP）✅ 已實作

> 資料庫為唯一真實來源，所有 CRUD 皆透過 API 進行。

### 架構

| | 儲存位置 | 資料格式 |
|---|---|---|
| 網頁 | PostgreSQL `BirthProfile` 資料表 | `{ date: "YYYY-MM-DD", time: "HH:mm", timezone, location }` |
| APP | 同上（透過 API） | 同上 |

### 實作內容

- **DB Schema** — `prisma/schema.prisma` 新增 `BirthProfile` model，`prisma db push` 已套用
- **API 路由** — `app/api/birth-profiles/route.ts`（GET 列表 / POST 新增/批次匯入）、`app/api/birth-profiles/[id]/route.ts`（PATCH 更新 / DELETE 刪除）
- **網頁 Hook** — `lib/useBirthProfiles.ts` 改用 DB API；首次登入若 Clerk metadata 有舊資料，自動批次匯入（Clerk 舊資料保留作備份）
- **Mobile API** — `mobile/lib/api.ts` 新增 `getBirthProfiles / createBirthProfile / updateBirthProfile / deleteBirthProfile / importBirthProfiles`
- **Mobile 儲存層** — `mobile/lib/birthProfiles.ts` 從 AsyncStorage 改為 DB API；格式統一為 string（`location` 取代 `city`）
- **遷移** — `mobile/lib/birthProfileMigration.ts`（AsyncStorage → DB，一次性，DB 有資料則跳過）
- **啟動觸發** — `mobile/app/_layout.tsx` 登入後自動執行遷移
- **立即同步按鈕** — 帳號頁個人 Tab 出生資料區塊右上角「↻ 同步」，手動強制重新拉取 DB 資料

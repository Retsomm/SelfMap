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
- [ ] 用戶名編輯
- [ ] 頭像上傳
- [ ] 已連結 OAuth 帳號顯示

### 教育內容
- [ ] 9 大主題靜態內容頁（類型、中心、權威…）
- [ ] 閘門 / 通道搜尋篩選

### 其他
- [ ] 圖表下載為圖片（`downloadChart`）
- [ ] AI 解讀提示詞功能
- [ ] 出生檔案快速填表（BirthProfileManager）
- [ ] 關於頁面

---

## UI / 共用元件

- [x] 統一 Design Token（`mobile/constants/tokens.ts`：Colors、Spacing、Radius、CardShadow）
- [ ] 共用 `Card` 元件
- [ ] 共用 `Header` 元件
- [ ] 共用 `ConfirmModal` 元件
- [ ] Bottom Tab Bar 圖示優化
- [ ] Loading / Skeleton 狀態統一
- [ ] 錯誤狀態頁（Error Boundary）
- [ ] 深色模式支援

---

## 已知問題 / 待確認

- [ ] iOS 實機上 Picker 高度與樣式確認
- [ ] Android Picker 行為測試
- [x] Body Graph SVG 套件選擇 → `react-native-svg@15.15.5`（已確認）
- [x] WASM Swiss Ephemeris 是否可在 RN 環境執行（目前 server 端計算）→ **確認 server 端可正常執行**

---

## 修復紀錄

### Server-side compute ESM 衝突修復（2026-06-20）

`POST /api/charts` 呼叫 `computeHdResult` → `initSwissEph`（browser 版）→ `import('@swisseph/browser')` → `exports is not defined` 錯誤。

修法：
1. 建立 `lib/computeHdResultServer.ts`，使用 `initSwissEphServer`（讀 WASM 檔案，繞過 ESM 限制）
2. `utils/ephemeris.ts` 加入 `getOffsetFromTimezone`，移除舊的 browser import
3. `LocationPicker.tsx` 改為從 `utils/ephemeris` re-export，原有呼叫不受影響
4. `app/api/charts/route.ts` 與 `app/api/compute/route.ts` 改用 `computeHdResultServer`

### `POST /api/charts` 本地 dev 環境修復（2026-06-20）

正式環境一直正常，本地跑 dev server 連續踩到三個問題：

1. **webpack 攔截 `require.resolve`**：`_require.resolve('@swisseph/browser')` 被 webpack 當作需要 bundle 的 ESM 套件 → 改用 `resolve(process.cwd(), 'node_modules/@swisseph/browser/dist')` 直接拼路徑繞過。

2. **`swisseph.js` 結尾有 `export default`**：`new Function(src)` 執行環境不是 module scope，`export` 語法不合法 → 讀檔後先 `.replace(/\nexport default \w+;\s*$/, '')` 移除。正式環境 bundler 在 build time 會自動轉換，dev server 不會。

3. **`getOffsetFromTimezone` 在 `'use client'` 檔案裡**：Next.js 把整個 `LocationPicker.tsx` 的 export 都標為 client-only → 將函式移到 `utils/ephemeris.ts`，`LocationPicker` 改 re-export。

---

## 下一步優先順序

1. **實機測試流日 / 合圖功能**
2. **共用 Card / Header / ConfirmModal 元件**（套用 tokens）
3. **Bottom Tab Bar 圖示優化**（加入 `tabBarIcon`）
4. **Loading / Skeleton 狀態統一**

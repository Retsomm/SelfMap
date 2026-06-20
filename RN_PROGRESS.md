# SelfMap RN 重構進度

> 勾選 = 功能已實作 **且** 實機測試通過

---

## 第一階段：核心功能（MVP）

### 認證
- [ ] Clerk OAuth 登入（sign-in 頁）
- [ ] 登出功能
- [ ] 未登入自動導向 sign-in

### 圖表列表（我的圖表）
- [ ] 取得並顯示圖表列表（`GET /api/charts`）
- [ ] 空狀態提示
- [ ] 下拉更新（pull to refresh）
- [ ] 圖表卡片 UI 優化（目前陽春）
- [ ] 圖表重新命名
- [ ] 刪除圖表（含確認 Modal）

### 建立圖表
- [ ] 出生年月日選擇（Picker）
- [ ] 出生時間選擇（Picker）
- [ ] 城市搜尋（LocationSearch 元件）
- [ ] 時區自動帶入
- [ ] 圖表名稱（選填）
- [ ] 送出並導向圖表詳情頁（`POST /api/charts`）
- [ ] 表單驗證錯誤提示優化（目前 Alert）

### 圖表詳情頁
- [ ] 出生資訊卡（日期、時間、城市）
- [ ] 類型、策略、簽名
- [ ] 內在權威
- [ ] 人生角色（輪廓）
- [ ] 定義
- [ ] 九大中心（定義/開放狀態）
- [ ] 定義通道列表
- [ ] 激活閘門格子（1–64）
- [ ] Body Graph SVG 視覺化（react-native-svg，含中心/通道/閘門/輪廓/臉）
- [ ] 點擊中心/閘門/通道/整合迴路 → 底部彈窗詳細解讀（DetailBottomSheet）

---

## 第二階段：延伸功能

### 流日分析（Transit）
- [ ] 當前行星位置計算（`computeTransit`）
- [ ] 流日 vs 個人圖對比顯示
- [ ] 流日 Tab 頁面 UI

### 合圖分析（Composite）
- [ ] 兩人資料輸入
- [ ] 電磁連結、陪伴、妥協、支配關係計算
- [ ] 合圖結果頁面 UI

### 詳細解讀
- [ ] 中心解讀抽屜（點擊 Body Graph 中心觸發）
- [ ] 類型、權威、Profile、定義的詳細文字說明頁

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

- [ ] 統一 Design Token（顏色、字型、間距）
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
- [ ] Body Graph SVG 套件選擇 → `react-native-svg@15.15.4`
- [x] WASM Swiss Ephemeris 是否可在 RN 環境執行（目前 server 端計算）→ **確認 server 端可正常執行**

---

## 修復紀錄

### `POST /api/charts` 本地 dev 環境修復（2026-06-20）

正式環境一直正常，本地跑 dev server 連續踩到三個問題：

1. **webpack 攔截 `require.resolve`**：`_require.resolve('@swisseph/browser')` 被 webpack 當作需要 bundle 的 ESM 套件 → 改用 `resolve(process.cwd(), 'node_modules/@swisseph/browser/dist')` 直接拼路徑繞過。

2. **`swisseph.js` 結尾有 `export default`**：`new Function(src)` 執行環境不是 module scope，`export` 語法不合法 → 讀檔後先 `.replace(/\nexport default \w+;\s*$/, '')` 移除。正式環境 bundler 在 build time 會自動轉換，dev server 不會。

3. **`getOffsetFromTimezone` 在 `'use client'` 檔案裡**：Next.js 把整個 `LocationPicker.tsx` 的 export 都標為 client-only → 將函式移到 `utils/ephemeris.ts`，`LocationPicker` 改 re-export。

# AuraFlow — 能量流動時鐘

一個放在桌上的環境顯示器，每天即時顯示「個人圖 × 當下流日」的人類圖合圖，讓使用者不需要開 App，一眼就能感受今日能量狀態。

---

## 產品定位

- **硬體：** Raspberry Pi + 螢幕，外殼可為木框或鋁框
- **顯示內容：** 人類圖 SVG，雙色區分個人與流日，無文字、無按鈕
- **更新頻率：** 每 30 分鐘自動 fetch 最新合圖（行星閘門最快 2-3 小時變換一次）
- **多人支援：** 同一台裝置可切換多個使用者

---

## SVG 顯示規格

| 元素 | 顯示方式 |
|------|----------|
| 個人閘門／通道 | 黑色 |
| 流日閘門／通道 | 紅色 (#d04830) |
| 因合圖而新定義的中心 | 填色 |
| 未定義中心 | 空白 |

---

## 技術架構（實際實作）

Pi 本身不跑計算，只是一個 Chromium kiosk 瀏覽器，打開 SelfMap 提供的專用顯示頁。

```
Pi (Chromium kiosk)
  ↕ 每 30 分鐘 fetch
SelfMap 後端 GET /api/aura-flow?chartId=xxx
  → 取當下 UTC 時間
  → 計算流日閘門（Swiss Ephemeris）
  → 疊加使用者個人圖
  → 回傳 JSON { activations, combinedCenterIds, computedAt, chartName }
  ← 前端 BodyGraph 元件渲染雙色合圖
```

> 注意：原規劃的 `/api/aura-flow/live-svg` 直接回傳 SVG 字串的方案已改為 JSON + React 元件渲染。
> 若日後需要讓 Pi 用 `<img>` 直接載入 SVG，需另外補 live-svg 端點。

---

## 專案位置（SelfMap 內）

```
app/
  api/
    aura-flow/
      route.ts      ← GET /api/aura-flow?chartId=xxx（回傳 JSON）
  aura-flow/
    page.tsx        ← Pi 全螢幕顯示頁
```

---

## 目前頁面功能（已完成）

- **時鐘：** 左上角即時顯示日期＋時間（台灣格式，每秒更新）
- **BodyGraph：** 全螢幕顯示合圖，黑色個人圖 + 紅色流日，斜紋代表共同激活
- **底部圖例：** 黑 = 個人圖、紅 = 流日、斜紋 = 共同激活 + 最後更新時間
- **30 分鐘輪詢：** 自動重新 fetch 合圖
- **多圖表切換：** 右上角下拉選單（只顯示 personal 類型），單一圖表時只顯示名稱
- **新增個人資料：** 右上角 `+` 按鈕開啟 Modal，欄位：名稱、出生日期 *、出生時間 *、時區（UTC-12 ～ UTC+12 共 25 個選項，預設 UTC+8）

---

## Pi 端設定

Pi 本身只需要：
1. 安裝 Chromium
2. 開機自動執行：
   ```
   chromium-browser --kiosk https://yourdomain.com/aura-flow
   ```
3. 使用者切換：直接在頁面右上角下拉選單操作（或用滑鼠/觸控）

更新 SelfMap 程式碼後，Pi 下次 reload 即自動拿到新版本，無需維護 Pi 端程式碼。

---

## 開發進度

| 階段 | 項目 | 狀態 |
|------|------|------|
| 1 | 後端 API `/api/aura-flow` | ✅ 完成 |
| 2 | 顯示頁 `aura-flow/page.tsx` | ✅ 完成 |
| 3 | 多人切換（頁面內下拉選單） | ✅ 完成（簡化版，非原規劃的手機設定頁） |
| 3 | 手機連 Pi Wi-Fi 獨立設定頁 | ❌ 未做（目前直接在頁面操作已足夠） |
| 4 | 硬體整合（Pi + 螢幕 + kiosk） | ⏳ 待執行（硬體設定，非程式碼） |

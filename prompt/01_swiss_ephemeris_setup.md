先仔細閱讀AGENTS.md檔案

# 01 Swiss Ephemeris 前端設定

## 目的
初始化 Swiss Ephemeris WebAssembly，讓前端可以計算行星位置。

## 完整程式碼

```javascript
import { SwissEphemeris, Planet } from '@swisseph/browser';

let swe = null;

export async function initSwissEph() {
    if (swe) return swe;
    swe = new SwissEphemeris();
    await swe.init();
    console.log('Swiss Ephemeris 初始化完成');
    return swe;
}

// 使用方式
// const sweInstance = await initSwissEph();
```

## 注意事項
- 第一次載入較慢（WASM 下載）
- 建議在專案啟動時提前初始化

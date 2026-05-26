先仔細閱讀AGENTS.md檔案

# 02 行星經度轉閘門與線

## 目的
將黃道經度（0~360）轉換成人類圖的 Gate + Line

## 核心函式

```javascript
export function degreeToGateAndLine(degree) {
    let normalized = ((degree % 360) + 360) % 360;
    
    // 閘門：1~64
    const gate = Math.floor(normalized / 5.625) + 1;
    
    // 線：1~6
    const lineFraction = (normalized % 5.625) / 5.625;
    const line = Math.floor(lineFraction * 6) + 1;
    
    return { 
        gate, 
        line, 
        full: `${gate}.${line}` 
    };
}
```

## 測試範例
```javascript
console.log(degreeToGateAndLine(23.45));  // {gate: xx, line: x, full: "xx.x"}
```

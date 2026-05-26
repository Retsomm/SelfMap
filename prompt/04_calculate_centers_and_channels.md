Read AGENTS.md first and follow it strictly.
# 04 計算能量中心與通道

## 目的
使用完整通道邏輯判斷 9 大中心是否定義

## 完整程式碼

```javascript
const channels = [ /* 36 條通道定義 */ ];

export function calculateDefinedCenters(allGates) {
    const definedCenters = new Set();
    
    for (const ch of channels) {
        if (allGates.has(ch.g1) && allGates.has(ch.g2)) {
            definedCenters.add(ch.c1);
            definedCenters.add(ch.c2);
        }
    }
    return definedCenters;
}
```

## 中心列表
head, ajna, throat, g, ego, emotional, sacral, spleen, root
```

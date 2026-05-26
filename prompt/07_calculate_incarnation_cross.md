Read AGENTS.md first and follow it strictly.
# 07 計算入世十字

## 目的
計算人生主題（Incarnation Cross）

## 計算方式

```javascript
export function calculateIncarnationCross(persSun, persEarth, desSun, desEarth) {
    return {
        crossName: "個人主題之伊甸園4 (1)",
        conscious: `${persSun.full} / ${persEarth.full}`,
        unconscious: `${desSun.full} / ${desEarth.full}`
    };
}
```

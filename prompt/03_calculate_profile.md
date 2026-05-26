Read AGENTS.md first and follow it strictly.
# 03 計算人生角色 Profile

## 目的
計算 1/3、4/6 等人生角色

## 計算方式
- 第一個數字：個性太陽（Personality Sun）的線
- 第二個數字：設計太陽（Design Sun）的線

## 完整函式

```javascript
import { degreeToGateAndLine } from './02_degree_to_gate_and_line.js';

export function calculateProfile(persSunDegree, desSunDegree) {
    const pers = degreeToGateAndLine(persSunDegree);
    const des = degreeToGateAndLine(desSunDegree);
    
    return {
        profile: `${pers.line}/${des.line}`,
        personalitySun: pers,
        designSun: des
    };
}
```

## Profile 常見意義
- 1/3：調查者／殉道者
- 4/6：機會主義者／角色模範
```

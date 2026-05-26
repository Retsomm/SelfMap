先仔細閱讀AGENTS.md檔案

# 08 計算上升點與下降點

## 目的
計算 Ascendant（上升）與 Descendant（下降）

```javascript
// 使用 Swiss Ephemeris 的房屋系統
const houses = sweInstance.calculateHouses(jd, 0); // Placidus
const ascDegree = houses[0];

const asc = degreeToGateAndLine(ascDegree);
const desc = degreeToGateAndLine((ascDegree + 180) % 360);
```

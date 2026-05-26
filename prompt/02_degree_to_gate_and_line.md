# 02_degree_to_gate_and_line.md

## 功能說明
將行星黃道經度轉換為人類圖的「閘門．線」，並**同時計算意識（黑色）與潛意識（紅色）**。

## 核心函式（推薦直接使用）

```javascript
/**
 * 經度轉閘門與線
 * @param {number} degree - 行星黃道經度 (0~360)
 * @returns {{gate: number, line: number, full: string}}
 */
function degreeToGateAndLine(degree) {
    let normalized = ((degree % 360) + 360) % 360;
    
    // 計算閘門 (1~64)
    const gate = Math.floor(normalized / 5.625) + 1;
    
    // 計算線 (1~6)
    const lineFraction = (normalized % 5.625) / 5.625;
    const line = Math.floor(lineFraction * 6) + 1;
    
    return {
        gate,
        line,
        full: `${gate}.${line}`   // 常用格式，例如 43.4
    };
}

/**
 * 同時計算 Personality 和 Design 兩套結果
 * @param {Object} personalityPosition - 出生時間的行星位置物件
 * @param {Object} designPosition - 設計時間的行星位置物件
 * @returns {Object} 包含 black 和 red 的結果
 */
function calculatePlanetGates(personalityPosition, designPosition) {
    const black = degreeToGateAndLine(personalityPosition.longitude);
    const red = degreeToGateAndLine(designPosition.longitude);
    
    return {
        planetName: personalityPosition.name || '未知行星',
        black,     // 意識層 (黑色)
        red,       // 潛意識層 (紅色)
        display: `${black.full} / ${red.full}`   // 常用顯示方式
    };
}

// ====================== 使用範例 ======================
async function calculateAllPlanets() {
    // ... 取得 Swiss Ephemeris 實例 ...
    
    const birthDate = new Date('你的出生時間');
    const designDate = new Date(birthDate);
    designDate.setDate(designDate.getDate() - 88);
    
    const jdPers = swe.dateToJulianDay(birthDate);
    const jdDes = swe.dateToJulianDay(designDate);
    
    const planets = [Planet.Sun, Planet.Moon, /* ... */];
    
    for (const p of planets) {
        const persPos = swe.calculatePosition(jdPers, p);
        const desPos = swe.calculatePosition(jdDes, p);
        
        const result = calculatePlanetGates(
            { ...persPos, name: p.toString() },
            { ...desPos, name: p.toString() }
        );
        
        console.log(`${result.planetName}: ${result.display}`);
        // 輸出範例：太陽: 23.4 / 45.6
    }
}
Read AGENTS.md first and follow it strictly.
# 05 計算四大類型 Type

## 目的
根據中心定義判斷：生產者、投射者、顯示者、反映者

## 計算邏輯

```javascript
export function calculateType(definedCenters) {
    const sacral = definedCenters.has('sacral');
    const throat = definedCenters.has('throat');
    const motorToThroat = (definedCenters.has('root') || 
                          definedCenters.has('emotional') || 
                          definedCenters.has('ego')) && throat;

    if (definedCenters.size === 0) return 'Reflectors（反映者）';
    if (sacral) return 'Generators（生產者）';
    if (motorToThroat) return 'Manifestors（顯示者）';
    return 'Projectors（投射者）';
}
```

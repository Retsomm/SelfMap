Read AGENTS.md first and follow it strictly.
# 06 計算權威 Authority

## 目的
根據定義中心決定決策方式

## 優先順序

```javascript
export function calculateAuthority(definedCenters) {
    if (definedCenters.has('emotional')) 
        return { name: '情緒權威', tip: '等待情緒波平復' };
    
    if (definedCenters.has('sacral')) 
        return { name: '薦骨權威', tip: '跟隨嗯哼聲音' };
    
    if (definedCenters.has('spleen')) 
        return { name: '脾中心權威', tip: '相信當下直覺' };
    
    // ... 其他權威
}
```

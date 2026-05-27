/**
 * 將閘門編號格式化為兩位數零填充字串。
 * @param n 閘門或位置編號（正整數）
 * @returns 至少兩個字元的字串，不足兩位時在左側補 '0'（例如 `1` → `"01"`）
 */
export const fmtGate = (n: number): string => String(n).padStart(2, '0')

/**
 * 移除能量中心名稱中的「中心」後綴。
 * @param name 完整中心名稱（例如 `"頭腦中心"`）
 * @returns 去除「中心」後的名稱（例如 `"頭腦"`）
 */
export const fmtCenterName = (name: string): string => name.replace('中心', '')

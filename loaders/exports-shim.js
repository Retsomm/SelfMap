// 修正 @swisseph/browser bundle 的 build bug（esbuild tree-shaking 破壞了 enum/class 參照）
module.exports = function (source) {
  let s = source

  // ── 1. 提供 CJS exports 變數（ESM bundle 內部誤用）──────────────────────
  s = 'var exports = (typeof exports !== "undefined") ? exports : {};\n' + s

  // ── 2. enum 預設參數被替換成 (void 0).xxx ────────────────────────────────
  // CalendarType
  s = s.replace(/\(void 0\)\.Gregorian/g, '1')
  // CalculationFlag / CalculationFlags
  s = s.replace(/\(void 0\)\.DefaultMoshier/g, '260')   // MoshierEphemeris(4) | Speed(256)
  s = s.replace(/\(void 0\)\.MoshierEphemeris/g, '4')
  // HouseSystem
  s = s.replace(/\(void 0\)\.Placidus/g, '"P"')
  // HousePoint（ascmc 陣列索引）
  s = s.replace(/\(void 0\)\.Ascendant/g, '0')
  s = s.replace(/\(void 0\)\.MC/g, '1')
  s = s.replace(/\(void 0\)\.ARMC/g, '2')
  s = s.replace(/\(void 0\)\.Vertex/g, '3')
  s = s.replace(/\(void 0\)\.EquatorialAscendant/g, '4')
  s = s.replace(/\(void 0\)\.CoAscendant1/g, '5')
  s = s.replace(/\(void 0\)\.CoAscendant2/g, '6')
  s = s.replace(/\(void 0\)\.PolarAscendant/g, '7')

  // ── 3. 函式呼叫被替換成 (void 0)(args) ───────────────────────────────────
  s = s.replace(/\(void 0\)\(flags\)/g, 'normalizeFlags(flags)')
  s = s.replace(/\(void 0\)\(eclipseType\)/g, 'normalizeEclipseTypes(eclipseType)')

  // ── 4. 建構子 new (void 0)(...) ───────────────────────────────────────────
  // julianDayToDate 回傳 DateTimeImpl
  s = s.replace(
    'new (void 0)(year, month, day, hour, calendarType)',
    'new DateTimeImpl(year, month, day, hour, calendarType)'
  )
  // findNextLunarEclipse 回傳 LunarEclipseImpl（先出現，只替換第一個）
  s = s.replace(
    'return new (void 0)(\n      retflag,',
    'return new LunarEclipseImpl(\n      retflag,'
  )
  // findNextSolarEclipse 回傳 SolarEclipseImpl（剩下的）
  s = s.replace(
    'return new (void 0)(\n      retflag,',
    'return new SolarEclipseImpl(\n      retflag,'
  )

  return s
}

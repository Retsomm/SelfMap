import { useMemo, type ComponentType } from 'react'
import { View, Text, StyleSheet, type ColorValue } from 'react-native'
import { Spacing, Radius, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'
import { IconBolt, IconWave, IconLink } from './icons'

export type ImpactKind = 'center-activated' | 'new-channel' | 'completing-channel'

export const IMPACT_LABEL: Record<ImpactKind, string> = {
  'center-activated':   '空白中心被激活',
  'new-channel':        '全新流日通道',
  'completing-channel': '通道補全',
}

// 儲存前 (previewTransitChart) 與儲存後（圖表詳情頁 TransitAnalysis）共用同一份文案，
// 避免兩邊各自維護造成內容不一致
export const IMPACT_DESC: Record<ImpactKind, string> = {
  'center-activated':   '這些原本開放的中心今天借到了「限定體驗卡」，可以善用這股暫時的能量去執行或創作，但不建議在這些地方做出長期承諾——能量退去後，條件會不同。',
  'new-channel':        '流日帶給你的限定天賦，可以借來執行任務、享受那股靈感。只是記得這件衣服明天會換掉，不要在它還穿著的時候做需要長久負責的承諾。',
  'completing-channel': '你本身擁有一半，今天流日借你補齊了另一半，讓你短暫體驗完整通道的感覺。這股能量來了可以好好享用，能量退潮後回到原本的節奏就好。',
}

export function useImpactMeta(Colors: ThemeColors): Record<ImpactKind, { color: string; Icon: ComponentType<{ color: ColorValue }> }> {
  return useMemo(() => ({
    'center-activated':   { color: Colors.em,      Icon: IconBolt },
    'new-channel':        { color: Colors.transit, Icon: IconWave },
    'completing-channel': { color: Colors.compro,  Icon: IconLink },
  }), [Colors])
}

/** 流日影響卡片：圖示＋標題＋標籤 chip 列＋說明文字。儲存前後畫面共用，確保內容一致。 */
export function ImpactCard({ kind, items }: { kind: ImpactKind; items: string[] }) {
  const Colors = useThemeColors()
  const meta = useImpactMeta(Colors)[kind]
  const s = useMemo(() => createStyles(Colors), [Colors])
  if (items.length === 0) return null
  const { Icon, color } = meta
  return (
    <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: color }]}>
      <View style={s.header}>
        <Icon color={color} />
        <Text style={[s.kindLabel, { color }]}>{IMPACT_LABEL[kind]}</Text>
      </View>
      <View style={s.chipRow}>
        {items.map((label, i) => (
          <View key={i} style={[s.chip, { backgroundColor: `${color}22` }]}>
            <Text style={[s.chipText, { color }]}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={s.desc}>{IMPACT_DESC[kind]}</Text>
    </View>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  card:      { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  header:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
  kindLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  chipRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip:      { borderRadius: 6, paddingHorizontal: 10, paddingVertical: Spacing.xs },
  chipText:  { fontSize: 12, fontWeight: '500' },
  desc:      { fontSize: 13, color: Colors.sub },
})

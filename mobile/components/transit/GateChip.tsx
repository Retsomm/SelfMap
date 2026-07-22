import { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { HD_GATES } from '@shared/humanDesign/hd-chart-data'
import { type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'

export function GateChip({ g, color, bg }: { g: number; color: string; bg: string }) {
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])
  return (
    <View style={[s.gateTag, { backgroundColor: bg }]}>
      <Text style={[s.gateTagNum, { color }]}>{g}</Text>
      <Text style={[s.gateTagName, { color }]} numberOfLines={1}>{HD_GATES[g]?.name.zh ?? ''}</Text>
    </View>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  gateTag:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  gateTagNum:  { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  gateTagName: { fontSize: 11, fontWeight: '400', maxWidth: 80 },
})

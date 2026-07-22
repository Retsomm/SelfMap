import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { HD_CENTERS_INFO } from '@shared/humanDesign/hd-chart-data'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { ls } from './learnStyles'

const CENTER_ORDER = ['head', 'ajna', 'throat', 'g', 'heart', 'spleen', 'sacral', 'solar', 'root']
const CENTER_COLOR: Record<string, string> = {
  head: '#e6c542', ajna: '#9bbf52', throat: '#c69a5d', g: '#e6c542',
  heart: '#d04830', spleen: '#c69a5d', sacral: '#d04830', solar: '#e6c542', root: '#c69a5d',
}

export function CenterList() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <ScrollView contentContainerStyle={ls.inner}>
      <Text style={ls.countLabel}>9 個能量中心</Text>
      {CENTER_ORDER.map(id => {
        const info = HD_CENTERS_INFO[id]
        if (!info) return null
        const open = expanded.has(id)
        const dotColor = CENTER_COLOR[id] ?? Colors.accent

        return (
          <View key={id} style={ls.accordionCard}>
            <Pressable
              style={ls.accordionHeader}
              onPress={() => toggle(id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
            >
              <View style={[s.dot, { backgroundColor: dotColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={ls.acSubtitle}>{info.type.zh}</Text>
                <Text style={ls.acTitle}>{info.name.zh}</Text>
                <Text style={ls.acIntro} numberOfLines={open ? undefined : 2}>{info.summary.zh}</Text>
              </View>
              <Text style={[ls.chevron, open && ls.chevronOpen]}>›</Text>
            </Pressable>

            {open && (
              <View style={ls.accordionBody}>
                <Text style={ls.paragraph}>{info.description.zh}</Text>
                <ExpandSection label="已定義" body={info.definedContent.zh} color={Colors.accent} />
                <ExpandSection label="開放"   body={info.openContent.zh}    color={Colors.sub} />
                {info.gates.length > 0 && (
                  <View style={s.gatesRow}>
                    <Text style={ls.miniLabel}>包含閘門</Text>
                    <View style={s.gateChips}>
                      {[...info.gates].sort((a, b) => a - b).map(g => (
                        <View key={g} style={s.gateChip}>
                          <Text style={s.gateChipText}>{g}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}

function ExpandSection({ label, body, color }: { label: string; body: string; color: string }) {
  return (
    <View style={s.expandSection}>
      <Text style={[s.expandLabel, { color }]}>{label}</Text>
      <Text style={ls.paragraph}>{body}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  dot:          { width: 12, height: 12, borderRadius: 6, marginTop: 6 },
  expandSection:{ gap: 6 },
  expandLabel:  { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  gatesRow:     { gap: 6 },
  gateChips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gateChip:     { backgroundColor: Colors.gateBg, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.gateBorder },
  gateChipText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
})

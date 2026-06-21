import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { HD_GATES } from '@/lib/hd-chart-data'
import { CENTER_ZH } from '@/lib/hd-normalizers'
import { Colors, Radius } from '@/constants/tokens'
import { ls } from './learnStyles'

export function GateList() {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const toggle = (num: number) =>
    setExpanded(prev => { const n = new Set(prev); n.has(num) ? n.delete(num) : n.add(num); return n })

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase()
    return Object.entries(HD_GATES)
      .map(([k, v]) => ({ num: Number(k), gate: v }))
      .sort((a, b) => a.num - b.num)
      .filter(({ num, gate }) => {
        if (!q) return true
        return (
          String(num).includes(q) ||
          gate.name.zh.includes(q) ||
          gate.desc.zh.slice(0, 40).toLowerCase().includes(q)
        )
      })
  }, [query])

  return (
    <ScrollView contentContainerStyle={ls.inner} keyboardShouldPersistTaps="handled">
      <TextInput
        style={ls.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="搜尋閘門號碼或名稱…"
        placeholderTextColor={Colors.muted}
        clearButtonMode="while-editing"
        returnKeyType="search"
        keyboardType="default"
      />
      <Text style={ls.countLabel}>{entries.length} / 64 個閘門</Text>
      {entries.map(({ num, gate }) => {
        const open = expanded.has(num)
        return (
          <View key={num} style={ls.accordionCard}>
            <Pressable style={ls.accordionHeader} onPress={() => toggle(num)} accessibilityRole="button">
              <View style={s.badge}>
                <Text style={s.badgeText}>{num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ls.acSubtitle}>{CENTER_ZH[gate.center] ?? gate.center} 中心</Text>
                <Text style={ls.acTitle}>{gate.name.zh}</Text>
                <Text style={ls.acIntro} numberOfLines={open ? undefined : 2}>{gate.desc.zh}</Text>
              </View>
              <Text style={[ls.chevron, open && ls.chevronOpen]}>›</Text>
            </Pressable>
            {open && (
              <View style={ls.accordionBody}>
                <Text style={ls.paragraph}>{gate.desc.zh}</Text>
              </View>
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  badge: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.gateBg,
    borderWidth: 1,
    borderColor: Colors.gateBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  badgeText: { color: Colors.accent, fontSize: 14, fontWeight: '700' },
})

import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { HD_CHANNELS, type ChartChannel } from '@shared/humanDesign/hd-chart-data'
import { type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'
import { createLs } from './learnStyles'

export function ChannelList() {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const Colors = useThemeColors()
  const ls = useMemo(() => createLs(Colors), [Colors])
  const s = useMemo(() => createStyles(Colors), [Colors])

  const sorted = useMemo(
    () => [...HD_CHANNELS].sort((a, b) => Math.min(a.from, a.to) - Math.min(b.from, b.to)),
    []
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(ch =>
      ch.name.zh.toLowerCase().includes(q) ||
      String(ch.from).includes(q) ||
      String(ch.to).includes(q) ||
      ch.desc.zh.toLowerCase().includes(q)
    )
  }, [query, sorted])

  return (
    <ScrollView contentContainerStyle={ls.inner} keyboardShouldPersistTaps="handled">
      <TextInput
        style={ls.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="搜尋通道名稱或閘門號碼…"
        placeholderTextColor={Colors.muted}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      <Text style={ls.countLabel}>{filtered.length} / {HD_CHANNELS.length} 條通道</Text>
      {filtered.map(ch => (
        <ChannelCard key={ch.id} s={s} ls={ls} ch={ch} open={expanded.has(ch.id)} onToggle={() => toggle(ch.id)} />
      ))}
    </ScrollView>
  )
}

function ChannelCard({ s, ls, ch, open, onToggle }: {
  s: ReturnType<typeof createStyles>
  ls: ReturnType<typeof createLs>
  ch: ChartChannel
  open: boolean
  onToggle: () => void
}) {
  return (
    <View style={ls.accordionCard}>
      <Pressable style={ls.accordionHeader} onPress={onToggle} accessibilityRole="button">
        <View style={s.channelNum}>
          <Text style={s.channelNumText}>{ch.from}–{ch.to}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ls.acTitle}>{ch.name.zh}</Text>
          <Text style={ls.acIntro} numberOfLines={open ? undefined : 2}>{ch.desc.zh}</Text>
        </View>
        <Text style={[ls.chevron, open && ls.chevronOpen]}>›</Text>
      </Pressable>
      {open && (
        <View style={ls.accordionBody}>
          <Text style={ls.paragraph}>{ch.desc.zh}</Text>
          <Text style={ls.miniLabel}>連結閘門</Text>
          <Text style={s.channelGates}>閘門 {ch.from}  ⟷  閘門 {ch.to}</Text>
        </View>
      )}
    </View>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  channelNum:     { minWidth: 50, alignItems: 'center', justifyContent: 'center' },
  channelNumText: { color: Colors.accent, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  channelGates:   { fontSize: 14, color: Colors.sub, fontWeight: '600' },
})

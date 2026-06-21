import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { HD_CHANNELS, type ChartChannel } from '@/lib/hd-chart-data'
import { Colors } from '@/constants/tokens'
import { ls } from './learnStyles'

export function ChannelList() {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return HD_CHANNELS
    return HD_CHANNELS.filter(ch =>
      ch.name.zh.toLowerCase().includes(q) ||
      String(ch.from).includes(q) ||
      String(ch.to).includes(q) ||
      ch.desc.zh.toLowerCase().includes(q)
    )
  }, [query])

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
        <ChannelCard key={ch.id} ch={ch} open={expanded.has(ch.id)} onToggle={() => toggle(ch.id)} />
      ))}
    </ScrollView>
  )
}

function ChannelCard({ ch, open, onToggle }: { ch: ChartChannel; open: boolean; onToggle: () => void }) {
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

const s = StyleSheet.create({
  channelNum:     { minWidth: 50, alignItems: 'center', justifyContent: 'center' },
  channelNumText: { color: Colors.accent, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  channelGates:   { fontSize: 14, color: Colors.sub, fontWeight: '600' },
})

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  HD_CENTERS_INFO,
  HD_CHANNELS,
  HD_GATES,
  type ChartChannel,
} from '@/lib/hd-chart-data'
import {
  HD_TYPE_CONTENT,
  HD_AUTHORITY_CONTENT,
  HD_PROFILE_CONTENT,
  HD_DEFINITION_CONTENT,
  type SummaryContent,
} from '@/lib/hd-summary-data'
import { Colors, Radius, Spacing } from '@/constants/tokens'

// ─── Route ──────────────────────────────────────────────────────────────────

export default function TopicScreen() {
  const { topic } = useLocalSearchParams<{ topic: string }>()
  const router = useRouter()

  const title =
    topic === 'type'       ? '五大類型' :
    topic === 'authority'  ? '內在權威' :
    topic === 'profile'    ? '人生角色' :
    topic === 'definition' ? '五大定義' :
    topic === 'center'     ? '九大中心' :
    topic === 'channel'    ? '通道'     :
    topic === 'gate'       ? '閘門'     : topic

  return (
    <SafeAreaView style={styles.container}>
      {/* Back header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backText}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 60 }} />
      </View>

      {topic === 'type'       && <SummaryList data={HD_TYPE_CONTENT}       categoryLabel="能量類型" />}
      {topic === 'authority'  && <SummaryList data={HD_AUTHORITY_CONTENT}  categoryLabel="內在權威" />}
      {topic === 'profile'    && <SummaryList data={HD_PROFILE_CONTENT}    categoryLabel="人生角色" />}
      {topic === 'definition' && <SummaryList data={HD_DEFINITION_CONTENT} categoryLabel="五大定義" />}
      {topic === 'center'     && <CenterList />}
      {topic === 'channel'    && <ChannelList />}
      {topic === 'gate'       && <GateList />}
    </SafeAreaView>
  )
}

// ─── SummaryList (types / authorities / profiles / definitions) ──────────────

function SummaryList({ data, categoryLabel }: { data: Record<string, SummaryContent>; categoryLabel: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (key: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const entries = Object.entries(data)

  return (
    <ScrollView contentContainerStyle={styles.inner}>
      <Text style={styles.countLabel}>{entries.length} 種{categoryLabel}</Text>
      {entries.map(([key, d]) => {
        const open = expanded.has(key)
        return (
          <View key={key} style={styles.accordionCard}>
            <Pressable
              style={styles.accordionHeader}
              onPress={() => toggle(key)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
            >
              <View style={{ flex: 1 }}>
                {d.subtitle ? <Text style={styles.acSubtitle}>{d.subtitle}</Text> : null}
                <Text style={styles.acTitle}>{d.title}</Text>
                <Text style={styles.acIntro} numberOfLines={open ? undefined : 2}>{d.intro}</Text>
              </View>
              <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
            </Pressable>

            {open && (
              <View style={styles.accordionBody}>
                {d.paragraphs.map((p, i) => (
                  <Text key={i} style={styles.paragraph}>{p}</Text>
                ))}
                {d.highlights && d.highlights.length > 0 && (
                  <View style={styles.highlights}>
                    {d.highlights.map((h, i) => (
                      <View key={i} style={styles.highlightCard}>
                        <Text style={styles.highlightLabel}>{h.label}</Text>
                        <Text style={styles.highlightBody}>{h.text}</Text>
                      </View>
                    ))}
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

// ─── CenterList ──────────────────────────────────────────────────────────────

const CENTER_ORDER = ['head', 'ajna', 'throat', 'g', 'heart', 'spleen', 'sacral', 'solar', 'root']
const CENTER_COLOR: Record<string, string> = {
  head: '#e6c542', ajna: '#9bbf52', throat: '#c69a5d', g: '#e6c542',
  heart: '#d04830', spleen: '#c69a5d', sacral: '#d04830', solar: '#e6c542', root: '#c69a5d',
}

function CenterList() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <ScrollView contentContainerStyle={styles.inner}>
      <Text style={styles.countLabel}>9 個能量中心</Text>
      {CENTER_ORDER.map(id => {
        const info = HD_CENTERS_INFO[id]
        if (!info) return null
        const open = expanded.has(id)
        const dotColor = CENTER_COLOR[id] ?? Colors.accent

        return (
          <View key={id} style={styles.accordionCard}>
            <Pressable
              style={styles.accordionHeader}
              onPress={() => toggle(id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
            >
              <View style={[styles.centerDot, { backgroundColor: dotColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.acSubtitle}>{info.type.zh}</Text>
                <Text style={styles.acTitle}>{info.name.zh}</Text>
                <Text style={styles.acIntro} numberOfLines={open ? undefined : 2}>{info.summary.zh}</Text>
              </View>
              <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
            </Pressable>

            {open && (
              <View style={styles.accordionBody}>
                <Text style={styles.paragraph}>{info.description.zh}</Text>
                <ExpandSection label="已定義" body={info.definedContent.zh} color={Colors.accent} />
                <ExpandSection label="開放"   body={info.openContent.zh}    color={Colors.sub} />
                {info.gates.length > 0 && (
                  <View style={styles.gatesRow}>
                    <Text style={styles.miniLabel}>包含閘門</Text>
                    <View style={styles.gateChips}>
                      {info.gates.map(g => (
                        <View key={g} style={styles.gateChip}>
                          <Text style={styles.gateChipText}>{g}</Text>
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
    <View style={styles.expandSection}>
      <Text style={[styles.expandLabel, { color }]}>{label}</Text>
      <Text style={styles.paragraph}>{body}</Text>
    </View>
  )
}

// ─── ChannelList ─────────────────────────────────────────────────────────────

function ChannelList() {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return HD_CHANNELS
    return HD_CHANNELS.filter(ch =>
      ch.name.zh.includes(q) ||
      String(ch.from).includes(q) ||
      String(ch.to).includes(q) ||
      ch.desc.zh.slice(0, 30).toLowerCase().includes(q)
    )
  }, [query])

  return (
    <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="搜尋通道名稱或閘門號碼…"
        placeholderTextColor={Colors.muted}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      <Text style={styles.countLabel}>{filtered.length} / {HD_CHANNELS.length} 條通道</Text>
      {filtered.map(ch => <ChannelCard key={ch.id} ch={ch} open={expanded.has(ch.id)} onToggle={() => toggle(ch.id)} />)}
    </ScrollView>
  )
}

function ChannelCard({ ch, open, onToggle }: { ch: ChartChannel; open: boolean; onToggle: () => void }) {
  return (
    <View style={styles.accordionCard}>
      <Pressable style={styles.accordionHeader} onPress={onToggle} accessibilityRole="button">
        <View style={styles.channelNum}>
          <Text style={styles.channelNumText}>{ch.from}–{ch.to}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.acTitle}>{ch.name.zh}</Text>
          <Text style={styles.acIntro} numberOfLines={open ? undefined : 2}>{ch.desc.zh}</Text>
        </View>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </Pressable>
      {open && (
        <View style={styles.accordionBody}>
          <Text style={styles.paragraph}>{ch.desc.zh}</Text>
          <Text style={styles.miniLabel}>連結閘門</Text>
          <Text style={styles.channelGates}>閘門 {ch.from}  ⟷  閘門 {ch.to}</Text>
        </View>
      )}
    </View>
  )
}

// ─── GateList ────────────────────────────────────────────────────────────────

const CENTER_ZH: Record<string, string> = {
  head: '頂輪', ajna: '邏輯', throat: '喉嚨', g: 'G中心',
  heart: '意志力', spleen: '脾', sacral: '薦骨', solar: '情緒', root: '根部',
}

function GateList() {
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
    <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="搜尋閘門號碼或名稱…"
        placeholderTextColor={Colors.muted}
        clearButtonMode="while-editing"
        returnKeyType="search"
        keyboardType="default"
      />
      <Text style={styles.countLabel}>{entries.length} / 64 個閘門</Text>
      {entries.map(({ num, gate }) => {
        const open = expanded.has(num)
        return (
          <View key={num} style={styles.accordionCard}>
            <Pressable style={styles.accordionHeader} onPress={() => toggle(num)} accessibilityRole="button">
              <View style={styles.gateNumBadge}>
                <Text style={styles.gateNumText}>{num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.acSubtitle}>{CENTER_ZH[gate.center] ?? gate.center} 中心</Text>
                <Text style={styles.acTitle}>{gate.name.zh}</Text>
                <Text style={styles.acIntro} numberOfLines={open ? undefined : 2}>{gate.desc.zh}</Text>
              </View>
              <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
            </Pressable>
            {open && (
              <View style={styles.accordionBody}>
                <Text style={styles.paragraph}>{gate.desc.zh}</Text>
              </View>
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:     {},
  backText:    { color: Colors.accent, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },

  // Scroll inner
  inner:      { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 48 },
  countLabel: { fontSize: 12, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },

  // Accordion card
  accordionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  accordionBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  // Text
  acSubtitle: { fontSize: 11, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  acTitle:    { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  acIntro:    { fontSize: 13, color: Colors.sub, lineHeight: 20 },
  paragraph:  { fontSize: 14, color: Colors.text, lineHeight: 22 },
  chevron:    { fontSize: 22, color: Colors.muted, marginTop: 4, transform: [{ rotate: '0deg' }] },
  chevronOpen:{ transform: [{ rotate: '90deg' }] },

  // Highlights
  highlights:     { gap: Spacing.sm },
  highlightCard:  { backgroundColor: Colors.accentD, borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.accent, gap: 4 },
  highlightLabel: { color: Colors.accent, fontSize: 12, fontWeight: '700' },
  highlightBody:  { color: Colors.text, fontSize: 14, lineHeight: 21 },

  // Center specific
  centerDot: { width: 12, height: 12, borderRadius: 6, marginTop: 6 },
  expandSection: { gap: 6 },
  expandLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  gatesRow:  { gap: 6 },
  miniLabel: { fontSize: 11, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  gateChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gateChip:  { backgroundColor: Colors.gateBg, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.gateBorder },
  gateChipText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },

  // Channel specific
  channelNum:     { minWidth: 50, alignItems: 'center', justifyContent: 'center' },
  channelNumText: { color: Colors.accent, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  channelGates:   { fontSize: 14, color: Colors.sub, fontWeight: '600' },

  // Gate specific
  gateNumBadge: {
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
  gateNumText: { color: Colors.accent, fontSize: 14, fontWeight: '700' },

  // Search
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: 15,
  },
})

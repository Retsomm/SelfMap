import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  HD_PROFILE_CONTENT,
  HD_AUTHORITY_CONTENT,
  HD_DEFINITION_CONTENT,
} from '@/lib/hd-summary-data'

export type SheetTarget =
  | { kind: 'center';     id: string }
  | { kind: 'gate';       num: number }
  | { kind: 'channel';    channel: ChartChannel }
  | { kind: 'type';       typeKey: string }
  | { kind: 'authority';  authorityKey: string }
  | { kind: 'profile';    profile: string }
  | { kind: 'definition'; definitionKey: string }

interface Props {
  target: SheetTarget | null
  onClose: () => void
}

export default function DetailBottomSheet({ target, onClose }: Props) {
  if (!target) return null

  const content =
    target.kind === 'center'     ? buildCenterContent(target.id) :
    target.kind === 'gate'       ? buildGateContent(target.num) :
    target.kind === 'channel'    ? buildChannelContent(target.channel) :
    target.kind === 'type'       ? buildTypeContent(target.typeKey) :
    target.kind === 'authority'  ? buildAuthorityContent(target.authorityKey) :
    target.kind === 'profile'    ? buildProfileContent(target.profile) :
    /* definition */               buildDefinitionContent(target.definitionKey)

  if (!content) return null

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
              <Text style={styles.title}>{content.title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Body sections */}
          {content.sections.map((s, i) => (
            <View key={i} style={styles.section}>
              {s.label ? <Text style={styles.sectionLabel}>{s.label}</Text> : null}
              <Text style={styles.sectionBody}>{s.body}</Text>
            </View>
          ))}

          {/* Highlights */}
          {content.highlights && content.highlights.length > 0 && (
            <View style={styles.highlightGroup}>
              {content.highlights.map((h, i) => (
                <View key={i} style={styles.highlightCard}>
                  <Text style={styles.highlightLabel}>{h.label}</Text>
                  <Text style={styles.highlightBody}>{h.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Keywords */}
          {content.keywords.length > 0 && (
            <View style={styles.tagRow}>
              {content.keywords.map((k) => (
                <View key={k} style={styles.tag}>
                  <Text style={styles.tagText}>{k}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

// ─── builders ───────────────────────────────────────────────────────────────

interface SheetContent {
  title: string
  subtitle: string
  sections: Array<{ label?: string; body: string }>
  highlights?: Array<{ label: string; text: string }>
  keywords: string[]
}

function buildCenterContent(id: string): SheetContent | null {
  const info = HD_CENTERS_INFO[id]
  if (!info) return null

  return {
    title: info.name.zh,
    subtitle: info.type.zh,
    sections: [
      { body: info.description.zh },
      { label: '已定義', body: info.definedContent.zh },
      { label: '開放', body: info.openContent.zh },
    ],
    keywords: info.keywords.zh,
  }
}

function buildGateContent(num: number): SheetContent | null {
  const gate = HD_GATES[num]
  if (!gate) return null

  const relatedChannels = HD_CHANNELS.filter(
    (ch) => ch.from === num || ch.to === num,
  )

  const sections: SheetContent['sections'] = [{ body: gate.desc.zh }]
  if (relatedChannels.length > 0) {
    const channelList = relatedChannels
      .map((ch) => `${ch.from}–${ch.to}  ${ch.name.zh}`)
      .join('\n')
    sections.push({ label: '相關通道', body: channelList })
  }

  return {
    title: `閘門 ${num}：${gate.name.zh}`,
    subtitle: `中心：${centerZh(gate.center)}`,
    sections,
    keywords: [],
  }
}

function buildChannelContent(ch: ChartChannel): SheetContent {
  const fromGate = HD_GATES[ch.from]
  const toGate   = HD_GATES[ch.to]
  const fromName = fromGate ? `閘門 ${ch.from}・${fromGate.name.zh}` : `閘門 ${ch.from}`
  const toName   = toGate   ? `閘門 ${ch.to}・${toGate.name.zh}`   : `閘門 ${ch.to}`

  return {
    title: ch.name.zh,
    subtitle: `通道 ${ch.from}–${ch.to}`,
    sections: [
      { body: ch.desc.zh },
      { label: '連結閘門', body: `${fromName}  ⟷  ${toName}` },
    ],
    keywords: [],
  }
}

function buildTypeContent(typeKey: string): SheetContent | null {
  const d = HD_TYPE_CONTENT[typeKey]
  if (!d) return null
  return {
    title: d.title,
    subtitle: d.subtitle ?? '能量類型',
    sections: [
      { body: d.intro },
      ...d.paragraphs.map((p) => ({ body: p })),
    ],
    highlights: d.highlights,
    keywords: [],
  }
}

// API stores Chinese labels; hd-summary-data uses English keys — reverse lookup
const AUTHORITY_ZH_TO_KEY: Record<string, string> = {
  '情緒權威':     'Emotional',
  '薦骨權威':     'Sacral',
  '脾中心權威':  'Splenic',
  '意志力權威':  'Ego',
  '自我投射權威': 'Self-Projected',
  '心智權威':     'Mental',
  '月亮週期權威': 'Lunar',
}

const DEFINITION_ZH_TO_KEY: Record<string, string> = {
  '單一定義人':           'Single',
  '二分定義人':           'Split',
  '三分定義人':           'Triple Split',
  '四分定義人':           'Quadruple Split',
  '無定義（反映者）': 'None',
}

function buildAuthorityContent(authorityKey: string): SheetContent | null {
  const key = AUTHORITY_ZH_TO_KEY[authorityKey] ?? authorityKey
  const d = HD_AUTHORITY_CONTENT[key]
  if (!d) return null
  return {
    title: d.title,
    subtitle: d.subtitle ?? '內在權威',
    sections: [
      { body: d.intro },
      ...d.paragraphs.map((p) => ({ body: p })),
    ],
    highlights: d.highlights,
    keywords: [],
  }
}

function buildProfileContent(profile: string): SheetContent | null {
  const d = HD_PROFILE_CONTENT[profile]
  if (!d) return null
  return {
    title: d.title,
    subtitle: d.subtitle ?? '人生角色',
    sections: [
      { body: d.intro },
      ...d.paragraphs.map((p) => ({ body: p })),
    ],
    highlights: d.highlights,
    keywords: [],
  }
}

function buildDefinitionContent(definitionKey: string): SheetContent | null {
  const key = DEFINITION_ZH_TO_KEY[definitionKey] ?? definitionKey
  const d = HD_DEFINITION_CONTENT[key]
  if (!d) return null
  return {
    title: d.title,
    subtitle: d.subtitle ?? '定義',
    sections: [
      { body: d.intro },
      ...d.paragraphs.map((p) => ({ body: p })),
    ],
    highlights: d.highlights,
    keywords: [],
  }
}

const CENTER_ZH: Record<string, string> = {
  head: '頂輪', ajna: '邏輯', throat: '喉嚨', g: 'G 中心',
  heart: '意志力', spleen: '脾', sacral: '薦骨', solar: '情緒', root: '根部',
}
function centerZh(id: string) { return CENTER_ZH[id] ?? id }

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 24,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#3a3a5e',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  scroll: { flex: 0 },
  scrollInner: { padding: 20, paddingTop: 8, gap: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerText: { flex: 1, gap: 2 },
  subtitle: { color: '#8888aa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },

  closeBtn: {
    backgroundColor: '#2e2e4e',
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeBtnText: { color: '#8888aa', fontSize: 14, fontWeight: '600' },

  section: { gap: 6 },
  sectionLabel: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionBody: { color: '#ccc', fontSize: 15, lineHeight: 23 },

  highlightGroup: { gap: 10 },
  highlightCard: {
    backgroundColor: '#22223a',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#a78bfa',
    gap: 4,
  },
  highlightLabel: { color: '#a78bfa', fontSize: 12, fontWeight: '700' },
  highlightBody: { color: '#ddd', fontSize: 14, lineHeight: 21 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: '#2e1e4e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#5b2dba',
  },
  tagText: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },
})

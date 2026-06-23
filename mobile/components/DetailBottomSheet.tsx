import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { type ChartChannel } from '@/lib/hd-chart-data'
import {
  buildCenterContent,
  buildGateContent,
  buildChannelContent,
  buildTypeContent,
  buildAuthorityContent,
  buildProfileContent,
  buildDefinitionContent,
  buildIncarnationCrossContent,
} from '@/lib/hd-sheet-builders'
import { Colors, Radius, Spacing } from '@/constants/tokens'

export type SheetTarget =
  | { kind: 'center';            id: string }
  | { kind: 'gate';              num: number }
  | { kind: 'channel';           channel: ChartChannel }
  | { kind: 'type';              typeKey: string }
  | { kind: 'authority';         authorityKey: string }
  | { kind: 'profile';           profile: string }
  | { kind: 'definition';        definitionKey: string }
  | { kind: 'incarnationCross';  crossType: string; crossTypeLabel: string; crossBaseName: string; variant: string | number; gatesLabel: string; sunGate?: number }

interface Props {
  target: SheetTarget | null
  onClose: () => void
}

export default function DetailBottomSheet({ target, onClose }: Props) {
  if (!target) return null

  const content =
    target.kind === 'center'           ? buildCenterContent(target.id) :
    target.kind === 'gate'             ? buildGateContent(target.num) :
    target.kind === 'channel'          ? buildChannelContent(target.channel) :
    target.kind === 'type'             ? buildTypeContent(target.typeKey) :
    target.kind === 'authority'        ? buildAuthorityContent(target.authorityKey) :
    target.kind === 'profile'          ? buildProfileContent(target.profile) :
    target.kind === 'incarnationCross' ? buildIncarnationCrossContent(target) :
    /* definition */                     buildDefinitionContent(target.definitionKey)

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
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
              <Text style={styles.title}>{content.title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {content.sections.map((s, i) => (
            <View key={i} style={styles.section}>
              {s.label ? <Text style={styles.sectionLabel}>{s.label}</Text> : null}
              <Text style={styles.sectionBody}>{s.body}</Text>
            </View>
          ))}

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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '80%',
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 24,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  scroll:      { flex: 0 },
  scrollInner: { padding: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.lg },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerText: { flex: 1, gap: 2 },
  subtitle: { color: Colors.sub, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  title:    { color: Colors.text, fontSize: 20, fontWeight: '700' },

  closeBtn: {
    backgroundColor: Colors.gateBg,
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeBtnText: { color: Colors.sub, fontSize: 14, fontWeight: '600' },

  section:      { gap: 6 },
  sectionLabel: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionBody: { color: Colors.text, fontSize: 15, lineHeight: 23 },

  highlightGroup: { gap: 10 },
  highlightCard: {
    backgroundColor: Colors.accentD,
    borderRadius: Radius.md,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    gap: 4,
  },
  highlightLabel: { color: Colors.accent, fontSize: 12, fontWeight: '700' },
  highlightBody:  { color: Colors.text, fontSize: 14, lineHeight: 21 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: Colors.accentD,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  tagText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
})

import { Pressable, StyleSheet, Text, View } from 'react-native'

export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  )
}

export function Row({
  label,
  value,
  accent,
  dim,
  tappable,
  onPress,
}: {
  label: string
  value: string
  accent?: boolean
  dim?: boolean
  tappable?: boolean
  onPress?: () => void
}) {
  const inner = (
    <View style={[styles.row, tappable && styles.rowTappable]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, accent && styles.rowAccent, dim && styles.rowDim]}>
          {value}
        </Text>
        {tappable && <Text style={styles.rowChevron}>›</Text>}
      </View>
    </View>
  )
  if (!onPress) return inner
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed ? styles.rowPressedBg : undefined}>
      {inner}
    </Pressable>
  )
}

export function Tag({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const chip = (
    <View style={[styles.tag, active && styles.tagActive, !!onPress && styles.tagTappable]}>
      <Text style={[styles.tagText, active && styles.tagTextActive]}>{label}</Text>
    </View>
  )
  if (!onPress) return chip
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}>
      {chip}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  cardTitle: {
    color: '#8888aa',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardBody: { rowGap: 4 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowTappable: { paddingVertical: 8 },
  rowPressedBg: { backgroundColor: 'rgba(167,139,250,0.08)', borderRadius: 8 },
  rowLabel: { color: '#8888aa', fontSize: 14, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  rowValue: { color: '#fff', fontSize: 14, fontWeight: '500', textAlign: 'right', marginLeft: 8 },
  rowAccent: { color: '#a78bfa', fontWeight: '700' },
  rowDim: { color: '#ff9966' },
  rowChevron: { color: '#5555aa', fontSize: 18, lineHeight: 20 },

  tag: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  tagActive: { backgroundColor: '#2e1e4e', borderColor: '#5b2dba' },
  tagTappable: { borderColor: '#3a2a6e' },
  tagText: { color: '#6666aa', fontSize: 13 },
  tagTextActive: { color: '#a78bfa', fontWeight: '600' },
})

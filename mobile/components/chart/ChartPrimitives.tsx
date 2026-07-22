import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'

export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const Colors = useThemeColors()
  const styles = useMemo(() => createStyles(Colors), [Colors])
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
  const Colors = useThemeColors()
  const styles = useMemo(() => createStyles(Colors), [Colors])
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
  const Colors = useThemeColors()
  const styles = useMemo(() => createStyles(Colors), [Colors])
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

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.sub,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  cardBody: { rowGap: Spacing.xs },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowTappable:  { paddingVertical: Spacing.sm },
  rowPressedBg: { backgroundColor: Colors.rowPressedBg, borderRadius: Radius.sm },
  rowLabel:  { color: Colors.sub, fontSize: 14, flex: 1 },
  rowRight:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 1 },
  rowValue:  { color: Colors.text, fontSize: 14, fontWeight: '500', textAlign: 'right', marginLeft: Spacing.sm },
  rowAccent: { color: Colors.accent, fontWeight: '700' },
  rowDim:    { color: Colors.planetRedText },
  rowChevron:{ color: Colors.muted, fontSize: 18, lineHeight: 20 },

  tag: {
    backgroundColor: Colors.gateBg,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagActive:    { backgroundColor: Colors.accentD, borderColor: Colors.accent },
  tagTappable:  { borderColor: Colors.sub },
  tagText:      { color: Colors.muted, fontSize: 13 },
  tagTextActive:{ color: Colors.accent, fontWeight: '600' },
})

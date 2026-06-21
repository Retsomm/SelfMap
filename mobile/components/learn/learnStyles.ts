import { StyleSheet } from 'react-native'
import { Colors, Radius, Spacing } from '@/constants/tokens'

export const ls = StyleSheet.create({
  inner:      { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 48 },
  countLabel: { fontSize: 12, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },

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

  acSubtitle: { fontSize: 11, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  acTitle:    { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  acIntro:    { fontSize: 13, color: Colors.sub, lineHeight: 20 },
  paragraph:  { fontSize: 14, color: Colors.text, lineHeight: 22 },
  chevron:    { fontSize: 22, color: Colors.muted, marginTop: 4, transform: [{ rotate: '0deg' }] },
  chevronOpen:{ transform: [{ rotate: '90deg' }] },

  highlights:     { gap: Spacing.sm },
  highlightCard:  { backgroundColor: Colors.accentD, borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.accent, gap: 4 },
  highlightLabel: { color: Colors.accent, fontSize: 12, fontWeight: '700' },
  highlightBody:  { color: Colors.text, fontSize: 14, lineHeight: 21 },

  miniLabel: { fontSize: 11, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },

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

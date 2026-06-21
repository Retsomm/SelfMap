import { type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Colors, Spacing } from '@/constants/tokens'

export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <Text style={styles.heading}>{title}</Text>
      {right ?? null}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.text },
})

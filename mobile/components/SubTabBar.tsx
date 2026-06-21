import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, Spacing } from '@/constants/tokens'

export type TabItem<T extends string = string> = { id: T; label: string }

export function SubTabBar<T extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: readonly TabItem<T>[]
  active: T
  onSelect: (id: T) => void
}) {
  return (
    <View style={styles.bar}>
      {tabs.map(tab => (
        <Pressable
          key={tab.id}
          style={[styles.item, active === tab.id && styles.itemActive]}
          onPress={() => onSelect(tab.id)}
          accessible
          accessibilityRole="tab"
          accessibilityState={{ selected: active === tab.id }}
        >
          <Text style={[styles.text, active === tab.id && styles.textActive]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  bar:        { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  item:       { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  itemActive: { borderBottomColor: Colors.accent },
  text:       { fontSize: 14, fontWeight: '500', color: Colors.muted },
  textActive: { color: Colors.accent, fontWeight: '700' },
})

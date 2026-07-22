import { useMemo, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { filterTimezones } from '@shared/humanDesign/timezones'
import { Colors, Radius, Spacing } from '@/constants/tokens'

type Props = {
  visible: boolean
  onSelect: (zone: string, label: string) => void
  onClose: () => void
}

export default function TimezonePickerModal({ visible, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => filterTimezones(query), [query])

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>選擇時區</Text>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="搜尋 UTC 偏移量，例如 8 或 +08:00"
            placeholderTextColor={Colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.listContent}>
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>找不到符合的時區</Text>
          )}
          {filtered.map(item => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => { onSelect(item.zone, item.label); onClose() }}
            >
              <Text style={styles.rowLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  searchRow: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 15,
  },
  scrollArea:  { flex: 1 },
  listContent: { paddingBottom: Spacing.xl },
  row: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowPressed: { backgroundColor: Colors.rowPressedBg },
  rowLabel: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  emptyText: { color: Colors.muted, fontSize: 14, textAlign: 'center', paddingVertical: Spacing.xl },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: { color: Colors.sub, fontSize: 15, fontWeight: '600' },
})

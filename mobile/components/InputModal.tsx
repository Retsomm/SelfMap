import { type RefObject } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Colors, Radius, Spacing } from '@/constants/tokens'

type Props = {
  visible: boolean
  title: string
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  placeholder?: string
  confirmLabel?: string
  loading?: boolean
  inputRef?: RefObject<TextInput | null>
}

export function InputModal({
  visible,
  title,
  value,
  onChange,
  onConfirm,
  onCancel,
  placeholder,
  confirmLabel = '確認',
  loading = false,
  inputRef,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={Colors.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onConfirm}
          />
          <View style={styles.btnRow}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, loading && styles.disabled]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmText}>{loading ? '儲存中…' : confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  sheet:       { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%' },
  title:       { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
  input:       { backgroundColor: Colors.bg, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: Spacing.md, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  btnRow:      { flexDirection: 'row', columnGap: 10 },
  cancelBtn:   { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelText:  { color: Colors.sub, fontSize: 15 },
  confirmBtn:  { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.accent, alignItems: 'center' },
  confirmText: { color: Colors.bg, fontSize: 15, fontWeight: '600' },
  disabled:    { opacity: 0.5 },
})

import { type RefObject } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
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
      onShow={() => setTimeout(() => inputRef?.current?.focus(), 100)}
    >
      {/* Android 的 windowSoftInputMode 預設是 resize（Expo 56 文件註明），整個視窗（含這個
          Modal 本身）在鍵盤跳出時已經由系統原生 resize 過一次；這裡如果還用 behavior="height"
          再手動補一次高度補償，等於跟系統的 resize 互相打架，兩邊都在搶同一段高度變化的計算，
          會造成畫面/輸入框反覆跳動。Android 交給系統原生 resize 處理就好，不需要 KeyboardAvoidingView
          介入；iOS 沒有這種原生 resize 行為，仍要靠 padding 手動避開鍵盤。 */}
      <KeyboardAvoidingView
        style={styles.kavWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            returnKeyType="done"
            onSubmitEditing={() => { if (!loading) onConfirm() }}
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
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  kavWrapper:  { flex: 1 },
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

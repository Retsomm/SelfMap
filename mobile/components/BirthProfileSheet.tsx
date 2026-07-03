import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BirthDataForm, { type BirthFormData, defaultBirthFormData } from '@/components/BirthDataForm'
import { matchCity } from '@/lib/cities'
import { type BirthProfile, makeProfileId } from '@/lib/birthProfiles'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { useState, useRef, useEffect } from 'react'
import { ScrollLockContext, useScrollLockState } from '@/contexts/ScrollLockContext'
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight'

type Props = {
  visible: boolean
  initial?: BirthProfile | null
  onSave: (profile: BirthProfile) => Promise<void>
  onCancel: () => void
}

function profileToForm(p: BirthProfile): BirthFormData {
  const [year, month, day] = p.date.split('-').map(Number)
  const [hour, minute] = p.time.split(':').map(Number)
  return {
    name: p.label,
    date: { year, month, day },
    time: { hour, minute },
    city: p.location,
    timezone: p.timezone,
  }
}

export function BirthProfileSheet({ visible, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<BirthFormData>(defaultBirthFormData)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { ctx: scrollLockCtx, scrollEnabled } = useScrollLockState()
  const scrollRef = useRef<ScrollView>(null)
  const keyboardHeight = useKeyboardHeight()
  const [prevVisible, setPrevVisible] = useState(visible)

  useEffect(() => {
    if (Platform.OS === 'android' && keyboardHeight > 0) {
      scrollRef.current?.scrollToEnd({ animated: true })
    }
  }, [keyboardHeight])

  if (visible !== prevVisible) {
    setPrevVisible(visible)
    if (visible) {
      setForm(initial ? profileToForm(initial) : defaultBirthFormData())
      setFieldError(null)
    }
  }

  async function handleSave() {
    const matched = matchCity(form.city)
    if (!matched) {
      setFieldError('找不到這個地點，請確認拼字或改用資料庫中的地名')
      return
    }
    setFieldError(null)
    setSaving(true)
    try {
      const { year, month, day } = form.date
      const { hour, minute } = form.time
      await onSave({
        id: initial?.id ?? makeProfileId(),
        label: form.name.trim() || '未命名',
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        location: matched.name,
        timezone: matched.timezone,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{initial ? '編輯出生資料' : '新增出生資料'}</Text>
        </View>

        <KeyboardAvoidingView
          style={[
            { flex: 1 },
            Platform.OS === 'android' && keyboardHeight > 0 ? { marginBottom: keyboardHeight } : null,
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <ScrollLockContext.Provider value={scrollLockCtx}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
          automaticallyAdjustKeyboardInsets={false}
        >
          <BirthDataForm
            value={form}
            onChange={setForm}
            namePlaceholder="例如：本人、媽媽"
            fieldError={fieldError}
            onClearError={() => setFieldError(null)}
            onCityFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350)}
          />
        </ScrollView>
        </ScrollLockContext.Provider>

        <View style={styles.footer}>
          <Pressable onPress={onCancel} style={[styles.cancelBtn, saving && styles.disabled]} disabled={saving}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Pressable onPress={handleSave} style={[styles.saveBtn, saving && styles.disabled]} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color={Colors.bg} />
              : <Text style={styles.saveText}>儲存</Text>}
          </Pressable>
        </View>
        </KeyboardAvoidingView>
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
  title:      { color: Colors.text, fontSize: 16, fontWeight: '700' },
  body:       { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 48 },
  footer: {
    flexDirection: 'row',
    columnGap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  cancelText: { color: Colors.sub, fontSize: 15, fontWeight: '600' },
  saveText:   { color: Colors.bg, fontSize: 15, fontWeight: '600' },
  disabled:   { opacity: 0.5 },
})

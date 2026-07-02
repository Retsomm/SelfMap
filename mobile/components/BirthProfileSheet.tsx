import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BirthDataForm, { type BirthFormData, defaultBirthFormData } from '@/components/BirthDataForm'
import { matchCity } from '@/lib/cities'
import { type BirthProfile, makeProfileId } from '@/lib/birthProfiles'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { useState, useEffect, useRef } from 'react'
import { ScrollLockContext, useScrollLockState } from '@/contexts/ScrollLockContext'

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

  useEffect(() => {
    if (visible) {
      setForm(initial ? profileToForm(initial) : defaultBirthFormData())
      setFieldError(null)
    }
  }, [visible, initial])

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
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.headerBtn}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Text style={styles.title}>{initial ? '編輯出生資料' : '新增出生資料'}</Text>
          <Pressable onPress={handleSave} style={styles.headerBtn} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color={Colors.accent} style={{ alignSelf: 'flex-end' }} />
              : <Text style={styles.saveText}>儲存</Text>}
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <ScrollLockContext.Provider value={scrollLockCtx}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn:  { minWidth: 48 },
  title:      { color: Colors.text, fontSize: 16, fontWeight: '700' },
  cancelText: { color: Colors.sub, fontSize: 15 },
  saveText:      { color: Colors.accent, fontSize: 15, fontWeight: '600', textAlign: 'right' },
  saveDisabled:  { opacity: 0.4 },
  body:       { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 48 },
})

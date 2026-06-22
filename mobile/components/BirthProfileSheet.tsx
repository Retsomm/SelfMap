import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import BirthDataForm, { type BirthFormData, defaultBirthFormData } from '@/components/BirthDataForm'
import { type BirthProfile, makeProfileId } from '@/lib/birthProfiles'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { useState, useEffect } from 'react'

type Props = {
  visible: boolean
  initial?: BirthProfile | null
  onSave: (profile: BirthProfile) => Promise<void>
  onCancel: () => void
}

function profileToForm(p: BirthProfile): BirthFormData {
  return { name: p.label, date: p.date, time: p.time, city: p.location, timezone: p.timezone }
}

export function BirthProfileSheet({ visible, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<BirthFormData>(defaultBirthFormData)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (visible) {
      setForm(initial ? profileToForm(initial) : defaultBirthFormData())
      setFieldError(null)
    }
  }, [visible, initial])

  async function handleSave() {
    if (!form.city || !form.timezone) {
      setFieldError('請選擇城市')
      return
    }
    setSaving(true)
    try {
      await onSave({
        id: initial?.id ?? makeProfileId(),
        label: form.name.trim() || '未命名',
        date: form.date,
        time: form.time,
        location: form.city,
        timezone: form.timezone,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.headerBtn}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Text style={styles.title}>{initial ? '編輯出生資料' : '新增出生資料'}</Text>
          <Pressable onPress={handleSave} style={styles.headerBtn} disabled={saving}>
            <Text style={[styles.saveText, saving && styles.saveDisabled]}>儲存</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <BirthDataForm
            value={form}
            onChange={setForm}
            namePlaceholder="例如：本人、媽媽"
            fieldError={fieldError}
            onClearError={() => setFieldError(null)}
          />
        </ScrollView>
      </View>
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

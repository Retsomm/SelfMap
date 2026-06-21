import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { type BirthProfile, profileSummary } from '@/lib/birthProfiles'
import { Colors, Radius, Spacing } from '@/constants/tokens'

type Props = {
  visible: boolean
  profiles: BirthProfile[]
  onSelect: (p: BirthProfile) => void
  onClose: () => void
}

export function BirthProfilePickerModal({ visible, profiles, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />
          <Text style={s.title}>選擇出生資料</Text>
          <ScrollView>
            {profiles.map((p, i) => (
              <Pressable
                key={p.id}
                style={[s.row, i > 0 && s.sep]}
                onPress={() => { onSelect(p); onClose() }}
              >
                <Text style={s.label}>{p.label}</Text>
                <Text style={s.sub}>{profileSummary(p)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 48, maxHeight: '60%' },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  title:   { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: Spacing.sm },
  row:     { paddingVertical: Spacing.md },
  sep:     { borderTopWidth: 1, borderTopColor: Colors.border },
  label:   { color: Colors.text, fontSize: 15, fontWeight: '600' },
  sub:     { color: Colors.sub, fontSize: 12, marginTop: 3 },
})

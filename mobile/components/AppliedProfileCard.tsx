import { Pressable, StyleSheet, Text, View } from 'react-native'
import { type BirthProfile, profileSummary } from '@/lib/birthProfiles'
import { Colors, Radius, Spacing } from '@/constants/tokens'

type Props = {
  profile: BirthProfile
  onClear: () => void
}

export function AppliedProfileCard({ profile, onClear }: Props) {
  return (
    <View style={s.card}>
      <View style={s.row}>
        <Text style={s.label}>{profile.label}</Text>
        <Pressable onPress={onClear} hitSlop={8}>
          <Text style={s.change}>更換</Text>
        </Pressable>
      </View>
      <Text style={s.sub}>{profileSummary(profile)}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  card:   { backgroundColor: Colors.accentD, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.accent },
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label:  { color: Colors.accent, fontSize: 15, fontWeight: '700' },
  change: { color: Colors.sub, fontSize: 13 },
  sub:    { color: Colors.text, fontSize: 13 },
})

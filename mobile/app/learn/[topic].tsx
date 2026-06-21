import { useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import {
  HD_TYPE_CONTENT,
  HD_AUTHORITY_CONTENT,
  HD_PROFILE_CONTENT,
  HD_DEFINITION_CONTENT,
} from '@/lib/hd-summary-data'
import { SummaryList } from '@/components/learn/SummaryList'
import { CenterList }  from '@/components/learn/CenterList'
import { ChannelList } from '@/components/learn/ChannelList'
import { GateList }    from '@/components/learn/GateList'
import { Colors, Spacing } from '@/constants/tokens'

const TITLE: Record<string, string> = {
  type:       '五大類型',
  authority:  '內在權威',
  profile:    '人生角色',
  definition: '五大定義',
  center:     '九大中心',
  channel:    '通道',
  gate:       '閘門',
}

export default function TopicScreen() {
  const { topic } = useLocalSearchParams<{ topic: string }>()
  const router = useRouter()

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Text style={s.backText}>‹ 返回</Text>
        </Pressable>
        <Text style={s.headerTitle}>{TITLE[topic] ?? topic}</Text>
        <View style={{ width: 60 }} />
      </View>

      {topic === 'type'       && <SummaryList data={HD_TYPE_CONTENT}       categoryLabel="能量類型" />}
      {topic === 'authority'  && <SummaryList data={HD_AUTHORITY_CONTENT}  categoryLabel="內在權威" />}
      {topic === 'profile'    && <SummaryList data={HD_PROFILE_CONTENT}    categoryLabel="人生角色" />}
      {topic === 'definition' && <SummaryList data={HD_DEFINITION_CONTENT} categoryLabel="五大定義" />}
      {topic === 'center'     && <CenterList />}
      {topic === 'channel'    && <ChannelList />}
      {topic === 'gate'       && <GateList />}
      {!['type','authority','profile','definition','center','channel','gate'].includes(topic) && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.sub, fontSize: 15 }}>此主題尚未支援</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:     {},
  backText:    { color: Colors.accent, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
})

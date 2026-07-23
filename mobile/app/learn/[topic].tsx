import { useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  HD_TYPE_CONTENT,
  HD_AUTHORITY_CONTENT,
  HD_PROFILE_CONTENT,
  HD_DEFINITION_CONTENT,
} from '@shared/humanDesign/hd-summary-data'
import { SummaryList }    from '@/components/learn/SummaryList'
import { CenterList }     from '@/components/learn/CenterList'
import { ChannelList }    from '@/components/learn/ChannelList'
import { GateList }       from '@/components/learn/GateList'
import { TransitLearn }   from '@/components/learn/TransitLearn'
import { CompositeLearn } from '@/components/learn/CompositeLearn'
import { NavBackHeader }  from '@/components/NavBackHeader'
import { type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'

const TITLE: Record<string, string> = {
  type:       '五大類型',
  authority:  '內在權威',
  profile:    '人生角色',
  definition: '五大定義',
  center:     '九大中心',
  channel:    '通道',
  gate:       '閘門',
  transit:    '流日',
  composite:  '合圖分析',
}
const SUPPORTED_TOPICS = new Set(Object.keys(TITLE))

export default function TopicScreen() {
  const { topic } = useLocalSearchParams<{ topic: string }>()
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])

  return (
    <SafeAreaView style={s.container}>
      <NavBackHeader title={TITLE[topic] ?? topic} />

      {topic === 'type'       && <SummaryList data={HD_TYPE_CONTENT}       categoryLabel="能量類型" />}
      {topic === 'authority'  && <SummaryList data={HD_AUTHORITY_CONTENT}  categoryLabel="內在權威" />}
      {topic === 'profile'    && <SummaryList data={HD_PROFILE_CONTENT}    categoryLabel="人生角色" />}
      {topic === 'definition' && <SummaryList data={HD_DEFINITION_CONTENT} categoryLabel="五大定義" />}
      {topic === 'center'     && <CenterList />}
      {topic === 'channel'    && <ChannelList />}
      {topic === 'gate'       && <GateList />}
      {topic === 'transit'    && <TransitLearn />}
      {topic === 'composite'  && <CompositeLearn />}
      {!SUPPORTED_TOPICS.has(topic) && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.sub, fontSize: 15 }}>此主題尚未支援</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
})

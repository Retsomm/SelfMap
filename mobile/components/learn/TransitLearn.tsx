import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Colors, Radius, Spacing } from '@/constants/tokens'

const SECTIONS = [
  {
    step: '01',
    title: '什麼是流日？',
    body: '流日指的是此刻天空中行星所在的閘門位置。和你出生時行星「定格」的閘門不同，流日每天都在移動——它會補足你設計中的某個閘門、帶來你本來沒有的通道，有時也會暫時啟動你平常開放空白的中心。\n\n換句話說，你的出生圖是你固定的藍圖，流日則是每天從外部「加進來」的可變部分。',
  },
  {
    step: '02',
    title: '流日如何影響你？',
    body: '當流日閘門補足你本身的閘門而形成「完整通道」時，對應的中心就會被暫時定義。你可能會感受到比平常更強烈的動力、靈感或情緒衝動——這些感受是真實的，但它們來自外在的星象，不是你固定配備的能量。\n\n流日帶來的影響有三種常見型態：\n・空白中心被暫時啟動（情緒或衝動感上升）\n・全新通道出現（出現平時沒有的強烈驅動力）\n・補完通道（感受到「完整」，但能量退去後容易失落）',
  },
  {
    step: '03',
    title: '換個角度：風險與資源',
    body: '流日是一把雙面刃，關鍵在於你怎麼用它。\n\n⚠️ 風險（往壞處想）\n那不是你「真正的配備」。當這股平時沒有的動力突然湧現，頭腦很容易上癮，誤以為自己從此都能這麼厲害，進而做出超出本身負荷的長期承諾。幾天後能量退去，就可能迎來深深的疲憊與挫折感。\n\n✅ 資源（往好處想）\n把它當成宇宙每天發給你的「限定體驗卡」。你平常開放的中心就像一塊海綿，隨時準備體驗不同能量——這是天賦，不是弱點。流日補上那張卡時，你可以：\n・借來執行拖延已久的任務\n・享受那股暫時的靈感或敏銳度\n・體驗平時不熟悉的能量模式',
  },
  {
    step: '04',
    title: '怎麼用最好？',
    body: '掌握一個最高原則：\n\n「只享受過程，不留戀結果；可以用來執行，不要用來做決定。」\n\n在流日讓你動力充沛的時候，盡情工作、創作、享受那股敏銳。但不要在被流日定義的地方，做出需要長久負責的重大承諾。\n\n流日是衣服，你才是穿衣服的人。今天穿了一件很適合衝刺的運動服，就盡情奔跑；明天衣服換了，換個節奏生活就好。無論流日如何變化，始終以自己的內在權威做最終決定——那才是你設計裡不會改變的核心。',
  },
]

export function TransitLearn() {
  return (
    <ScrollView contentContainerStyle={s.inner}>
      <Text style={s.intro}>
        流日是你的人類圖與宇宙每日節奏的交會點。了解它，才能把暫時的天賦借來用，而不是被它帶著走。
      </Text>

      {SECTIONS.map((sec, i) => (
        <View key={sec.step} style={[s.card, i === SECTIONS.length - 1 && s.cardHighlight]}>
          <View style={s.stepRow}>
            <Text style={[s.stepNum, i === SECTIONS.length - 1 && s.stepNumHighlight]}>{sec.step}</Text>
            <Text style={[s.stepTitle, i === SECTIONS.length - 1 && s.stepTitleHighlight]}>{sec.title}</Text>
          </View>
          <Text style={s.body}>{sec.body}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  inner: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 48 },

  intro: { fontSize: 14, color: Colors.sub, lineHeight: 22, marginBottom: 4 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: 10,
  },
  cardHighlight: {
    borderColor: Colors.transit,
    borderLeftWidth: 3,
  },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum: { fontSize: 11, fontWeight: '800', color: Colors.muted, letterSpacing: 1.5 },
  stepNumHighlight: { color: Colors.transit },
  stepTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  stepTitleHighlight: { color: Colors.transit },

  body: { fontSize: 13, color: Colors.sub, lineHeight: 21 },

})

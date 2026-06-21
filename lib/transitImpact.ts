import { CHANNEL_DEFS } from '@/lib/humanDesign'
import type { CenterName, ChannelDef } from '@/lib/humanDesign/types'

const CENTER_ZH: Record<CenterName, string> = {
  head: '頭頂中心', ajna: '心智中心', throat: '喉嚨中心', g: 'G 中心',
  ego: '意志力中心', sacral: '薦骨中心', solarPlexus: '情緒中心',
  spleen: '脾臟中心', root: '根部中心',
}

export interface ImpactLayer {
  kind: 'center-activated' | 'new-channel' | 'completing-channel'
  label: string
  detail: string
}

export function computeImpact(
  personalGates: Set<number>,
  personalCenterIds: Set<CenterName>,
  personalChannels: ChannelDef[],
  transitGates: Set<number>,
  transitCenterIds: Set<CenterName>,
  transitChannels: ChannelDef[],
): ImpactLayer[] {
  const layers: ImpactLayer[] = []

  for (const cId of transitCenterIds) {
    if (!personalCenterIds.has(cId)) {
      layers.push({
        kind: 'center-activated',
        label: CENTER_ZH[cId] ?? cId,
        detail: `你原本開放的${CENTER_ZH[cId] ?? cId}，今天因流日被暫時定義，可能帶來不熟悉的衝動或情緒底色。`,
      })
    }
  }

  for (const ch of transitChannels) {
    const inPersonal = personalGates.has(ch.gateA) || personalGates.has(ch.gateB)
    const alreadyDefined = personalChannels.some(pc => pc.id === ch.id)
    if (!inPersonal && !alreadyDefined) {
      layers.push({
        kind: 'new-channel',
        label: ch.id,
        detail: `流日帶來你原本沒有的通道 ${ch.id}，你可能會想用這個頻率做事，但完全不屬於你原本的設計。`,
      })
    }
  }

  for (const ch of CHANNEL_DEFS) {
    const aInP = personalGates.has(ch.gateA)
    const bInP = personalGates.has(ch.gateB)
    const aInT = transitGates.has(ch.gateA)
    const bInT = transitGates.has(ch.gateB)
    if (personalChannels.some(pc => pc.id === ch.id)) continue
    if ((aInP && !bInP && bInT) || (bInP && !aInP && aInT)) {
      layers.push({
        kind: 'completing-channel',
        label: ch.id,
        detail: `你本身有通道 ${ch.id} 其中一端，流日補上另一端，你會短暫感受到完整通道的感覺，能量散去後容易有失落感。`,
      })
    }
  }

  return layers
}

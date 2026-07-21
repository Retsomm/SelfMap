import { Pressable, StyleSheet, Text, View } from 'react-native'
import { type Chart, type StoredPlanet } from '@/lib/api'
import { HD_CENTERS_INFO, ACT_CONSCIOUS, ACT_UNCONSCIOUS } from '@/lib/hd-chart-data'
import { findChannelById } from '@/lib/hd-normalizers'
import { getTypeMeta, getTypeLabel } from '@/lib/hd-type-meta'
import { type SheetTarget } from '@/components/DetailBottomSheet'
import { SectionCard, Row, Tag } from '@/components/chart/ChartPrimitives'
import { Colors, Radius, Spacing } from '@/constants/tokens'

type Activations = Record<number, { c?: boolean; u?: boolean; t?: boolean }>

type Props = {
  chart: Chart
  personalChartCenterIds: Set<string>
  activations: Activations
  planets: StoredPlanet[]
  open: (target: SheetTarget) => void
}

/** 個人圖專屬區塊：類型／設計／九大中心／通道／行星閘門對照／激活閘門／輪迴交叉／四箭頭 */
export default function PersonalChartDetails({ chart, personalChartCenterIds, activations, planets, open }: Props) {
  const typeMeta = getTypeMeta(chart.type)

  return (
    <>
      <SectionCard title="類型">
        <Row label="能量類型" value={getTypeLabel(chart.type)} accent tappable onPress={() => open({ kind: 'type', typeKey: chart.type })} />
        <Row label="策略" value={typeMeta.strategy} />
        <Row label="簽名（成功徵兆）" value={typeMeta.signature} accent />
        <Row label="非自我主題" value={typeMeta.notSelf} dim />
      </SectionCard>

      <SectionCard title="設計">
        <Row label="內在權威" value={chart.authority} accent tappable onPress={() => open({ kind: 'authority', authorityKey: chart.authority })} />
        <Row label="人生角色（Profile）" value={chart.profile} tappable onPress={() => open({ kind: 'profile', profile: chart.profile })} />
        <Row label="定義" value={chart.definition} tappable onPress={() => open({ kind: 'definition', definitionKey: chart.definition })} />
      </SectionCard>

      <SectionCard title="九大中心">
        <View style={styles.tagRow}>
          {Object.keys(HD_CENTERS_INFO).map((chartKey) => {
            const info    = HD_CENTERS_INFO[chartKey]
            const defined = personalChartCenterIds.has(chartKey)
            return (
              <Tag
                key={chartKey}
                label={info.name.zh}
                active={defined}
                onPress={() => open({ kind: 'center', id: chartKey, defined })}
              />
            )
          })}
        </View>
      </SectionCard>

      {chart.channels.length > 0 && (
        <SectionCard title={`定義通道（${chart.channels.length}）`}>
          <View style={styles.tagRow}>
            {chart.channels.map((rawCh) => {
              const ch    = findChannelById(rawCh)
              const label = ch ? `${ch.from}–${ch.to}` : rawCh
              return (
                <Tag key={rawCh} label={label} active onPress={ch ? () => open({ kind: 'channel', channel: ch }) : undefined} />
              )
            })}
          </View>
        </SectionCard>
      )}

      {planets.length > 0 && (
        <SectionCard title="行星閘門對照">
          <View style={styles.planetHeader}>
            <Text style={[styles.planetCol, styles.planetHeaderText]}>行星</Text>
            <Text style={[styles.planetGateCol, styles.planetHeaderText, { color: Colors.muted }]}>● 意識（黑）</Text>
            <Text style={[styles.planetGateCol, styles.planetHeaderText, { color: Colors.designRed }]}>● 潛意識（紅）</Text>
          </View>
          {planets.map((p, i) => (
            <View key={i} style={[styles.planetRow, i % 2 === 1 && styles.planetRowAlt]}>
              <Text style={styles.planetCol}>{p.name}</Text>
              <Text style={[styles.planetGateCol, styles.planetBlack]}>{p.blackGate}.{p.blackLine}</Text>
              <Text style={[styles.planetGateCol, styles.planetRed]}>{p.redGate}.{p.redLine}</Text>
            </View>
          ))}
        </SectionCard>
      )}

      <SectionCard title={`激活閘門（${chart.gates.length}）`}>
        <View style={styles.gateGrid}>
          {[...chart.gates].sort((a, b) => a - b).map((g) => {
            const state = activations[g]
            const isDual = !!(state?.c && state?.u)
            const soloFill = isDual ? null : state?.c ? ACT_CONSCIOUS : state?.u ? ACT_UNCONSCIOUS : null
            const isActive = isDual || !!soloFill
            return (
              <Pressable
                key={g}
                style={[
                  styles.gate,
                  isDual && { backgroundColor: ACT_CONSCIOUS, borderColor: ACT_CONSCIOUS },
                  soloFill && { backgroundColor: soloFill, borderColor: soloFill },
                ]}
                onPress={() => open({ kind: 'gate', num: g })}
              >
                {({ pressed }) => (
                  <>
                    {isDual && <View style={styles.gateDualOverlay} />}
                    <Text style={[styles.gateText, isActive && styles.gateTextActive, pressed && styles.gateTextPressed]}>
                      {g}
                    </Text>
                  </>
                )}
              </Pressable>
            )
          })}
        </View>
      </SectionCard>

      {/* 輪迴交叉 */}
      {chart.meta?.incarnationCross && (() => {
        const ic = chart.meta!.incarnationCross!
        const sheetTarget = {
          kind: 'incarnationCross' as const,
          crossType:      ic.crossType,
          crossTypeLabel: ic.crossTypeLabel,
          crossBaseName:  ic.crossBaseName,
          variant:        ic.variant,
          gatesLabel:     ic.gatesLabel,
          sunGate:        ic.sunGate,
        }
        return (
          <Pressable onPress={() => open(sheetTarget)} style={({ pressed }) => [styles.crossCard, pressed && styles.crossCardPressed]}>
            <Text style={styles.crossCardTitle}>輪迴交叉</Text>
            <Text style={styles.crossFullName}>
              {ic.crossTypeLabel}之{ic.crossBaseName}{ic.variant}
            </Text>
            <Text style={styles.crossGates}>閘門組合：{ic.gatesLabel}</Text>
            <Text style={styles.crossHint}>點擊查看說明 ›</Text>
          </Pressable>
        )
      })()}

      {/* 四箭頭 */}
      {chart.meta?.variables && chart.meta?.arrows && (
        <SectionCard title="四箭頭（Variables）">
          <View style={styles.arrowsGrid}>
            <View style={styles.arrowsCol}>
              <Text style={styles.arrowsSide}>← Design（紅）</Text>
              <View style={styles.arrowItem}>
                <Text style={styles.arrowDir}>{chart.meta.arrows.topLeft ? '←' : '→'}</Text>
                <View style={styles.arrowInfo}>
                  <Text style={styles.arrowCategory}>飲食（Digestion）</Text>
                  <Text style={styles.arrowLabel}>{chart.meta.variables.digestion.label}</Text>
                  <Text style={styles.arrowDesc}>{chart.meta.variables.digestion.description}</Text>
                </View>
              </View>
              <View style={styles.arrowItem}>
                <Text style={styles.arrowDir}>{chart.meta.arrows.bottomLeft ? '←' : '→'}</Text>
                <View style={styles.arrowInfo}>
                  <Text style={styles.arrowCategory}>環境（Environment）</Text>
                  <Text style={styles.arrowLabel}>{chart.meta.variables.environment.label}</Text>
                  <Text style={styles.arrowDesc}>{chart.meta.variables.environment.description}</Text>
                </View>
              </View>
            </View>
            <View style={styles.arrowsCol}>
              <Text style={styles.arrowsSide}>Personality（黑）→</Text>
              <View style={styles.arrowItem}>
                <Text style={styles.arrowDir}>{chart.meta.arrows.topRight ? '←' : '→'}</Text>
                <View style={styles.arrowInfo}>
                  <Text style={styles.arrowCategory}>動機（Motivation）</Text>
                  <Text style={styles.arrowLabel}>{chart.meta.variables.motivation.label}</Text>
                  <Text style={styles.arrowDesc}>{chart.meta.variables.motivation.description}</Text>
                </View>
              </View>
              <View style={styles.arrowItem}>
                <Text style={styles.arrowDir}>{chart.meta.arrows.bottomRight ? '←' : '→'}</Text>
                <View style={styles.arrowInfo}>
                  <Text style={styles.arrowCategory}>觀點（Perspective）</Text>
                  <Text style={styles.arrowLabel}>{chart.meta.variables.perspective.label}</Text>
                  <Text style={styles.arrowDesc}>{chart.meta.variables.perspective.description}</Text>
                </View>
              </View>
            </View>
          </View>
        </SectionCard>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 6 },

  gateGrid:    { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.sm, rowGap: Spacing.sm },
  gate:        { backgroundColor: Colors.gateBg, borderRadius: Radius.sm, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.gateBorder, overflow: 'hidden' },
  gateDualOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', backgroundColor: Colors.designRed },
  gateText:        { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  gateTextActive:  { color: '#ffffff' },
  gateTextPressed: { fontSize: 17, fontWeight: '800' },

  planetHeader:     { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.xs },
  planetHeaderText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.sub },
  planetRow:        { flexDirection: 'row', paddingVertical: 5 },
  planetRowAlt:     { backgroundColor: Colors.altRowBg, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, borderRadius: 6 },
  planetCol:        { flex: 1.2, fontSize: 13, color: Colors.sub },
  planetGateCol:    { flex: 1, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  planetBlack:      { color: Colors.text },
  planetRed:        { color: Colors.planetRedText },

  crossCard:        { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  crossCardPressed: { borderColor: Colors.accent, backgroundColor: Colors.accentD },
  crossCardTitle:   { color: Colors.sub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  crossFullName:    { color: Colors.accent, fontSize: 16, fontWeight: '700' },
  crossGates:       { color: Colors.sub, fontSize: 13 },
  crossHint:        { color: Colors.muted, fontSize: 12, alignSelf: 'flex-end' } as const,

  arrowsGrid:    { flexDirection: 'column', gap: Spacing.lg, padding: Spacing.md },
  arrowsCol:     { gap: Spacing.md },
  arrowsSide:    { fontSize: 14, color: Colors.muted, fontWeight: '600', marginBottom: 2 },
  arrowItem:     { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  arrowDir:      { fontSize: 22, color: Colors.accent, fontWeight: '700', width: 24, lineHeight: 26 },
  arrowInfo:     { flex: 1, gap: 3 },
  arrowCategory: { fontSize: 12, color: Colors.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  arrowLabel:    { fontSize: 17, color: Colors.text, fontWeight: '700' },
  arrowDesc:     { fontSize: 13, color: Colors.sub, lineHeight: 18 },
})

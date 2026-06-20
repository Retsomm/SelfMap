import { useRef, useEffect, useCallback } from 'react'
import { ScrollView, Text, View, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'

const ITEM_H = 44
const VISIBLE = 5  // 顯示 5 行，中間那行是選中的

type Props = {
  items: string[]
  selectedIndex: number
  onSelect: (index: number) => void
  width?: number
}

export default function WheelPicker({ items, selectedIndex, onSelect, width = 80 }: Props) {
  const ref = useRef<ScrollView>(null)
  const isMounting = useRef(true)

  useEffect(() => {
    const offset = selectedIndex * ITEM_H
    ref.current?.scrollTo({ y: offset, animated: !isMounting.current })
    isMounting.current = false
  }, [selectedIndex])

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y
      const idx = Math.round(y / ITEM_H)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      onSelect(clamped)
    },
    [items.length, onSelect],
  )

  return (
    <View style={[styles.container, { width }]}>
      {/* 上下兩條選取線 */}
      <View style={[styles.line, { top: ITEM_H * 2 }]} pointerEvents="none" />
      <View style={[styles.line, { top: ITEM_H * 3 - 1 }]} pointerEvents="none" />

      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        style={{ height: ITEM_H * VISIBLE }}
      >
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <Text style={[styles.text, i === selectedIndex && styles.selected]}>
              {item}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#3e3e5e',
    zIndex: 1,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 18, color: '#555577' },
  selected: { color: '#fff', fontWeight: '600', fontSize: 20 },
})

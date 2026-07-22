import { useRef, useEffect, useCallback, useMemo } from 'react'
import { ScrollView, Text, View, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'
import { useScrollLock } from '@/contexts/ScrollLockContext'

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
  const isLocked = useRef(false)
  const { lockScroll, unlockScroll } = useScrollLock()
  const Colors = useThemeColors()
  const styles = useMemo(() => createStyles(Colors), [Colors])

  useEffect(() => {
    const offset = selectedIndex * ITEM_H
    ref.current?.scrollTo({ y: offset, animated: !isMounting.current })
    isMounting.current = false
  }, [selectedIndex])

  const doLock = useCallback(() => {
    if (!isLocked.current) {
      isLocked.current = true
      lockScroll()
    }
  }, [lockScroll])

  const doUnlock = useCallback(() => {
    if (isLocked.current) {
      isLocked.current = false
      unlockScroll()
    }
  }, [unlockScroll])

  useEffect(() => {
    return () => { doUnlock() }
  }, [doUnlock])

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      doUnlock()
      const y = e.nativeEvent.contentOffset.y
      const idx = Math.round(y / ITEM_H)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      onSelect(clamped)
    },
    [items.length, onSelect, doUnlock],
  )

  return (
    <View style={[styles.container, { width }]}>
      <View style={[styles.line, { top: ITEM_H * 2 }]} pointerEvents="none" />
      <View style={[styles.line, { top: ITEM_H * 3 - 1 }]} pointerEvents="none" />

      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        onScrollBeginDrag={doLock}
        onScrollEndDrag={doUnlock}
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

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text:     { fontSize: 18, color: Colors.muted },
  selected: { color: Colors.text, fontWeight: '600', fontSize: 20 },
})

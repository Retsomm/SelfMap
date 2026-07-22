import { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Radius, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'
import TimezonePickerModal from '@/components/TimezonePickerModal'

type Props = {
  city: string
  timezone: string
  onChangeCity: (city: string) => void
  onSelectTimezone: (city: string, timezone: string) => void
  onFocus?: () => void
}

function IconClock({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M12 7v5l3.5 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

/**
 * 純文字輸入欄位，不再即時顯示下拉選單。
 * 地點比對（依名稱找出時區）由送出表單時觸發，見各表單的送出邏輯搭配 lib/cities.ts 的 matchCity()。
 * 旁邊的時鐘按鈕則是手動選時區的入口，選了之後直接帶入 city/timezone，送出時會跳過 matchCity。
 */
export default function CitySearchField({ city, timezone, onChangeCity, onSelectTimezone, onFocus }: Props) {
  const [tzModalVisible, setTzModalVisible] = useState(false)
  const handleClear = useCallback(() => onChangeCity(''), [onChangeCity])
  const Colors = useThemeColors()
  const styles = useMemo(() => createStyles(Colors), [Colors])

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={onChangeCity}
          onFocus={onFocus}
          placeholder="輸入城市名稱"
          placeholderTextColor={Colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {city.length > 0 && (
          <Pressable style={styles.clear} onPress={handleClear}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
        <Pressable
          style={styles.tzButton}
          onPress={() => setTzModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="手動選擇時區"
        >
          <IconClock color={Colors.sub} />
        </Pressable>
      </View>

      {timezone ? (
        <View style={styles.tzBadge}>
          <Text style={styles.tzText}>時區 {timezone}</Text>
        </View>
      ) : null}

      <TimezonePickerModal
        visible={tzModalVisible}
        onSelect={(zone, label) => onSelectTimezone(label, zone)}
        onClose={() => setTzModalVisible(false)}
      />
    </View>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
  },
  clear:     { paddingHorizontal: 14, paddingVertical: 12 },
  tzButton:  { paddingHorizontal: 14, paddingVertical: 12, borderLeftWidth: 1, borderLeftColor: Colors.border },
  clearText: { color: Colors.muted, fontSize: 14 },
  tzBadge:    { marginTop: 6, paddingHorizontal: 4 },
  tzText:     { color: Colors.accent, fontSize: 12 },
})

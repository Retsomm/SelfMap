import { useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native'
import { Colors, Radius } from '@/constants/tokens'

type Props = {
  city: string
  timezone: string
  onChangeCity: (city: string) => void
  onFocus?: () => void
}

/**
 * 純文字輸入欄位，不再即時顯示下拉選單。
 * 地點比對（依名稱找出時區）由送出表單時觸發，見各表單的送出邏輯搭配 lib/cities.ts 的 matchCity()。
 */
export default function CitySearchField({ city, timezone, onChangeCity, onFocus }: Props) {
  const handleClear = useCallback(() => onChangeCity(''), [onChangeCity])

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={onChangeCity}
          onFocus={onFocus}
          placeholder="輸入城市名稱，送出時自動比對時區…"
          placeholderTextColor={Colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {city.length > 0 && (
          <Pressable style={styles.clear} onPress={handleClear}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {timezone ? (
        <View style={styles.tzBadge}>
          <Text style={styles.tzText}>時區 {timezone}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
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
  clearText: { color: Colors.muted, fontSize: 14 },
  tzBadge:    { marginTop: 6, paddingHorizontal: 4 },
  tzText:     { color: Colors.accent, fontSize: 12 },
})

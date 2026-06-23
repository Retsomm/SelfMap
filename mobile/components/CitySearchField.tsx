import { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native'
import { searchCities, type City } from '@/lib/cities'
import { Colors, Radius } from '@/constants/tokens'

type Props = {
  city: string
  timezone: string
  onSelect: (city: string, timezone: string) => void
  onFocus?: () => void
}

export default function CitySearchField({ city, timezone, onSelect, onFocus }: Props) {
  const [query, setQuery] = useState(city)
  const [results, setResults] = useState<City[]>([])
  const [focused, setFocused] = useState(false)
  const isSelectingRef = useRef(false)

  const handleChange = useCallback((text: string) => {
    setQuery(text)
    setResults(searchCities(text))
    onSelect('', '')
  }, [onSelect])

  const handleSelect = useCallback((c: City) => {
    isSelectingRef.current = false
    setQuery(c.display)
    setResults([])
    setFocused(false)
    onSelect(c.name, c.timezone)
  }, [onSelect])

  const handleClear = useCallback(() => {
    setQuery('')
    setResults([])
    onSelect('', '')
  }, [onSelect])

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          onFocus={() => { setFocused(true); setResults(searchCities(query)); onFocus?.() }}
          onBlur={() => setTimeout(() => { if (!isSelectingRef.current) setFocused(false) }, 150)}
          placeholder="輸入城市名稱…"
          placeholderTextColor={Colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable style={styles.clear} onPress={handleClear}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {focused && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(c) => c.name + c.country}
          scrollEnabled={false}
          style={styles.dropdown}
          renderItem={({ item }) => (
            <Pressable style={styles.option} onPressIn={() => { isSelectingRef.current = true }} onPressOut={() => { isSelectingRef.current = false }} onPress={() => handleSelect(item)}>
              <Text style={styles.optionCity}>{item.display}</Text>
              <Text style={styles.optionTz}>{item.timezone}</Text>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

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
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    maxHeight: 280,
  },
  option:     { paddingHorizontal: 14, paddingVertical: 12 },
  optionCity: { color: Colors.text, fontSize: 15 },
  optionTz:   { color: Colors.sub, fontSize: 12, marginTop: 2 },
  sep:        { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },
  tzBadge:    { marginTop: 6, paddingHorizontal: 4 },
  tzText:     { color: Colors.accent, fontSize: 12 },
})

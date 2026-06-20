import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native'
import { searchCities, type City } from '@/lib/cities'

type Props = {
  city: string
  timezone: string
  onSelect: (city: string, timezone: string) => void
}

export default function CitySearchField({ city, timezone, onSelect }: Props) {
  const [query, setQuery] = useState(city)
  const [results, setResults] = useState<City[]>([])
  const [focused, setFocused] = useState(false)

  const handleChange = useCallback((text: string) => {
    setQuery(text)
    setResults(searchCities(text))
    if (!text) onSelect('', '')
  }, [onSelect])

  const handleSelect = useCallback((c: City) => {
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
          onFocus={() => { setFocused(true); setResults(searchCities(query)) }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="輸入城市名稱…"
          placeholderTextColor="#555577"
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
            <Pressable style={styles.option} onPress={() => handleSelect(item)}>
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
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e2e4e',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  clear: { paddingHorizontal: 14, paddingVertical: 12 },
  clearText: { color: '#555577', fontSize: 14 },
  dropdown: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3e3e5e',
    marginTop: 4,
    maxHeight: 280,
  },
  option: { paddingHorizontal: 14, paddingVertical: 12 },
  optionCity: { color: '#fff', fontSize: 15 },
  optionTz: { color: '#6666aa', fontSize: 12, marginTop: 2 },
  sep: { height: 1, backgroundColor: '#2e2e4e', marginHorizontal: 14 },
  tzBadge: { marginTop: 6, paddingHorizontal: 4 },
  tzText: { color: '#a78bfa', fontSize: 12 },
})

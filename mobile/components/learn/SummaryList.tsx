import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { type SummaryContent } from '@shared/humanDesign/hd-summary-data'
import { ls } from './learnStyles'

interface Props {
  data: Record<string, SummaryContent>
  categoryLabel: string
}

export function SummaryList({ data, categoryLabel }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (key: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const entries = Object.entries(data)

  return (
    <ScrollView contentContainerStyle={ls.inner}>
      <Text style={ls.countLabel}>{entries.length} 種{categoryLabel}</Text>
      {entries.map(([key, d]) => {
        const open = expanded.has(key)
        return (
          <View key={key} style={ls.accordionCard}>
            <Pressable
              style={ls.accordionHeader}
              onPress={() => toggle(key)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
            >
              <View style={{ flex: 1 }}>
                {d.subtitle ? <Text style={ls.acSubtitle}>{d.subtitle}</Text> : null}
                <Text style={ls.acTitle}>{d.title}</Text>
                <Text style={ls.acIntro} numberOfLines={open ? undefined : 2}>{d.intro}</Text>
              </View>
              <Text style={[ls.chevron, open && ls.chevronOpen]}>›</Text>
            </Pressable>

            {open && (
              <View style={ls.accordionBody}>
                {d.paragraphs.map((p, i) => (
                  <Text key={i} style={ls.paragraph}>{p}</Text>
                ))}
                {d.highlights && d.highlights.length > 0 && (
                  <View style={ls.highlights}>
                    {d.highlights.map((h, i) => (
                      <View key={i} style={ls.highlightCard}>
                        <Text style={ls.highlightLabel}>{h.label}</Text>
                        <Text style={ls.highlightBody}>{h.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}

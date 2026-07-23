import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'

type Props = { children: React.ReactNode; fallbackTitle?: string }
type State = { error: Error | null }

// class component 不能呼叫 hook，主題色改由這個 function component 承接後往下傳
function ErrorFallback({ title, onReset }: { title: string; onReset: () => void }) {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>發生未預期的錯誤，請點擊重試。</Text>
      <Pressable style={styles.btn} onPress={onReset}>
        <Text style={styles.btnText}>重試</Text>
      </Pressable>
    </View>
  )
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return <ErrorFallback title={this.props.fallbackTitle ?? '發生錯誤'} onReset={this.handleReset} />
    }
    return this.props.children
  }
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  title:   { color: Colors.red, fontSize: 18, fontWeight: '700' },
  message: { color: Colors.sub, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  btn:     { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  btnText: { color: Colors.sub, fontSize: 14 },
})

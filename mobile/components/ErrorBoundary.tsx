import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, Radius, Spacing } from '@/constants/tokens'

type Props = { children: React.ReactNode; fallbackTitle?: string }
type State = { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  handleReset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{this.props.fallbackTitle ?? '發生錯誤'}</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Pressable style={styles.btn} onPress={this.handleReset}>
            <Text style={styles.btnText}>重試</Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
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

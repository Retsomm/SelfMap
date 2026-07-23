import { useMemo } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'

export function LoadingView() {
  const Colors = useThemeColors()
  const styles = useMemo(() => createStyles(Colors), [Colors])
  return <ActivityIndicator color={Colors.accent} style={styles.centered} />
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const Colors = useThemeColors()
  const styles = useMemo(() => createStyles(Colors), [Colors])
  return (
    <View style={styles.centered}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>重試</Text>
        </Pressable>
      )}
    </View>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  message: { color: Colors.red, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  retryBtn:{ borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  retryText:{ color: Colors.sub, fontSize: 13 },
})

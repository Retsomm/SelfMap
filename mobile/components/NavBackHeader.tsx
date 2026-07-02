import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, Spacing } from '@/constants/tokens'

// 純箭頭返回鍵，避免使用原生 header：iOS 26 Liquid Glass 會強制在原生 header
// 的左右按鈕外包一層白色玻璃背景，無法透過 headerLeft 自訂內容關閉
export function NavBackHeader({ title }: { title: string }) {
  const router = useRouter()

  return (
    <View style={s.header}>
      <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
        <Text style={s.backText}>‹</Text>
      </Pressable>
      <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:     { width: 24 },
  backText:    { color: Colors.text, fontSize: 28, fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
})

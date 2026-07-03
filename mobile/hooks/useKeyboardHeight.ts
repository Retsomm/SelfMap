import { useEffect, useState } from 'react'
import { Keyboard } from 'react-native'

/**
 * Android 專用：Expo edge-to-edge 下 KeyboardAvoidingView behavior="height" 不可靠，
 * 改用實測鍵盤高度手動補 paddingBottom，見 mobile/app/(tabs)/create.tsx 用法。
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => setHeight(e.endCoordinates.height))
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setHeight(0))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  return height
}

import * as WebBrowser from 'expo-web-browser'
import { useEffect } from 'react'
import { View } from 'react-native'

// Clerk OAuth redirect 的落地頁，必須存在才不會 404
// WebBrowser.maybeCompleteAuthSession() 會偵測到這是 callback 並自動關閉 browser
WebBrowser.maybeCompleteAuthSession()

export default function OAuthNativeCallback() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession()
  }, [])

  return <View />
}

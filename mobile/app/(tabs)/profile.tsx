import { useAuth, useUser } from '@clerk/expo'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'
import { SubTabBar } from '@/components/SubTabBar'
import { InputModal } from '@/components/InputModal'
import { BirthProfileSheet } from '@/components/BirthProfileSheet'
import ChartListView from '@/components/ChartListView'
import NotificationsView from '@/components/NotificationsView'
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn'
import { useLineSignIn } from '@/hooks/useLineSignIn'
import {
  type BirthProfile,
  loadProfiles,
  saveProfile,
  deleteProfile,
  profileSummary,
} from '@/lib/birthProfiles'
import { type Chart, getCharts, getChart, deleteAccount } from '@/lib/api'

type OuterTab = 'charts' | 'personal' | 'notifications'
const OUTER_TABS = [
  { id: 'charts',        label: '我的圖表' },
  { id: 'personal',      label: '個人' },
  { id: 'notifications', label: '通知' },
] as const satisfies readonly { id: OuterTab; label: string }[]

// ─── 個人頁面內容 ────────────────────────────────────────────────────────────

function PersonalView() {
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])
  const { signOut, getToken } = useAuth()
  const { user } = useUser()
  const getTokenRef = useRef(getToken)
  useEffect(() => { getTokenRef.current = getToken }, [getToken])
  // user.reload() 成功後會換一個新的 user 物件參照；若把 user 放進下面 useFocusEffect
  // 的 deps，reload 完成 → user 參照變了 → callback 參照跟著變 → 畫面仍在 focus 中
  // 會被 useFocusEffect 判定成「callback 變了」再次觸發 → 又呼叫一次 reload()，
  // 形成不會停的無限重刷迴圈（背景瘋狂 re-render 造成畫面持續晃動）。
  // 比照上面 getTokenRef 的作法，用 ref 讀取 user，deps 留空，只在真正「切回這個分頁」
  // 時執行一次，不會因為 user 物件本身更新而重新觸發。
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  // Clerk 的 user 物件是各裝置各自快取的本地副本，不會因為網頁版或其他裝置改了名稱/大頭貼
  // 就即時推播更新——每次切回這個分頁時強制向 Clerk 重新抓一次最新資料，避免顯示過期名稱
  useFocusEffect(
    useCallback(() => {
      userRef.current?.reload().catch(err => console.warn('[PersonalView] user.reload 失敗:', err))
    }, []),
  )

  const [signingOut, setSigningOut]       = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [editingName, setEditingName]     = useState(false)
  const [nameInput, setNameInput]         = useState('')
  const [savingName, setSavingName]       = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const [profiles, setProfiles]       = useState<BirthProfile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [syncing, setSyncing]         = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [editTarget, setEditTarget]   = useState<BirthProfile | null>(null)

  const [hdChart, setHdChart]         = useState<Chart | null>(null)
  const [hdLoading, setHdLoading]     = useState(true)

  const refreshProfiles = useCallback(async () => {
    setProfilesLoading(true)
    try {
      const token = await getTokenRef.current()
      if (!token) throw new Error('尚未登入，請重新啟動 App')
      setProfiles(await loadProfiles(token))
    } catch (err) {
      Alert.alert('讀取失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setProfilesLoading(false)
    }
  }, []) // getToken 透過 ref 取用，不放 deps 避免無限循環

  const refreshHdChart = useCallback(async () => {
    setHdLoading(true)
    try {
      const token = await getTokenRef.current()
      if (!token) return
      const { charts } = await getCharts(token)
      const personal = charts.filter(c => !c.chartKind || c.chartKind === 'personal')
      if (personal.length === 0) { setHdChart(null); return }

      const candidate = personal[0]
      // 若 list 端點回傳的圖任一 meta 欄位缺失，改用單筆 API 觸發 server 端懶補算
      if (!candidate.meta?.incarnationCross || !candidate.meta?.variables || !candidate.meta?.arrows) {
        const { chart } = await getChart(token, candidate.id)
        setHdChart(chart)
      } else {
        setHdChart(candidate)
      }
    } catch (err) {
      console.error('[PersonalView] refreshHdChart 失敗:', err)
      Alert.alert('載入失敗', '人類圖資料載入失敗，請稍後再試')
    } finally {
      setHdLoading(false)
    }
  }, [])

  useEffect(() => { refreshProfiles() }, [refreshProfiles])
  useEffect(() => { refreshHdChart() }, [refreshHdChart])

  async function handleSync() {
    setSyncing(true)
    try {
      await refreshProfiles()
    } finally {
      setSyncing(false)
    }
  }

  async function handleSaveProfile(profile: BirthProfile) {
    const token = await getTokenRef.current()
    if (!token) { Alert.alert('驗證失敗', '無法取得登入憑證，請重新登入'); return }
    try {
      setProfiles(await saveProfile(token, profile, profiles))
      setSheetVisible(false)
    } catch (err) {
      Alert.alert('儲存失敗', err instanceof Error ? err.message : '請稍後再試')
    }
  }

  function handleEditProfile(p: BirthProfile) {
    setEditTarget(p)
    setSheetVisible(true)
  }

  function handleAddProfile() {
    setEditTarget(null)
    setSheetVisible(true)
  }

  async function handleDeleteProfile(p: BirthProfile) {
    Alert.alert('刪除出生資料', `確定要刪除「${p.label}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive',
        onPress: async () => {
          const token = await getTokenRef.current()
          if (!token) { Alert.alert('驗證失敗', '無法取得登入憑證，請重新登入'); return }
          try { setProfiles(await deleteProfile(token, p.id, profiles)) }
          catch (err) { Alert.alert('刪除失敗', err instanceof Error ? err.message : '請稍後再試') }
        },
      },
    ])
  }

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try { await signOut() }
    catch (err) { Alert.alert('登出失敗', err instanceof Error ? err.message : '請稍後再試') }
    finally { setSigningOut(false) }
  }

  function handleDeleteAccount() {
    if (deletingAccount) return
    Alert.alert(
      '刪除帳號',
      '此操作將永久刪除您的帳號與所有資料（出生資料、圖表紀錄），且無法復原。確定要繼續嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除帳號', style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true)
            try {
              const token = await getTokenRef.current()
              if (!token) throw new Error('無法取得登入憑證，請重新登入')
              await deleteAccount(token)
              await signOut()
            } catch (err) {
              Alert.alert('刪除失敗', err instanceof Error ? err.message : '請稍後再試')
            } finally {
              setDeletingAccount(false)
            }
          },
        },
      ],
    )
  }

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('需要相片庫權限', '請至設定 > SelfMap 開啟相片庫存取權限')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    if (!asset.base64 || !user) return
    setUploadingAvatar(true)
    try {
      // 強制刷新 session，避免 Clerk client 端 session 快取過期導致
      // 直接呼叫 user.setProfileImage() 時噴 "no active session" 錯誤
      await getTokenRef.current({ skipCache: true })
      const mimeType = asset.mimeType ?? 'image/jpeg'
      await user.setProfileImage({ file: `data:${mimeType};base64,${asset.base64}` })
    } catch (err) {
      Alert.alert('上傳失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setUploadingAvatar(false)
    }
  }

  function openEditName() {
    setNameInput(user?.fullName ?? user?.firstName ?? '')
    setEditingName(true)
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim()
    if (!trimmed || !user) return
    setSavingName(true)
    try {
      // 強制刷新 session，避免 Clerk client 端 session 快取過期導致
      // 直接呼叫 user.update() 時噴 "no active session" 錯誤
      await getTokenRef.current({ skipCache: true })
      const spaceIdx = trimmed.indexOf(' ')
      const firstName = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
      const lastName  = spaceIdx === -1 ? ''      : trimmed.slice(spaceIdx + 1).trim()
      await user.update({ firstName, lastName })
      setEditingName(false)
    } catch (err) {
      Alert.alert('更新失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setSavingName(false)
    }
  }

  return (
    <>
      <ScrollView contentContainerStyle={s.inner}>

        {/* 帳號資訊 */}
        <View style={s.card}>
          <View style={s.row}>
            <Pressable
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
              style={s.avatarWrap}
              accessibilityLabel="更換大頭貼"
            >
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarPlaceholder]}>
                  <Text style={s.avatarInitial}>
                    {(user?.firstName ?? '?')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={s.avatarBadge}>
                <Text style={s.avatarBadgeText}>{uploadingAvatar ? '…' : '✎'}</Text>
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{user?.fullName ?? user?.firstName ?? '使用者'}</Text>
              <Text style={s.email}>{user?.emailAddresses[0]?.emailAddress}</Text>
            </View>
            <Pressable style={s.editBtn} onPress={openEditName} accessibilityLabel="編輯名稱">
              <Text style={s.editText}>編輯</Text>
            </Pressable>
          </View>
        </View>

        {/* 出生資料 */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>出生資料</Text>
            <View style={s.sectionActions}>
              <Pressable
                onPress={handleSync}
                disabled={syncing || profilesLoading}
                accessibilityLabel="立即同步"
                style={s.syncBtn}
              >
                {syncing
                  ? <ActivityIndicator size="small" color={Colors.sub} />
                  : <Text style={s.syncText}>↻ 同步</Text>}
              </Pressable>
              <Pressable onPress={handleAddProfile} accessibilityLabel="新增出生資料">
                <Text style={s.addText}>＋ 新增</Text>
              </Pressable>
            </View>
          </View>

          {profilesLoading ? (
            <View style={s.emptyCard}>
              <ActivityIndicator size="small" color={Colors.sub} />
            </View>
          ) : profiles.length === 0 ? (
            <Pressable style={s.emptyCard} onPress={handleAddProfile}>
              <Text style={s.emptyText}>尚無出生資料，點此新增</Text>
            </Pressable>
          ) : (
            <View style={s.card}>
              {profiles.map((p, i) => (
                <View key={p.id} style={[s.profileRow, i > 0 && s.separator]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.profileLabel}>{p.label}</Text>
                    <Text style={s.profileSub}>{profileSummary(p)}</Text>
                  </View>
                  <Pressable
                    style={s.editProfileBtn}
                    onPress={() => handleEditProfile(p)}
                    accessibilityLabel={`編輯 ${p.label}`}
                    hitSlop={8}
                  >
                    <Text style={s.editProfileIcon}>✎</Text>
                  </Pressable>
                  <Pressable
                    style={s.deleteBtn}
                    onPress={() => handleDeleteProfile(p)}
                    accessibilityLabel={`刪除 ${p.label}`}
                    hitSlop={8}
                  >
                    <Text style={s.deleteText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 網站連結預覽卡 */}
        <Pressable
          style={s.websiteCard}
          onPress={() => {
            WebBrowser.openBrowserAsync('https://selfmap.tw').catch(() => {
              Alert.alert('無法開啟連結', '請稍後再試')
            })
          }}
          accessibilityLabel="前往 selfmap.tw"
        >
          <Image
            source={require('@/assets/website-preview.png')}
            style={s.websiteCardImage}
            resizeMode="cover"
          />
          <View style={s.websiteCardFooter}>
            <Text style={s.websiteCardDomain}>selfmap.tw</Text>
            <Text style={s.websiteCardTitle} numberOfLines={1}>SelfMap — 免費人類圖計算器</Text>
            <Text style={s.websiteCardDesc} numberOfLines={2}>輸入出生日期、時間與地點，即時生成完整人類圖</Text>
          </View>
        </Pressable>

        {/* 登出 */}
        <Pressable
          style={[s.signOutBtn, signingOut && s.btnDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityLabel="登出"
        >
          <Text style={s.signOutText}>{signingOut ? '登出中…' : '登出'}</Text>
        </Pressable>

        {/* 刪除帳號 */}
        <Pressable
          style={[s.deleteAccountBtn, deletingAccount && s.btnDisabled]}
          onPress={handleDeleteAccount}
          disabled={deletingAccount}
          accessibilityLabel="刪除帳號"
        >
          <Text style={s.deleteAccountText}>{deletingAccount ? '刪除中…' : '刪除帳號'}</Text>
        </Pressable>
      </ScrollView>

      <InputModal
        visible={editingName}
        title="編輯名稱"
        value={nameInput}
        onChange={setNameInput}
        onConfirm={handleSaveName}
        onCancel={() => setEditingName(false)}
        placeholder="輸入名稱"
        confirmLabel="儲存"
        loading={savingName}
        inputRef={inputRef}
      />

      <BirthProfileSheet
        visible={sheetVisible}
        initial={editTarget}
        onSave={handleSaveProfile}
        onCancel={() => setSheetVisible(false)}
      />
    </>
  )
}

// ─── 未登入提示 ──────────────────────────────────────────────────────────────

function SignInPrompt() {
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])
  const { handleGoogleSignIn } = useGoogleSignIn()
  const { handleLineSignIn } = useLineSignIn()

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => { void WebBrowser.coolDownAsync() }
  }, [])
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingLine, setLoadingLine] = useState(false)
  const isLoading = loadingGoogle || loadingLine

  async function onGooglePress() {
    if (isLoading) return
    setLoadingGoogle(true)
    try { await handleGoogleSignIn() }
    catch { Alert.alert('登入失敗', '請稍後再試') }
    finally { setLoadingGoogle(false) }
  }

  async function onLinePress() {
    if (isLoading) return
    setLoadingLine(true)
    try { await handleLineSignIn() }
    catch { Alert.alert('登入失敗', '請稍後再試') }
    finally { setLoadingLine(false) }
  }

  return (
    <View style={s.signInWrap}>
      <Text style={s.signInTitle}>登入以使用帳號功能</Text>
      <Text style={s.signInSub}>儲存圖表、出生資料與個人設定</Text>
      <Pressable style={[s.signInBtn, isLoading && s.btnDisabled]} onPress={onGooglePress} disabled={isLoading}>
        {loadingGoogle
          ? <ActivityIndicator color={Colors.surface} />
          : <Text style={s.signInBtnText}>使用 Google 登入</Text>
        }
      </Pressable>
      <Pressable style={[s.signInBtn, s.lineBtn, isLoading && s.btnDisabled]} onPress={onLinePress} disabled={isLoading}>
        {loadingLine
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.signInBtnText}>使用 LINE 登入</Text>
        }
      </Pressable>
    </View>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])
  const { isSignedIn } = useAuth()
  const { chartTab: rawChartTab } = useLocalSearchParams<{ chartTab?: string }>()
  const VALID_CHART_TABS = ['personal', 'composite', 'transit'] as const
  type ChartTab = typeof VALID_CHART_TABS[number]
  const chartTab: ChartTab | undefined = VALID_CHART_TABS.includes(rawChartTab as ChartTab)
    ? (rawChartTab as ChartTab)
    : undefined
  const [outerTab, setOuterTab] = useState<OuterTab>(chartTab !== undefined ? 'charts' : 'personal')

  useEffect(() => {
    if (chartTab !== undefined) setOuterTab('charts')
  }, [chartTab])

  if (!isSignedIn) {
    return (
      <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
        <SignInPrompt />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <SubTabBar tabs={OUTER_TABS} active={outerTab} onSelect={setOuterTab} />

      <View style={{ flex: 1, display: outerTab === 'charts' ? 'flex' : 'none' }}>
        <ChartListView key={chartTab ?? 'personal'} initialTab={chartTab} />
      </View>
      <View style={{ flex: 1, display: outerTab === 'personal' ? 'flex' : 'none' }}>
        <PersonalView />
      </View>
      <View style={{ flex: 1, display: outerTab === 'notifications' ? 'flex' : 'none' }}>
        <NotificationsView />
      </View>
    </SafeAreaView>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner:     { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 48 },

  card:         { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 20 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarWrap:   { position: 'relative' },
  avatar:       { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { backgroundColor: Colors.accentD, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:{ fontSize: 22, fontWeight: '700', color: Colors.accent },
  avatarBadge:  { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.surface },
  avatarBadgeText: { fontSize: 9, color: Colors.bg, fontWeight: '700' },
  name:         { fontSize: 18, fontWeight: '600', color: Colors.text },
  email:        { fontSize: 14, color: Colors.sub, marginTop: 4 },
  editBtn:      { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  editText:     { color: Colors.sub, fontSize: 13 },

  section:        { gap: Spacing.sm },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:   { fontSize: 12, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  syncBtn:        { paddingHorizontal: 4 },
  syncText:       { color: Colors.sub, fontSize: 13 },
  addText:        { color: Colors.accent, fontSize: 14, fontWeight: '600' },

  separator:     { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.sm },

  emptyCard:    { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 20, alignItems: 'center' },
  emptyText:    { color: Colors.muted, fontSize: 14 },
  profileRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  profileLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  profileSub:   { fontSize: 12, color: Colors.sub, marginTop: 3 },
  editProfileBtn:  { padding: Spacing.xs },
  editProfileIcon: { color: Colors.sub, fontSize: 15 },
  deleteBtn:    { padding: Spacing.xs },
  deleteText:   { color: Colors.muted, fontSize: 14 },

  websiteCard:        { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, backgroundColor: Colors.surface, gap: Spacing.md, padding: Spacing.sm },
  websiteCardImage:   { width: 64, height: 64, borderRadius: Radius.sm, backgroundColor: Colors.bg },
  websiteCardFooter:  { flex: 1, gap: 2 },
  websiteCardDomain:  { color: Colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  websiteCardTitle:   { color: Colors.text, fontSize: 14, fontWeight: '600' },
  websiteCardDesc:    { color: Colors.sub, fontSize: 12, lineHeight: 16 },

  signOutBtn:   { borderWidth: 1, borderColor: Colors.red, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  signOutText:  { color: Colors.red, fontSize: 15, fontWeight: '600' },
  deleteAccountBtn:  { paddingVertical: Spacing.md, alignItems: 'center' },
  deleteAccountText: { color: Colors.muted, fontSize: 13 },
  btnDisabled:  { opacity: 0.5 },

  signInWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  signInTitle:   { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  signInSub:     { fontSize: 14, color: Colors.sub, textAlign: 'center', lineHeight: 21 },
  signInBtn:     { backgroundColor: Colors.accent, paddingVertical: 14, paddingHorizontal: 32, borderRadius: Radius.md, width: '100%', alignItems: 'center', marginTop: Spacing.lg },
  lineBtn:       { backgroundColor: '#06C755', marginTop: Spacing.sm },
  signInBtnText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
})

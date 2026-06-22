import { useAuth, useUser } from '@clerk/expo'
import { useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { ScreenHeader } from '@/components/ScreenHeader'
import { SubTabBar } from '@/components/SubTabBar'
import { InputModal } from '@/components/InputModal'
import { BirthProfileSheet } from '@/components/BirthProfileSheet'
import ChartListView from '@/components/ChartListView'
import {
  type BirthProfile,
  loadProfiles,
  saveProfile,
  deleteProfile,
  profileSummary,
} from '@/lib/birthProfiles'
import { type Chart, getCharts, getChart } from '@/lib/api'

type OuterTab = 'charts' | 'personal'
const OUTER_TABS = [
  { id: 'charts',   label: '我的圖表' },
  { id: 'personal', label: '個人' },
] as const satisfies readonly { id: OuterTab; label: string }[]

// ─── 個人頁面內容 ────────────────────────────────────────────────────────────

function PersonalView() {
  const { signOut, getToken } = useAuth()
  const { user } = useUser()
  const getTokenRef = useRef(getToken)
  useEffect(() => { getTokenRef.current = getToken }, [getToken])

  const [signingOut, setSigningOut]       = useState(false)
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
      console.log('[PersonalView] 個人圖數量:', personal.length, '| meta 存在:', personal.filter(c => c.meta).length)
      if (personal.length === 0) { setHdChart(null); return }

      const candidate = personal[0]
      // 若 list 端點回傳的圖 meta 為 null，改用單筆 API 觸發 server 端懶補算
      if (!candidate.meta?.incarnationCross) {
        console.log('[PersonalView] list meta 缺失，改呼叫單筆 API 觸發補算, id=', candidate.id)
        const { chart } = await getChart(token, candidate.id)
        console.log('[PersonalView] 補算後 incarnationCross=', !!(chart.meta?.incarnationCross))
        setHdChart(chart)
      } else {
        setHdChart(candidate)
      }
    } catch (err) {
      console.error('[PersonalView] refreshHdChart 失敗:', err)
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
      const mimeType = asset.mimeType ?? 'image/jpeg'
      await user.setProfileImage({ file: `data:${mimeType};base64,${asset.base64}` })
    } catch (err) {
      Alert.alert('上傳失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setUploadingAvatar(false)
    }
  }

  function openEditName() {
    setNameInput(user?.firstName ?? '')
    setEditingName(true)
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim()
    if (!trimmed || !user) return
    setSavingName(true)
    try {
      await user.update({ firstName: trimmed })
      setEditingName(false)
    } catch (err) {
      Alert.alert('更新失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setSavingName(false)
    }
  }

  const SUPPORTED_PROVIDERS = new Set(['google'])
  const oauthAccounts = (user?.externalAccounts ?? []).filter(
    acct => SUPPORTED_PROVIDERS.has(acct.provider) && acct.verification?.status === 'verified'
  )

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

        {/* 已連結帳號 */}
        {oauthAccounts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>已連結帳號</Text>
            <View style={s.card}>
              {oauthAccounts.map((acct, i) => (
                <View key={acct.id} style={[s.oauthRow, i > 0 && s.separator]}>
                  <Text style={s.oauthProvider}>{acct.providerTitle()}</Text>
                  <Text style={s.oauthEmail}>{acct.accountIdentifier()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
                  <Pressable style={{ flex: 1 }} onPress={() => handleEditProfile(p)}>
                    <Text style={s.profileLabel}>{p.label}</Text>
                    <Text style={s.profileSub}>{profileSummary(p)}</Text>
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

        {/* 輪迴交叉 */}
        {(hdLoading || hdChart?.meta?.incarnationCross) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>輪迴交叉</Text>
            {hdLoading ? (
              <View style={[s.card, { alignItems: 'center', paddingVertical: 20 }]}>
                <ActivityIndicator size="small" color={Colors.sub} />
              </View>
            ) : hdChart?.meta?.incarnationCross ? (
              <View style={s.card}>
                <View style={s.hdRow}>
                  <Text style={s.hdLabel}>交叉類型</Text>
                  <Text style={[s.hdValue, { color: Colors.accent }]}>{hdChart.meta.incarnationCross.crossTypeLabel}</Text>
                </View>
                <View style={[s.hdRow, s.separator]}>
                  <Text style={s.hdLabel}>交叉名稱</Text>
                  <Text style={s.hdValue}>{hdChart.meta.incarnationCross.crossBaseName}{hdChart.meta.incarnationCross.variant}</Text>
                </View>
                <View style={[s.hdRow, s.separator]}>
                  <Text style={s.hdLabel}>閘門組合</Text>
                  <Text style={s.hdValue}>{hdChart.meta.incarnationCross.gatesLabel}</Text>
                </View>
                {hdChart.name && (
                  <View style={[s.hdRow, s.separator]}>
                    <Text style={s.hdLabel}>圖表</Text>
                    <Text style={[s.hdValue, { color: Colors.sub }]}>{hdChart.name}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        )}

        {/* 四箭頭 */}
        {(hdLoading || (hdChart?.meta?.variables && hdChart?.meta?.arrows)) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>四箭頭（Variables）</Text>
            {hdLoading ? null : hdChart?.meta?.variables && hdChart?.meta?.arrows ? (
              <View style={s.card}>
                <View style={s.arrowsGrid}>
                  <View style={s.arrowsCol}>
                    <Text style={s.arrowsSide}>← Design（紅）</Text>
                    <View style={s.arrowItem}>
                      <Text style={s.arrowDir}>{hdChart.meta.arrows.topLeft ? '←' : '→'}</Text>
                      <View style={s.arrowInfo}>
                        <Text style={s.arrowCategory}>飲食（Digestion）</Text>
                        <Text style={s.arrowLabelText}>{hdChart.meta.variables.digestion.label}</Text>
                        <Text style={s.arrowDesc}>{hdChart.meta.variables.digestion.description}</Text>
                      </View>
                    </View>
                    <View style={[s.arrowItem, s.arrowItemSep]}>
                      <Text style={s.arrowDir}>{hdChart.meta.arrows.bottomLeft ? '←' : '→'}</Text>
                      <View style={s.arrowInfo}>
                        <Text style={s.arrowCategory}>環境（Environment）</Text>
                        <Text style={s.arrowLabelText}>{hdChart.meta.variables.environment.label}</Text>
                        <Text style={s.arrowDesc}>{hdChart.meta.variables.environment.description}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[s.arrowsCol, s.arrowsColSep]}>
                    <Text style={s.arrowsSide}>Personality（黑）→</Text>
                    <View style={s.arrowItem}>
                      <Text style={s.arrowDir}>{hdChart.meta.arrows.topRight ? '←' : '→'}</Text>
                      <View style={s.arrowInfo}>
                        <Text style={s.arrowCategory}>動機（Motivation）</Text>
                        <Text style={s.arrowLabelText}>{hdChart.meta.variables.motivation.label}</Text>
                        <Text style={s.arrowDesc}>{hdChart.meta.variables.motivation.description}</Text>
                      </View>
                    </View>
                    <View style={[s.arrowItem, s.arrowItemSep]}>
                      <Text style={s.arrowDir}>{hdChart.meta.arrows.bottomRight ? '←' : '→'}</Text>
                      <View style={s.arrowInfo}>
                        <Text style={s.arrowCategory}>觀點（Perspective）</Text>
                        <Text style={s.arrowLabelText}>{hdChart.meta.variables.perspective.label}</Text>
                        <Text style={s.arrowDesc}>{hdChart.meta.variables.perspective.description}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* 登出 */}
        <Pressable
          style={[s.signOutBtn, signingOut && s.btnDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityLabel="登出"
        >
          <Text style={s.signOutText}>{signingOut ? '登出中…' : '登出'}</Text>
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

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [outerTab, setOuterTab] = useState<OuterTab>('charts')
  const { chartTab: rawChartTab } = useLocalSearchParams<{ chartTab?: string }>()
  const VALID_CHART_TABS = ['personal', 'composite', 'transit'] as const
  type ChartTab = typeof VALID_CHART_TABS[number]
  const chartTab: ChartTab | undefined = VALID_CHART_TABS.includes(rawChartTab as ChartTab)
    ? (rawChartTab as ChartTab)
    : undefined

  return (
    <SafeAreaView style={s.container}>
      <ScreenHeader title="帳號" />
      <SubTabBar tabs={OUTER_TABS} active={outerTab} onSelect={setOuterTab} />

      <View style={{ flex: 1, display: outerTab === 'charts' ? 'flex' : 'none' }}>
        <ChartListView key={chartTab ?? 'personal'} initialTab={chartTab} />
      </View>
      <View style={{ flex: 1, display: outerTab === 'personal' ? 'flex' : 'none' }}>
        <PersonalView />
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
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

  oauthRow:      { paddingVertical: Spacing.sm, gap: 4 },
  separator:     { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.sm },
  oauthProvider: { fontSize: 15, fontWeight: '600', color: Colors.text },
  oauthEmail:    { fontSize: 13, color: Colors.sub },

  emptyCard:    { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 20, alignItems: 'center' },
  emptyText:    { color: Colors.muted, fontSize: 14 },
  profileRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  profileLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  profileSub:   { fontSize: 12, color: Colors.sub, marginTop: 3 },
  deleteBtn:    { padding: Spacing.xs },
  deleteText:   { color: Colors.muted, fontSize: 14 },

  signOutBtn:   { borderWidth: 1, borderColor: Colors.red, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  signOutText:  { color: Colors.red, fontSize: 15, fontWeight: '600' },
  btnDisabled:  { opacity: 0.5 },

  hdRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  hdLabel:      { fontSize: 13, color: Colors.sub, flex: 1 },
  hdValue:      { fontSize: 14, color: Colors.text, fontWeight: '500', flex: 2, textAlign: 'right' },

  arrowsGrid:   { flexDirection: 'row', gap: Spacing.md },
  arrowsCol:    { flex: 1 },
  arrowsColSep: { borderLeftWidth: 1, borderLeftColor: Colors.border, paddingLeft: Spacing.md },
  arrowsSide:   { fontSize: 10, color: Colors.muted, marginBottom: Spacing.sm, fontWeight: '600' },
  arrowItem:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  arrowItemSep: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  arrowDir:     { fontSize: 18, color: Colors.accent, width: 20, textAlign: 'center', lineHeight: 22 },
  arrowInfo:    { flex: 1 },
  arrowCategory:{ fontSize: 10, color: Colors.muted, marginBottom: 2 },
  arrowLabelText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  arrowDesc:    { fontSize: 11, color: Colors.sub, marginTop: 2 },
})

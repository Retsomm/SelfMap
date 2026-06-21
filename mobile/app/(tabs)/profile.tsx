import { useAuth, useUser } from '@clerk/expo'
import * as ImagePicker from 'expo-image-picker'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
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

type OuterTab = 'charts' | 'personal'
const OUTER_TABS = [
  { id: 'charts',   label: '我的圖表' },
  { id: 'personal', label: '個人' },
] as const satisfies readonly { id: OuterTab; label: string }[]

// ─── 個人頁面內容 ────────────────────────────────────────────────────────────

function PersonalView() {
  const { signOut } = useAuth()
  const { user } = useUser()
  const [signingOut, setSigningOut]       = useState(false)
  const [editingName, setEditingName]     = useState(false)
  const [nameInput, setNameInput]         = useState('')
  const [savingName, setSavingName]       = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const [profiles, setProfiles]       = useState<BirthProfile[]>([])
  const [sheetVisible, setSheetVisible] = useState(false)
  const [editTarget, setEditTarget]   = useState<BirthProfile | null>(null)

  const refreshProfiles = useCallback(async () => {
    setProfiles(await loadProfiles())
  }, [])

  useEffect(() => { refreshProfiles() }, [refreshProfiles])

  async function handleSaveProfile(profile: BirthProfile) {
    try {
      setProfiles(await saveProfile(profile))
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

  function handleDeleteProfile(p: BirthProfile) {
    Alert.alert('刪除出生資料', `確定要刪除「${p.label}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive',
        onPress: async () => {
          try { setProfiles(await deleteProfile(p.id)) }
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
            <Pressable onPress={handleAddProfile} accessibilityLabel="新增出生資料">
              <Text style={s.addText}>＋ 新增</Text>
            </Pressable>
          </View>

          {profiles.length === 0 ? (
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

  return (
    <SafeAreaView style={s.container}>
      <ScreenHeader title="帳號" />
      <SubTabBar tabs={OUTER_TABS} active={outerTab} onSelect={setOuterTab} />

      <View style={{ flex: 1, display: outerTab === 'charts' ? 'flex' : 'none' }}>
        <ChartListView />
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

  section:       { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:  { fontSize: 12, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  addText:       { color: Colors.accent, fontSize: 14, fontWeight: '600' },

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
})

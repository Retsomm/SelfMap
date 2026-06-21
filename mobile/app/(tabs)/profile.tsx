import { useAuth, useUser } from '@clerk/expo'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { InputModal } from '@/components/InputModal'
import { BirthProfileSheet } from '@/components/BirthProfileSheet'
import {
  type BirthProfile,
  loadProfiles,
  saveProfile,
  deleteProfile,
  profileSummary,
} from '@/lib/birthProfiles'

export default function ProfileScreen() {
  const { signOut } = useAuth()
  const { user } = useUser()
  const [signingOut, setSigningOut] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const inputRef = useRef<TextInput>(null)

  // ── 出生資料 ────────────────────────────────────────────
  const [profiles, setProfiles] = useState<BirthProfile[]>([])
  const [sheetVisible, setSheetVisible] = useState(false)
  const [editTarget, setEditTarget] = useState<BirthProfile | null>(null)

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
          try {
            setProfiles(await deleteProfile(p.id))
          } catch (err) {
            Alert.alert('刪除失敗', err instanceof Error ? err.message : '請稍後再試')
          }
        },
      },
    ])
  }

  // ── 帳號 ────────────────────────────────────────────────
  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      Alert.alert('登出失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setSigningOut(false)
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.heading}>帳號</Text>

        {/* 帳號資訊 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.fullName ?? user?.firstName ?? '使用者'}</Text>
              <Text style={styles.email}>{user?.emailAddresses[0]?.emailAddress}</Text>
            </View>
            <Pressable style={styles.editBtn} onPress={openEditName} accessibilityLabel="編輯名稱">
              <Text style={styles.editText}>編輯</Text>
            </Pressable>
          </View>
        </View>

        {/* 已連結帳號 */}
        {oauthAccounts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>已連結帳號</Text>
            <View style={styles.card}>
              {oauthAccounts.map((acct, i) => (
                <View key={acct.id} style={[styles.oauthRow, i > 0 && styles.separator]}>
                  <Text style={styles.oauthProvider}>{acct.providerTitle()}</Text>
                  <Text style={styles.oauthEmail}>{acct.accountIdentifier()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 出生資料 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>出生資料</Text>
            <Pressable onPress={handleAddProfile} accessibilityLabel="新增出生資料">
              <Text style={styles.addText}>＋ 新增</Text>
            </Pressable>
          </View>

          {profiles.length === 0 ? (
            <Pressable style={styles.emptyCard} onPress={handleAddProfile}>
              <Text style={styles.emptyText}>尚無出生資料，點此新增</Text>
            </Pressable>
          ) : (
            <View style={styles.card}>
              {profiles.map((p, i) => (
                <View key={p.id} style={[styles.profileRow, i > 0 && styles.separator]}>
                  <Pressable style={{ flex: 1 }} onPress={() => handleEditProfile(p)}>
                    <Text style={styles.profileLabel}>{p.label}</Text>
                    <Text style={styles.profileSub}>{profileSummary(p)}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteProfile(p)}
                    accessibilityLabel={`刪除 ${p.label}`}
                    hitSlop={8}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 登出 */}
        <Pressable
          style={[styles.signOutBtn, signingOut && styles.btnDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityLabel="登出"
        >
          <Text style={styles.signOutText}>{signingOut ? '登出中…' : '登出'}</Text>
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  inner:        { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 48 },
  heading:      { fontSize: 24, fontWeight: '700', color: Colors.text },
  card:         { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 20 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  name:         { fontSize: 18, fontWeight: '600', color: Colors.text },
  email:        { fontSize: 14, color: Colors.sub, marginTop: 4 },
  editBtn:      { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  editText:     { color: Colors.sub, fontSize: 13 },
  section:      { gap: Spacing.sm },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 12, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  addText:      { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  oauthRow:     { paddingVertical: Spacing.sm, gap: 4 },
  separator:    { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.sm },
  oauthProvider:{ fontSize: 15, fontWeight: '600', color: Colors.text },
  oauthEmail:   { fontSize: 13, color: Colors.sub },
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

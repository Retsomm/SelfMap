'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { BirthFormModal, DEFAULT_BIRTH_FORM, type BirthFormState } from '@/components/humanDesign/BirthFormModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useBirthProfiles, type BirthProfile } from '@/lib/useBirthProfiles'

// ── BirthProfileManager ─────────────────────────────────────────────────────

const profileToForm = (p: BirthProfile): BirthFormState => ({
  label: p.label,
  date: dayjs(p.date),
  time: dayjs(`${p.date} ${p.time}`),
  timezone: p.timezone,
  location: p.location,
})

export default function BirthProfileManager() {
  const { profiles, saveProfile, deleteProfile } = useBirthProfiles()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<BirthProfile | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleAdd = async (form: BirthFormState) => {
    setSaving(true)
    window.umami?.track('profile-add-save')
    try {
      await saveProfile({
        id: Date.now().toString(),
        label: form.label.trim(),
        date: form.date.format('YYYY-MM-DD'),
        time: form.time.format('HH:mm'),
        timezone: form.timezone,
        location: form.location,
      })
      setShowAddModal(false)
      toast.success('出生檔案已儲存')
    } catch {
      toast.error('出生檔案儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (form: BirthFormState) => {
    if (!editingProfile) return
    setSaving(true)
    window.umami?.track('profile-edit-save')
    try {
      await saveProfile({
        ...editingProfile,
        label: form.label.trim(),
        date: form.date.format('YYYY-MM-DD'),
        time: form.time.format('HH:mm'),
        timezone: form.timezone,
        location: form.location,
      })
      setEditingProfile(null)
      toast.success('出生檔案已儲存')
    } catch {
      toast.error('出生檔案儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    setDeleting(true)
    window.umami?.track('profile-delete-confirm')
    try {
      await deleteProfile(confirmDeleteId)
      setConfirmDeleteId(null)
      toast.success('出生檔案已刪除')
    } catch {
      toast.error('出生檔案刪除失敗')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-dotted border-[rgba(var(--ink-rgb),0.3)]">
        <h2 className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink)">
          出生檔案
        </h2>
        <button
          onClick={() => {
            window.umami?.track('profile-add-open')
            setShowAddModal(true)
          }}
          className="font-mono text-[11px] md:text-[13px] tracking-[0.1em] uppercase text-(--ink-soft) border border-(--ink-soft) px-2.5 py-1 bg-transparent cursor-pointer transition-colors duration-120 hover:text-(--ink) hover:border-(--ink)"
        >
          新增出生檔案
        </button>
      </div>

      {profiles.length === 0 ? (
        <p className="font-mono text-[12px] md:text-base tracking-[0.06em] text-(--ink-soft)">
          尚無出生檔案
        </p>
      ) : (
        <div className="flex flex-col border border-(--ink)">
          {profiles.map(p => (
            <div
              key={p.id}
              className="flex items-center py-2.5 px-4 border-b border-dotted border-[rgba(var(--ink-rgb),0.2)] last:border-b-0 gap-3"
            >
              <span className="font-mono text-[13px] md:text-sm tracking-[0.08em] text-(--ink) font-semibold min-w-16 shrink-0">
                {p.label}
              </span>
              <span className="font-mono text-[11px] md:text-[13px] tracking-[0.06em] text-(--ink-soft) flex-1 min-w-0 truncate">
                {p.date} · {p.time} · {p.location}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    window.umami?.track('profile-edit-open')
                    setEditingProfile(p)
                  }}
                  className="font-mono text-[12px] md:text-base text-(--ink-soft) hover:text-(--ink) cursor-pointer transition-colors duration-120"
                  title="編輯圖表名稱"
                >
                  ✎
                </button>
                <button
                  onClick={() => {
                    window.umami?.track('profile-delete-open')
                    setConfirmDeleteId(p.id)
                  }}
                  className="font-mono text-[12px] md:text-base text-(--ink-soft) hover:text-(--crimson) cursor-pointer transition-colors duration-120"
                  title="刪除圖表"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <BirthFormModal
          title="新增出生檔案"
          initial={DEFAULT_BIRTH_FORM}
          saving={saving}
          onSave={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {editingProfile && (
        <BirthFormModal
          title="編輯出生檔案"
          initial={profileToForm(editingProfile)}
          saving={saving}
          onSave={handleEdit}
          onCancel={() => setEditingProfile(null)}
        />
      )}

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="確認刪除"
        message="確定要刪除此出生檔案嗎？"
        confirmLabel="刪除"
        cancelLabel="取消"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
        isLoading={deleting}
      />
    </div>
  )
}

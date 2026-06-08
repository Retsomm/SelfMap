'use client'

import { useState, useEffect, useRef } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import toast from 'react-hot-toast'
import DateSelect from '@/components/humanDesign/DateSelect'
import TimeSelect from '@/components/humanDesign/TimeSelect'
import LocationPicker from '@/components/humanDesign/LocationPicker'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useBirthProfiles, type BirthProfile } from '@/lib/useBirthProfiles'
import { useLang } from '@/i18n'

// ── ProfileFormModal ────────────────────────────────────────────────────────

type FormState = {
  label: string
  date: Dayjs
  time: Dayjs
  timezone: string
  location: string
}

interface ProfileFormModalProps {
  title: string
  initial: FormState
  saving: boolean
  onSave: (form: FormState) => void
  onCancel: () => void
}

function ProfileFormModal({ title, initial, saving, onSave, onCancel }: ProfileFormModalProps) {
  const { t } = useLang()
  const [form, setForm] = useState<FormState>(initial)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="bg-(--paper) border border-(--ink) px-7 py-6 w-full max-w-md mx-4 shadow-xl outline-none flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-mono text-[13px] tracking-widest uppercase text-(--ink)">
          {title}
        </h2>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-[11px] tracking-widest uppercase text-(--ink-soft)">
            {t('account.birthProfileLabelPlaceholder')}
          </label>
          <input
            type="text"
            value={form.label}
            onChange={e => setForm(prev => ({ ...prev, label: e.target.value }))}
            placeholder={t('account.birthProfileLabelPlaceholder')}
            className="font-mono text-[16px] tracking-[0.04em] border border-(--ink) bg-(--paper) text-(--ink) px-3 py-1.5 w-full outline-none placeholder:text-(--ink-soft)"
            autoFocus
          />
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] tracking-widest uppercase text-(--ink-soft)">
              {t('home.dateLabel')}
            </label>
            <DateSelect
              value={form.date}
              onChange={d => setForm(prev => ({ ...prev, date: d }))}
              minDate={dayjs('1900-01-01')}
              maxDate={dayjs('2040-12-31')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] tracking-widest uppercase text-(--ink-soft)">
              {t('home.timeLabel')}
            </label>
            <TimeSelect
              value={form.time}
              onChange={tt => setForm(prev => ({ ...prev, time: tt }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-[11px] tracking-widest uppercase text-(--ink-soft)">
            {t('home.locationLabel')}
          </label>
          <LocationPicker
            value={form.location}
            onSelect={(tz, label) => setForm(prev => ({ ...prev, timezone: tz, location: label }))}
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            disabled={saving}
            className="font-mono text-[12px] tracking-widest uppercase text-(--ink-soft) border border-(--ink-soft) px-4 py-1.5 cursor-pointer transition-colors duration-120 hover:text-(--ink) hover:border-(--ink) disabled:opacity-40"
          >
            {t('account.cancel')}
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.label.trim()}
            className="font-mono text-[12px] tracking-widest uppercase text-(--paper) bg-(--ink) border border-(--ink) px-4 py-1.5 cursor-pointer transition-colors duration-120 hover:bg-transparent hover:text-(--ink) disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? t('account.saving') : t('account.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── BirthProfileManager ─────────────────────────────────────────────────────

const DEFAULT_FORM: FormState = {
  label: '',
  date: dayjs('1990-01-01'),
  time: dayjs('1990-01-01 12:00'),
  timezone: 'Asia/Taipei',
  location: '台北, 台灣',
}

const profileToForm = (p: BirthProfile): FormState => ({
  label: p.label,
  date: dayjs(p.date),
  time: dayjs(`${p.date} ${p.time}`),
  timezone: p.timezone,
  location: p.location,
})

export default function BirthProfileManager() {
  const { t } = useLang()
  const { profiles, saveProfile, deleteProfile } = useBirthProfiles()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<BirthProfile | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleAdd = async (form: FormState) => {
    setSaving(true)
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
      toast.success(t('account.birthProfileSaved'))
    } catch {
      toast.error(t('account.birthProfileSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (form: FormState) => {
    if (!editingProfile) return
    setSaving(true)
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
      toast.success(t('account.birthProfileSaved'))
    } catch {
      toast.error(t('account.birthProfileSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      await deleteProfile(confirmDeleteId)
      setConfirmDeleteId(null)
      toast.success(t('account.birthProfileDeleted'))
    } catch {
      toast.error(t('account.birthProfileSaveFailed'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-dotted border-[rgba(43,31,20,0.3)]">
        <h2 className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink)">
          {t('account.birthProfiles')}
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="font-mono text-[11px] md:text-[13px] tracking-[0.1em] uppercase text-(--ink-soft) border border-(--ink-soft) px-2.5 py-1 bg-transparent cursor-pointer transition-colors duration-120 hover:text-(--ink) hover:border-(--ink)"
        >
          {t('account.addBirthProfile')}
        </button>
      </div>

      {profiles.length === 0 ? (
        <p className="font-mono text-[12px] md:text-base tracking-[0.06em] text-(--ink-soft)">
          {t('account.noBirthProfiles')}
        </p>
      ) : (
        <div className="flex flex-col border border-(--ink)">
          {profiles.map(p => (
            <div
              key={p.id}
              className="flex items-center py-2.5 px-4 border-b border-dotted border-[rgba(43,31,20,0.2)] last:border-b-0 gap-3"
            >
              <span className="font-mono text-[13px] md:text-sm tracking-[0.08em] text-(--ink) font-semibold min-w-16 shrink-0">
                {p.label}
              </span>
              <span className="font-mono text-[11px] md:text-[13px] tracking-[0.06em] text-(--ink-soft) flex-1 min-w-0 truncate">
                {p.date} · {p.time} · {p.location}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditingProfile(p)}
                  className="font-mono text-[12px] md:text-base text-(--ink-soft) hover:text-(--ink) cursor-pointer transition-colors duration-120"
                  title={t('account.editChartTitle')}
                >
                  ✎
                </button>
                <button
                  onClick={() => setConfirmDeleteId(p.id)}
                  className="font-mono text-[12px] md:text-base text-(--ink-soft) hover:text-(--crimson) cursor-pointer transition-colors duration-120"
                  title={t('account.deleteChart')}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <ProfileFormModal
          title={t('account.addBirthProfile')}
          initial={DEFAULT_FORM}
          saving={saving}
          onSave={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* Edit modal */}
      {editingProfile && (
        <ProfileFormModal
          title={t('account.editChartTitle')}
          initial={profileToForm(editingProfile)}
          saving={saving}
          onSave={handleEdit}
          onCancel={() => setEditingProfile(null)}
        />
      )}

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title={t('account.deleteChartConfirmTitle')}
        message={t('account.deleteProfileConfirmMessage')}
        confirmLabel={t('account.deleteChartConfirm')}
        cancelLabel={t('account.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
        isLoading={deleting}
      />
    </div>
  )
}

import type { BirthFormData } from '@/components/BirthDataForm'

export function formToBirthDate(f: BirthFormData) {
  return `${f.date.year}-${String(f.date.month).padStart(2, '0')}-${String(f.date.day).padStart(2, '0')}`
}

export function formToBirthTime(f: BirthFormData) {
  return `${String(f.time.hour).padStart(2, '0')}:${String(f.time.minute).padStart(2, '0')}`
}

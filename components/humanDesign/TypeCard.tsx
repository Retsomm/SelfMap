import type { HumanDesignType } from '@/lib/humanDesign'
import { TYPE_LABELS } from '@/lib/humanDesign'

interface Props {
  type: HumanDesignType
}

const TypeCard = ({ type }: Props) => (
  <div className="mb-6 bg-gray-900 rounded-xl p-5">
    <p className="text-gray-400 text-xs mb-1">類型 Type</p>
    <p className="text-3xl font-bold text-amber-400 tracking-widest">{type}</p>
    <p className="text-amber-300 text-sm mt-1">{TYPE_LABELS[type]}</p>
  </div>
)

export default TypeCard

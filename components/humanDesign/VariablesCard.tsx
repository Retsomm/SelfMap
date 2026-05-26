import type { HumanDesignType, VariablesResult } from '@/lib/humanDesign'
import { TYPE_LABELS, STRATEGY_MAP, SIGNATURE_MAP } from '@/lib/humanDesign'

interface Props {
  type: HumanDesignType
  variables: VariablesResult
}

interface RowProps {
  category: string
  label: string
  description: string
  accentClass: string
}

const Row = ({ category, label, description, accentClass }: RowProps) => (
  <div className="py-3 border-b border-gray-800 last:border-0">
    <p className="text-gray-500 text-xs mb-0.5">{category}</p>
    <p className={`text-sm font-semibold ${accentClass} mb-0.5`}>{label}</p>
    <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
  </div>
)

const VariablesCard = ({ type, variables }: Props) => {
  const signature = SIGNATURE_MAP[type] ?? { positive: '—', negative: '—' }
  const strategy  = STRATEGY_MAP[type]  ?? type
  const typeLabel = TYPE_LABELS[type]   ?? type

  return (
    <div className="mb-6 bg-gray-900 rounded-xl p-5">
      <p className="text-gray-400 text-xs mb-3">生命設計摘要</p>

      <Row
        category="能量連結 / 效率與人際交往風格"
        label={`${type}（${typeLabel}）`}
        description={`以「${typeLabel}」的方式在世界中運作，發揮天賦能量`}
        accentClass="text-amber-400"
      />

      <Row
        category="幸福指標 / 正向或負向感受"
        label={`正向：${signature.positive}　負向：${signature.negative}`}
        description={`當你活在本質中，你會感到${signature.positive}；當你偏離時，${signature.negative}是警示信號`}
        accentClass="text-emerald-400"
      />

      <Row
        category="行動策略 / 啟動事件的參考"
        label={strategy}
        description={`遵循「${strategy}」的策略，讓生命以最小阻力展開`}
        accentClass="text-sky-400"
      />

      <Row
        category="四箭頭 / 適合飲食"
        label={variables.digestion.label}
        description={variables.digestion.description}
        accentClass="text-orange-400"
      />

      <Row
        category="四箭頭 / 適合環境"
        label={variables.environment.label}
        description={variables.environment.description}
        accentClass="text-teal-400"
      />

      <Row
        category="四箭頭 / 觀點"
        label={variables.perspective.label}
        description={variables.perspective.description}
        accentClass="text-violet-400"
      />

      <Row
        category="四箭頭 / 思考動機"
        label={variables.motivation.label}
        description={variables.motivation.description}
        accentClass="text-rose-400"
      />
    </div>
  )
}

export default VariablesCard

import type { IncarnationCross } from '@/lib/humanDesign'

const TYPE_BADGE: Record<string, string> = {
  RAC: 'bg-indigo-900 text-indigo-300',
  JC:  'bg-emerald-900 text-emerald-300',
  LAC: 'bg-amber-900 text-amber-300',
}

const TYPE_LABEL: Record<string, string> = {
  RAC: '右角度交叉',
  JC:  '並列交叉',
  LAC: '左角度交叉',
}

interface Props {
  cross: IncarnationCross
}

export default function IncarnationCrossCard({ cross }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
      <h2 className="text-sm font-semibold text-gray-400 mb-2">輪迴交叉</h2>
      <div className="mb-1">
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="text-xl font-bold text-yellow-300">
            {(TYPE_LABEL[cross.crossType] ?? cross.crossType)}之{cross.crossName}
          </span>
          <span className="text-gray-400 font-mono text-sm">({cross.gatesLabel})</span>
        </div>
        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded font-mono ${TYPE_BADGE[cross.crossType] ?? 'bg-gray-800 text-gray-300'}`}>
          {cross.crossType}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mt-3">
        <div>
          <p className="text-gray-400 mb-0.5">意識軸（黑）</p>
          <p className="text-white font-mono">{cross.conscious}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-0.5">潛意識軸（紅）</p>
          <p className="text-red-400 font-mono">{cross.unconscious}</p>
        </div>
      </div>
    </div>
  )
}

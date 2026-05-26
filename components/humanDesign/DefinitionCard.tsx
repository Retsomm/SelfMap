interface Props {
  label: string
  raw: string
}

const DESCRIPTION: Record<string, string> = {
  'Single':          '所有已定義中心形成一個連通群組，能量穩定且自給自足。',
  'Split':           '已定義中心分成兩個獨立群組，需要特定橋接閘門連結兩側。',
  'Triple Split':    '已定義中心分成三個獨立群組，需要更多外部連結才感到完整。',
  'Quadruple Split': '已定義中心分成四個獨立群組，非常獨立，同時也需要多元的外部支持。',
  'None':            '沒有任何已定義中心，完全反映環境的能量，為反映者的特徵。',
}

const DefinitionCard = ({ label, raw }: Props) => (
  <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-4">
    <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-1">定義</h2>
    <p className="text-2xl font-bold text-white mb-1">{label}</p>
    <p className="text-xs text-gray-500 mb-2">({raw})</p>
    <p className="text-sm text-gray-300">{DESCRIPTION[raw] ?? ''}</p>
  </div>
)

export default DefinitionCard

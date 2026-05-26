import type { CenterName } from '@/lib/humanDesign'
import { CENTER_INFO } from '@/lib/humanDesign'

interface Props {
  definedCenterIds: Set<CenterName>
  allGates: Set<number>
}

const CentersGrid = ({ definedCenterIds, allGates }: Props) => (
  <div className="mb-6 bg-gray-900 rounded-xl p-5">
    <p className="text-gray-400 text-xs mb-3">9 大能量中心</p>
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(CENTER_INFO) as CenterName[]).map(id => {
        const defined = definedCenterIds.has(id)
        return (
          <div
            key={id}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${defined ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-500'}`}
          >
            <span className={`mr-1 ${defined ? 'text-indigo-300' : 'text-gray-600'}`}>
              {defined ? '▲' : '○'}
            </span>
            {CENTER_INFO[id].name}
          </div>
        )
      })}
    </div>
    <p className="text-gray-500 text-xs mt-3">
      已定義 {definedCenterIds.size} / 9 個中心
      ．激活閘門 {allGates.size} 個
    </p>
  </div>
)

export default CentersGrid

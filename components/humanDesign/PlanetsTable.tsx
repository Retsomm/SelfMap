import type { PlanetGateResult } from '@/lib/humanDesign'

export interface PlanetRow extends PlanetGateResult {
  persLon: number
  desLon: number
}

interface Props {
  planets: PlanetRow[]
}

const PlanetsTable = ({ planets }: Props) => (
  <table className="w-full text-sm border-collapse whitespace-nowrap">
    <thead>
      <tr className="text-gray-400 border-b border-gray-800 text-xs">
        <th className="text-left py-2 pr-4">行星</th>
        <th className="text-left py-2 pr-4 text-gray-500">P 經度</th>
        <th className="text-left py-2 pr-6 text-white">黑色（意識）</th>
        <th className="text-left py-2 pr-4 text-gray-500">D 經度</th>
        <th className="text-left py-2 text-red-400">紅色（潛意識）</th>
      </tr>
    </thead>
    <tbody>
      {planets.map(p => (
        <tr key={p.planetName} className="border-b border-gray-800/50">
          <td className="py-2 pr-4 text-gray-300">{p.planetName}</td>
          <td className="py-2 pr-4 text-gray-500 text-xs">{p.persLon.toFixed(3)}°</td>
          <td className="py-2 pr-6 text-emerald-400 font-bold">{p.black.full}</td>
          <td className="py-2 pr-4 text-gray-500 text-xs">{p.desLon.toFixed(3)}°</td>
          <td className="py-2 text-red-400 font-bold">{p.red.full}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

export default PlanetsTable

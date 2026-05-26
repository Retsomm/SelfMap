import type { AuthorityInfo } from '@/lib/humanDesign'

interface Props {
  authority: AuthorityInfo
}

const AuthorityCard = ({ authority }: Props) => (
  <div className="mb-6 bg-gray-900 rounded-xl p-5">
    <p className="text-gray-400 text-xs mb-1">決策權威 Authority</p>
    <p className="text-3xl font-bold text-violet-400 tracking-widest">{authority.name}</p>
    <p className="text-violet-300 text-sm mt-1">{authority.tip}</p>
  </div>
)

export default AuthorityCard

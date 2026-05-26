import type { ProfileResult } from '@/lib/humanDesign'
import { PROFILE_LABELS } from '@/lib/humanDesign'

interface Props {
  profile: ProfileResult
}

const ProfileCard = ({ profile }: Props) => (
  <div className="mb-6 bg-gray-900 rounded-xl p-5">
    <p className="text-gray-400 text-xs mb-1">人生角色 Profile</p>
    <p className="text-3xl font-bold text-white tracking-widest">{profile.profile}</p>
    <p className="text-indigo-400 text-sm mt-1">
      {PROFILE_LABELS[profile.profile] ?? '—'}
    </p>
    <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-400">
      <div>
        <span className="text-emerald-400 font-semibold">意識太陽</span>
        <span className="ml-2 text-white">{profile.personalitySun.full}</span>
        <span className="ml-2">（線 {profile.personalitySunLine}）</span>
      </div>
      <div>
        <span className="text-red-400 font-semibold">潛意識太陽</span>
        <span className="ml-2 text-white">{profile.designSun.full}</span>
        <span className="ml-2">（線 {profile.designSunLine}）</span>
      </div>
    </div>
  </div>
)

export default ProfileCard

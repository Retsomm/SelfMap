import type { ChannelDef } from '@/lib/humanDesign'
import { CENTER_INFO, CHANNEL_DEFS } from '@/lib/humanDesign'

interface Props {
  definedChannels: ChannelDef[]
}

const ChannelsList = ({ definedChannels }: Props) => (
  <div className="mb-6 bg-gray-900 rounded-xl p-5">
    <p className="text-gray-400 text-xs mb-3">
      已定義通道（{definedChannels.length} / {CHANNEL_DEFS.length}）
    </p>
    {definedChannels.length === 0 ? (
      <p className="text-gray-600 text-xs">無已定義通道</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {definedChannels.map(ch => (
          <span
            key={ch.id}
            className="bg-indigo-900 text-indigo-200 text-xs px-2 py-1 rounded font-mono"
          >
            {ch.id}
            <span className="text-indigo-400 ml-1 text-xs">
              {CENTER_INFO[ch.centerA].name.replace('中心', '')}—{CENTER_INFO[ch.centerB].name.replace('中心', '')}
            </span>
          </span>
        ))}
      </div>
    )}
  </div>
)

export default ChannelsList

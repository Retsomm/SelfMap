import Svg, { Path } from 'react-native-svg'
import type { ColorValue } from 'react-native'

// ── 流日影響圖示（18×18 viewBox，取代原本的彩色 emoji）──────────────────────────

export function IconBolt({ color }: { color: ColorValue }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round"
      />
    </Svg>
  )
}

export function IconWave({ color }: { color: ColorValue }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 8.5c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M2 15.5c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

export function IconLink({ color }: { color: ColorValue }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 6.5l1-1a3.5 3.5 0 015 5l-1 1"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M13 17.5l-1 1a3.5 3.5 0 01-5-5l1-1"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M9.5 14.5l5-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

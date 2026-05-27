interface Props {
  size?: number
}

export default function SelfMapLogo({ size = 20 }: Props) {
  const w = Math.round(size * 18 / 26)
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg
        viewBox="0 0 18 26"
        width={w}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="miter"
        aria-hidden="true"
      >
        {/* Head — 上三角 */}
        <polygon points="9,0.5 13,5 5,5" />
        {/* Ajna — 倒三角 */}
        <polygon points="5,5.5 13,5.5 9,9.5" />
        {/* Throat — 小矩形 */}
        <rect x="5.25" y="10" width="7.5" height="2" />
        {/* Spleen — 左三角 */}
        <polygon points="3.5,13 0,16 3.5,19" />
        {/* G-Center — 菱形（最核心） */}
        <polygon points="9,12.5 13.5,16 9,19.5 4.5,16" />
        {/* Heart — 右三角 */}
        <polygon points="14.5,13 18,16 14.5,19" />
        {/* Sacral — 矩形 */}
        <rect x="5.25" y="20.5" width="7.5" height="2.5" />
        {/* Root — 底部小矩形 */}
        <rect x="5.75" y="23.5" width="6.5" height="2" />
      </svg>
      SelfMap
    </span>
  )
}

/** Logo SVG width ÷ height ratio (original pixel dimensions: 160 × 252). */
const LOGO_WIDTH_RATIO = 160 / 252

interface Props {
  size?: number
}

export default function SelfMapLogo({ size = 20 }: Props) {
  const w = Math.round(size * LOGO_WIDTH_RATIO)
  return (
    <span className="inline-flex items-center gap-1.5">
      <img
        src="/logo-figure-color.svg"
        width={w}
        height={size}
        alt=""
        aria-hidden="true"
      />
      SelfMap
    </span>
  )
}

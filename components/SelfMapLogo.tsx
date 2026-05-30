interface Props {
  size?: number
}

export default function SelfMapLogo({ size = 20 }: Props) {
  const w = Math.round(size * 160 / 252)
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

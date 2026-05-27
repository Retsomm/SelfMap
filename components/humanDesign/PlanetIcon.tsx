interface Props {
  name: string
  className?: string
}

const SW = '2'
const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: SW,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export default function PlanetIcon({ name, className }: Props) {
  switch (name) {
    case '太陽':
      return (
        <svg {...BASE} className={className} aria-label="太陽">
          <circle cx="12" cy="12" r="7"/>
          <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>
        </svg>
      )
    case '地球':
      return (
        <svg {...BASE} className={className} aria-label="地球">
          <circle cx="12" cy="12" r="7"/>
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      )
    case '月亮':
      return (
        <svg {...BASE} className={className} aria-label="月亮" stroke="none">
          <path d="M 15.5,4 A 10,10 0 1,0 15.5,20 A 8,10 0 0,1 15.5,4 Z" fill="currentColor"/>
        </svg>
      )
    case '北交點':
      return (
        <svg {...BASE} className={className} aria-label="北交點">
          <path d="M 5,7 A 7,9 0 0,1 19,7" fill="none"/>
          <circle cx="5" cy="7" r="3"/>
          <circle cx="19" cy="7" r="3"/>
        </svg>
      )
    case '南交點':
      return (
        <svg {...BASE} className={className} aria-label="南交點">
          <path d="M 5,17 A 7,9 0 0,0 19,17" fill="none"/>
          <circle cx="5" cy="17" r="3"/>
          <circle cx="19" cy="17" r="3"/>
        </svg>
      )
    case '水星':
      return (
        <svg {...BASE} className={className} aria-label="水星">
          <path d="M 8,5.5 A 5,4 0 0,1 16,5.5" fill="none"/>
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
          <line x1="9" y1="19.5" x2="15" y2="19.5"/>
        </svg>
      )
    case '金星':
      return (
        <svg {...BASE} className={className} aria-label="金星">
          <circle cx="12" cy="9" r="6"/>
          <line x1="12" y1="15" x2="12" y2="21"/>
          <line x1="9" y1="19" x2="15" y2="19"/>
        </svg>
      )
    case '火星':
      return (
        <svg {...BASE} className={className} aria-label="火星">
          <circle cx="10" cy="14" r="6"/>
          <line x1="14.5" y1="9.5" x2="20" y2="4"/>
          <polyline points="15.5,4 20,4 20,8.5"/>
        </svg>
      )
    case '木星':
      return (
        <svg {...BASE} className={className} aria-label="木星">
          <path d="M 8,5 C 5,9 8,14 14,14" fill="none"/>
          <line x1="7" y1="14" x2="19" y2="14"/>
          <line x1="14" y1="4" x2="14" y2="20"/>
        </svg>
      )
    case '土星':
      return (
        <svg {...BASE} className={className} aria-label="土星">
          <line x1="12" y1="3" x2="12" y2="19"/>
          <path d="M 12,19 Q 7,19 7,14" fill="none"/>
          <line x1="7" y1="10" x2="16" y2="10"/>
        </svg>
      )
    case '天王星':
      return (
        <svg {...BASE} className={className} aria-label="天王星">
          <line x1="7" y1="4" x2="7" y2="15"/>
          <line x1="17" y1="4" x2="17" y2="15"/>
          <line x1="7" y1="9.5" x2="17" y2="9.5"/>
          <line x1="12" y1="15" x2="12" y2="17.5"/>
          <circle cx="12" cy="20" r="2.5"/>
        </svg>
      )
    case '海王星':
      return (
        <svg {...BASE} className={className} aria-label="海王星">
          <line x1="12" y1="4" x2="12" y2="20"/>
          <line x1="7" y1="8" x2="7" y2="14"/>
          <line x1="17" y1="8" x2="17" y2="14"/>
          <path d="M 7,14 Q 12,19 17,14" fill="none"/>
          <line x1="8" y1="20" x2="16" y2="20"/>
        </svg>
      )
    case '冥王星':
      return (
        <svg {...BASE} className={className} aria-label="冥王星">
          <circle cx="12" cy="5.5" r="3"/>
          <line x1="12" y1="8.5" x2="12" y2="21"/>
          <path d="M 12,9.5 Q 19,9.5 19,15 Q 19,20.5 12,20.5" fill="none"/>
          <line x1="9" y1="21" x2="15" y2="21"/>
        </svg>
      )
    default:
      return <span className={className}>{name[0]}</span>
  }
}

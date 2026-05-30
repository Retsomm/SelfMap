import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: number
}

export const LoadingSpinner = ({ className = '', size = 24 }: LoadingSpinnerProps) => (
  <div className={cn('flex items-center justify-center', className)}>
    <Loader2
      role="status"
      aria-label="Loading…"
      width={size}
      height={size}
      className="animate-spin text-(--ink-soft)"
    />
  </div>
)

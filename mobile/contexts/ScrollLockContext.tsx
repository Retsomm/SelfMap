import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'

type ScrollLockCtx = { lockScroll: () => void; unlockScroll: () => void }

const ScrollLockContext = createContext<ScrollLockCtx>({
  lockScroll: () => {},
  unlockScroll: () => {},
})

export function useScrollLock() {
  return useContext(ScrollLockContext)
}

/** Return a stable context value + scrollEnabled state to pass to parent ScrollView. */
export function useScrollLockState() {
  const [enabled, setEnabled] = useState(true)
  const lockScroll = useCallback(() => setEnabled(false), [])
  const unlockScroll = useCallback(() => setEnabled(true), [])
  const ctx = useMemo(() => ({ lockScroll, unlockScroll }), [lockScroll, unlockScroll])
  return { ctx, scrollEnabled: enabled }
}

export { ScrollLockContext }

export function ScrollLockProvider({
  children,
  onLock,
  onUnlock,
}: {
  children: ReactNode
  onLock?: () => void
  onUnlock?: () => void
}) {
  const lockScroll = useCallback(() => onLock?.(), [onLock])
  const unlockScroll = useCallback(() => onUnlock?.(), [onUnlock])
  const ctx = useMemo(() => ({ lockScroll, unlockScroll }), [lockScroll, unlockScroll])
  return <ScrollLockContext.Provider value={ctx}>{children}</ScrollLockContext.Provider>
}

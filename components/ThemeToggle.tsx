'use client'

import { useTheme } from './ThemeProvider'

// 依 theme 狀態切換顯示的圖示（暗色主題顯示太陽、亮色主題顯示月亮，代表點擊後會切換成的樣子）、
// aria-label 文案與 aria-pressed 值，三者都跟著同一個 isDark 走。
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? '切換為亮色主題' : '切換為暗色主題'}
      aria-pressed={isDark}
      className={`w-7 h-7 flex items-center justify-center cursor-pointer text-(--ink-soft) hover:text-(--ink) transition-colors duration-120 shrink-0 ${className}`}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 2.5v2.4M12 19.1v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.2 14.4A8.6 8.6 0 019.6 3.8a8.6 8.6 0 1010.6 10.6z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}

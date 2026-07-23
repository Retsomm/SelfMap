// 純常數，刻意不放進 ThemeProvider.tsx（'use client'）——
// layout.tsx 這種 Server Component 需要在讀 cookie 時用到同一個 key，
// 跨過 client boundary import 純數值常數並不可靠（RSC bundler 只保證元件本身能正確傳遞）。
export const THEME_COOKIE_KEY = 'selfmap-theme'
export type Theme = 'light' | 'dark'

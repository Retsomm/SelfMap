import type { Metadata } from 'next'
import PrivateClient from './PrivateClient'

export const metadata: Metadata = {
  title: '隱私權政策 — SelfMap',
  description: 'SelfMap 隱私權政策：說明我們如何收集、使用、儲存與保護使用者資料，以及使用者的權利。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PrivatePage() {
  return <PrivateClient />
}

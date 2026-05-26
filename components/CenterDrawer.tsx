'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Center } from '@/lib/humanDesign'

interface CenterDrawerProps {
  center: Center | null
  onClose: () => void
}

export default function CenterDrawer({ center, onClose }: CenterDrawerProps) {
  return (
    <AnimatePresence>
      {center && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-zinc-100 z-50 flex flex-col shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      center.defined ? 'bg-indigo-400' : 'bg-zinc-300'
                    }`}
                  />
                  <span className="text-xs text-zinc-400">
                    {center.defined ? '已定義' : '未定義'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900">{center.name}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-zinc-600 leading-relaxed">{center.summary}</p>
              </div>

              <section>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
                  行為影響
                </h3>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {center.behavior}
                </p>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
                  正向特質
                </h3>
                <div className="flex flex-wrap gap-2">
                  {center.positive.map((item) => (
                    <span
                      key={item}
                      className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
                  盲點
                </h3>
                <div className="flex flex-wrap gap-2">
                  {center.blind.map((item) => (
                    <span
                      key={item}
                      className="bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>

              <section className="bg-indigo-50 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">
                  行動建議
                </h3>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  {center.suggestion}
                </p>
              </section>

              {!center.defined && (
                <div className="border border-zinc-100 rounded-2xl p-5">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                    關於未定義中心
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    未定義中心像一面鏡子，能接收並放大周遭人的能量。這不是弱點，而是你在這個主題上具有彈性與開放性。
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

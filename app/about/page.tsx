'use client'

import { useLang } from '@/i18n'

export default function AboutPage() {
  const { t } = useLang()

  return (
    <main className="max-w-360 mx-auto px-3 md:px-14 pt-28 pb-20">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-base tracking-[0.18em] uppercase text-(--ink-soft) mb-3">
          {t('about.eyebrow')}
        </p>
        <h1 className="font-serif italic text-4xl text-(--ink) mb-8 leading-tight">
          {t('about.heading')}
        </h1>
        <div className="border-t border-(--ink) pt-8 space-y-8">
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              {t('about.whatTitle')}
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              {t('about.whatBody')}
            </p>
          </section>
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              {t('about.techTitle')}
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              {t('about.techBody')}
            </p>
          </section>
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              {t('about.privacyTitle')}
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              {t('about.privacyBody')}
            </p>
          </section>
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              {t('about.contactTitle')}
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              {t('about.contactBody')}
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

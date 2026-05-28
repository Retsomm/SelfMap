'use client'

import { useLang } from '@/i18n'

export default function HumanDesignPage() {
  const { t } = useLang()

  return (
    <main className="max-w-360 mx-auto px-3 md:px-14 pt-28 pb-20">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-base tracking-[0.18em] uppercase text-(--ink-soft) mb-3">
          {t('hdPage.eyebrow')}
        </p>
        <h1 className="font-serif italic text-4xl text-(--ink) mb-8 leading-tight">
          {t('hdPage.heading')}
        </h1>
        <div className="border-t border-(--ink) pt-8 space-y-8">
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              {t('hdPage.whatTitle')}
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              {t('hdPage.whatBody')}
            </p>
          </section>
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              {t('hdPage.typesTitle')}
            </h2>
            <ul className="space-y-3 text-base leading-relaxed text-(--ink)">
              <li>
                <span className="font-medium">{t('hdPage.manifestor')}</span>
                <span className="text-(--ink-soft)"> — {t('hdPage.manifestorDesc')}</span>
              </li>
              <li>
                <span className="font-medium">{t('hdPage.generator')}</span>
                <span className="text-(--ink-soft)"> — {t('hdPage.generatorDesc')}</span>
              </li>
              <li>
                <span className="font-medium">{t('hdPage.mgGenerator')}</span>
                <span className="text-(--ink-soft)"> — {t('hdPage.mgGeneratorDesc')}</span>
              </li>
              <li>
                <span className="font-medium">{t('hdPage.projector')}</span>
                <span className="text-(--ink-soft)"> — {t('hdPage.projectorDesc')}</span>
              </li>
              <li>
                <span className="font-medium">{t('hdPage.reflector')}</span>
                <span className="text-(--ink-soft)"> — {t('hdPage.reflectorDesc')}</span>
              </li>
            </ul>
          </section>
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              {t('hdPage.gatesTitle')}
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              {t('hdPage.gatesBody')}
            </p>
          </section>
          <section>
            <h2 className="font-mono text-base tracking-[0.16em] uppercase text-(--ink-soft) mb-3">
              {t('hdPage.howTitle')}
            </h2>
            <p className="text-base leading-relaxed text-(--ink)">
              {t('hdPage.howBody')}
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

import { t } from '@/i18n/site'
import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { HeroShader } from '@/components/HeroShader'
import { NotFoundWordmark } from '@/components/Brand'
import { ArrowLeftIcon } from '@/components/icons'
import {
  NOT_FOUND_HEIGHT,
  NOT_FOUND_ROWS,
  NOT_FOUND_WIDTH,
} from '@/data/not-found-bitmap'
import { WORDMARK_HEIGHT } from '@/data/wordmark-bitmap'
import { Button } from '@/components/ui/button'
import { useTopLink } from '@/lib/hash-scroll'

const GLYPH = {
  rows: NOT_FOUND_ROWS,
  width: NOT_FOUND_WIDTH,
  height: NOT_FOUND_HEIGHT,
}

export function NotFoundHero() {
  const navigate = useNavigate()
  const [painted, setPainted] = useState(false)
  const home = useTopLink()

  return (
    <main>
      <section
        data-hero-sentinel
        className="pixel-container relative -mt-(--nav-h) flex min-h-svh flex-col overflow-hidden border-b border-border-subtle pt-(--nav-h) select-none [-webkit-touch-callout:none]"
        style={{ background: 'var(--t-field-bg)' }}
      >
        <HeroShader
          glyph={GLYPH}
          onPainted={() => setPainted(true)}
          onGlyphPress={() => void navigate({ to: '/' })}
        />

        <div className="pointer-events-none relative flex flex-1 flex-col items-center px-6">
          <div className="flex-[0.5]" />
          <div
            className="flex w-full items-center justify-center"
            style={{ height: `calc(var(--pxr) * ${WORDMARK_HEIGHT})` }}
          >
            <div
              style={{
                width: `min(calc(var(--pxc) * ${NOT_FOUND_WIDTH}), 100%)`,
              }}
            >
              <NotFoundWordmark
                data-hero-wordmark
                label={t('Not found')}
                className={
                  'w-full text-[color:var(--t-field-lit)]' +
                  (painted ? ' invisible' : '')
                }
              />
            </div>
          </div>

          <div
            data-hero-quiet
            className="pointer-events-auto mt-12 flex w-full max-w-2xl flex-col items-center text-center lg:mt-[calc(var(--pxr)*5)]"
          >
            <h1
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-2xl font-medium tracking-tight text-text [text-wrap:balance] sm:text-3xl"
            >
              <span className="sr-only">404: </span>
              {t('There is nothing at this address.')}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
              <span className="block [text-wrap:balance]">
                {t('The link may be old,')}
              </span>
              <span className="block [text-wrap:balance]">
                {t('or the page may have moved.')}
              </span>
            </p>
            {/* A real control, because the word above is a canvas: keyboards
              and anything without JavaScript need a way out of here too. */}
            <div className="mt-9 flex w-full max-w-xs flex-col items-stretch sm:w-auto sm:max-w-none">
              <Button
                size="lg"
                variant="outline"
                className="h-10 pr-4 has-data-[icon=inline-start]:pl-3"
                nativeButton={false}
                onClick={home}
                render={<Link to="/" />}
              >
                <ArrowLeftIcon data-icon="inline-start" />
                {t('Back to Omarchy')}
              </Button>
            </div>
          </div>
          <div className="flex-1" />
        </div>
      </section>
    </main>
  )
}

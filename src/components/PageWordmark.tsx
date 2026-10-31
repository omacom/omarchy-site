import { OmarchyWordmark, WORDMARK_BANDS } from '@/components/Brand'

export function PageWordmark({
  brand = 'omarchy',
}: {
  brand?: 'omarchy' | 'oma'
}) {
  if (brand === 'oma') {
    return (
      <div
        role="img"
        aria-label="OMA"
        className="mx-auto mb-3 w-[32.93%] max-w-[14.818rem] text-[color:var(--t-field-lit)]"
        style={{
          aspectRatio: '722 / 300',
          backgroundColor: 'currentColor',
          backgroundImage: WORDMARK_BANDS,
          maskImage: 'url(/brand/oma-logo-mask.svg)',
          maskRepeat: 'no-repeat',
          maskSize: '100% 100%',
          WebkitMaskImage: 'url(/brand/oma-logo-mask.svg)',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskSize: '100% 100%',
        }}
      />
    )
  }

  return (
    <OmarchyWordmark
      label="Omarchy"
      className="mx-auto mb-3 w-[59.5%] max-w-[26.775rem] text-[color:var(--t-field-lit)]"
      background={WORDMARK_BANDS}
    />
  )
}

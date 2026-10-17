import type { ImgHTMLAttributes } from 'react'

export function CatalanIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/assets/flags/es-ct.svg"
      alt=""
      width={24}
      height={16}
      {...props}
    />
  )
}

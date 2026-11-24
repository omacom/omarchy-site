import { readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

// JPEG/PNG copies for src/lib/webp-fallback.ts.
export async function writeWebpFallbacks(dir) {
  const files = (await readdir(dir, { recursive: true })).filter((f) =>
    f.endsWith('.webp'),
  )
  await Promise.all(
    files.map(async (file) => {
      const from = path.join(dir, file)
      const image = sharp(from).resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      const { hasAlpha } = await image.metadata()
      await (hasAlpha
        ? image.png({ palette: true }).toFile(`${from}.png`)
        : image.jpeg({ quality: 75, mozjpeg: true }).toFile(`${from}.jpg`))
    }),
  )
  return files.length
}

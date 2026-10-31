import type { APIRoute } from 'astro'
import { buildSearchIndex } from '../../astro/search-index'

export const prerender = true

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(await buildSearchIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

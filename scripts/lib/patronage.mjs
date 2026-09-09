const FORM_ID = '62c3f62f-2b29-4cc2-9336-81c6a6afb259'
const ENDPOINT = 'https://api.zeffy.com/_new/trpc/form_getLatestDonations'

/** Complete the public feed before publishing any changes to its snapshot. */
export async function fetchPatronage(fetchPage = fetch) {
  const donations = new Map()
  const cursors = new Set()
  let cursor
  for (let page = 0; page < 1000; page++) {
    const url = new URL(ENDPOINT)
    url.searchParams.set(
      'input',
      JSON.stringify({
        formId: FORM_ID,
        limit: 100,
        direction: 'forward',
        cursor,
      }),
    )
    const response = await fetchPage(url, {
      headers: {
        accept: 'application/json',
        origin: 'https://www.zeffy.com',
        referer: 'https://www.zeffy.com/',
        'user-agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) throw new Error(`Zeffy donations → ${response.status}`)
    const data = (await response.json())?.result?.data
    if (
      !Array.isArray(data?.items) ||
      !(
        data.nextCursor == null ||
        (Number.isSafeInteger(data.nextCursor) && data.nextCursor >= 0)
      )
    ) {
      throw new Error('Unexpected Zeffy pagination response')
    }
    const before = donations.size
    for (const donation of data.items) {
      if (!donation || typeof donation.id !== 'string' || !donation.id) {
        throw new Error('Zeffy donation is missing its ID')
      }
      donations.set(donation.id, donation)
    }
    if (data.nextCursor == null) return [...donations.values()]
    if (cursors.has(data.nextCursor) || donations.size === before) {
      throw new Error('Zeffy pagination stopped making progress')
    }
    cursors.add(data.nextCursor)
    cursor = data.nextCursor
  }
  throw new Error('Zeffy pagination exceeded 1000 pages')
}

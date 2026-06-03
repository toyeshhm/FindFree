import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import { createProvider, LLMDeal, ProviderName } from './providers/index'

export const DISCOVERY_QUERIES: string[] = [
  'freebies 2025 free stuff no purchase necessary',
  'free food deals today restaurant promotions',
  'student discounts 2025 verification free',
  'buy one get one free BOGO restaurant deals',
  'free samples by mail 2025',
  'app only exclusive deals promotions',
  'limited time free item offer this week',
  'retail store coupons free item with purchase',
  'local giveaways community free events',
  'free coffee tea drink promotion today',
  'fast food deals free item coupon',
]

export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await Promise.race([
      fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000),
      ),
    ])
    const html = await (res as any).text()
    const ogMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    )
    if (ogMatch) return ogMatch[1]
    const twitterMatch = html.match(
      /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    )
    if (twitterMatch) return twitterMatch[1]
    return null
  } catch {
    return null
  }
}

export function deduplicateDeals(deals: LLMDeal[]): LLMDeal[] {
  const seenUrls = new Set<string>()
  const seenTitles: string[] = []
  const result: LLMDeal[] = []

  function titleWords(title: string): string[] {
    return title.toLowerCase().split(/\s+/)
  }

  function hasOverlap(a: string, b: string): boolean {
    const wordsA = titleWords(a)
    const wordsB = titleWords(b)
    for (let i = 0; i <= wordsA.length - 5; i++) {
      const phrase = wordsA.slice(i, i + 5).join(' ')
      const bStr = wordsB.join(' ')
      if (bStr.includes(phrase)) return true
    }
    return false
  }

  for (const deal of deals) {
    if (seenUrls.has(deal.sourceUrl)) continue
    const dupTitle = seenTitles.some((t) => hasOverlap(t, deal.title))
    if (dupTitle) continue
    seenUrls.add(deal.sourceUrl)
    seenTitles.push(deal.title)
    result.push(deal)
  }

  return result
}

export async function discoverWithLLM(
  supabase: any,
  providerName: ProviderName = 'gemini',
): Promise<number> {
  const apiKey =
    providerName === 'gemini'
      ? process.env.GEMINI_API_KEY
      : process.env.GROQ_API_KEY

  if (!apiKey) throw new Error(`Missing API key for provider: ${providerName}`)

  const provider = createProvider(providerName, { apiKey })
  console.log(`[llm-discovery] Running ${DISCOVERY_QUERIES.length} queries via ${providerName}`)

  const allDeals: LLMDeal[] = []
  const batchSize = 3

  for (let i = 0; i < DISCOVERY_QUERIES.length; i += batchSize) {
    const batch = DISCOVERY_QUERIES.slice(i, i + batchSize)
    const results = await Promise.all(batch.map((q) => provider.discoverDeals(q).catch(() => [])))
    results.forEach((r) => allDeals.push(...r))
    console.log(`[llm-discovery] Batch ${Math.ceil((i + 1) / batchSize)} done, ${allDeals.length} deals so far`)
  }

  const unique = deduplicateDeals(allDeals)
  console.log(`[llm-discovery] ${unique.length} unique deals after dedup (from ${allDeals.length})`)

  if (unique.length === 0) {
    console.log('[llm-discovery] No deals found')
    return 0
  }

  for (const deal of unique) {
    if (!deal.imageUrl) {
      deal.imageUrl = (await fetchOgImage(deal.sourceUrl)) ?? undefined
    }
  }

  const sourceIds = unique.map(
    (d) => `llm_${Buffer.from(d.sourceUrl).toString('base64').slice(0, 40)}`,
  )

  const { data: existing } = await supabase
    .from('items')
    .select('source_id')
    .in('source_id', sourceIds)

  const existingSet = new Set<string>((existing ?? []).map((r: any) => r.source_id))

  const toInsert = unique
    .map((deal, idx) => ({ deal, sourceId: sourceIds[idx] }))
    .filter(({ sourceId }) => !existingSet.has(sourceId))
    .map(({ deal, sourceId }) => ({
      title: deal.title,
      description: deal.description,
      category: deal.category,
      source_id: sourceId,
      source_url: deal.sourceUrl,
      source: 'reddit' as const,
      deal_type: deal.dealType,
      tags: deal.tags,
      status: 'available' as const,
      photo_urls: deal.imageUrl ? [deal.imageUrl] : [],
      expires_at: deal.estimatedExpiry ?? null,
    }))

  if (toInsert.length === 0) {
    console.log('[llm-discovery] No new deals to insert')
    return 0
  }

  const { error } = await supabase.from('items').insert(toInsert)
  if (error) {
    console.error('[llm-discovery] Insert error:', error.message)
    return 0
  }

  console.log(`[llm-discovery] Inserted ${toInsert.length} new deals`)
  return toInsert.length
}

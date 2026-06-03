import { supabase } from '@/lib/supabase';

export const DISCOVERY_QUERIES: string[] = [
  'freebies 2025 free stuff no purchase necessary',
  'free food deals today restaurant promotions',
  'student discounts 2025',
  'buy one get one free BOGO deals',
  'free samples by mail 2025',
  'app only exclusive deals promotions',
  'limited time free item offer this week',
  'retail store coupons free item with purchase',
  'local giveaways community free events',
  'free coffee tea drink promotion',
  'fast food deals free item coupon',
];

export interface LLMDeal {
  title: string;
  headline: string;
  description: string;
  merchantName: string;
  category: 'food' | 'drinks' | 'grocery' | 'electronics' | 'clothing' | 'retail' | 'other';
  dealType: 'code' | 'in-store' | 'app-required' | 'no-action';
  tags: string[];
  sourceUrl: string;
  couponCode?: string;
  estimatedExpiry?: string | null;
  confidence: number;
  imageUrl?: string;
}

export async function callGeminiAPI(query: string, apiKey: string): Promise<LLMDeal[]> {
  const prompt = `Find 5-8 real, currently active deals/freebies for: ${query}. Return JSON array where each item has: title (punchy, max 100 chars), headline (one sentence hook), description (2 sentences + How to claim steps + expiry line in blog format), merchantName, category (food/drinks/grocery/electronics/clothing/retail/other), dealType (code/in-store/app-required/no-action), tags (array), sourceUrl, couponCode (optional), estimatedExpiry (ISO date or null), confidence (0-1)`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];

    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function discoverDealsWithLLM(userId: string): Promise<number> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return 0;

  const allDeals: LLMDeal[] = [];

  for (const query of DISCOVERY_QUERIES) {
    const deals = await callGeminiAPI(query, apiKey);
    allDeals.push(...deals);
  }

  // Deduplicate by sourceUrl
  const seen = new Set<string>();
  const unique = allDeals.filter((d) => {
    if (seen.has(d.sourceUrl)) return false;
    seen.add(d.sourceUrl);
    return true;
  });

  // Filter by confidence
  const confident = unique.filter((d) => d.confidence >= 0.7);

  let inserted = 0;

  for (const deal of confident) {
    const sourceId = 'llm_' + btoa(deal.sourceUrl).slice(0, 40);

    const { data: existing } = await supabase
      .from('items')
      .select('id')
      .eq('source_id', sourceId)
      .maybeSingle();

    if (existing) continue;

    const { error } = await supabase.from('items').insert({
      source_id: sourceId,
      title: deal.title,
      headline: deal.headline,
      description: deal.description,
      merchant_name: deal.merchantName,
      category: deal.category,
      deal_type: deal.dealType,
      tags: deal.tags,
      source_url: deal.sourceUrl,
      coupon_code: deal.couponCode ?? null,
      estimated_expiry: deal.estimatedExpiry ?? null,
      confidence: deal.confidence,
      image_url: deal.imageUrl ?? null,
      user_id: userId,
    });

    if (!error) inserted++;
  }

  return inserted;
}

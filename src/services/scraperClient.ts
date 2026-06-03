import { supabase } from '@/lib/supabase';

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (/food|burger|pizza|taco|chicken|meal|restaurant|dining|breakfast|lunch|dinner|sushi|snack|cookie|donut|fries|bbq/.test(t)) return 'food';
  if (/drink|coffee|tea|starbucks|dunkin|smoothie|juice|soda|beer|wine|latte|espresso|boba|beverage/.test(t)) return 'drinks';
  if (/grocery|aldi|kroger|safeway|whole.?foods|trader.?joe|wegmans|publix|costco|produce|organic|cereal|pasta/.test(t)) return 'grocery';
  if (/phone|laptop|computer|gaming|\bgame\b|steam|xbox|playstation|nintendo|\btv\b|camera|headphone|speaker|tablet|ipad|iphone|android|\btech\b|gadget/.test(t)) return 'electronics';
  if (/\bcloth|apparel|shirt|pants|shoes|sneaker|dress|jacket|coat|fashion|\bwear\b|sock|underwear|hoodie|jeans/.test(t)) return 'clothing';
  if (/furniture|sofa|couch|\bchair\b|\btable\b|\bbed\b|\bdesk\b|shelf|bookcase|\blamp\b|mattress/.test(t)) return 'furniture';
  if (/kitchen|cookware|\bpan\b|\bpot\b|utensil|appliance|blender|mixer|air fryer|\bknife\b/.test(t)) return 'kitchen';
  if (/\bbook\b|novel|textbook|ebook|kindle|audiobook|magazine|\bcomic\b/.test(t)) return 'books';
  if (/sport|fitness|\bgym\b|workout|exercise|yoga|running|hiking|cycling|golf|tennis|basketball|football/.test(t)) return 'sports';
  if (/\btoy\b|lego|puzzle|board.?game|action.?figure|\bdoll\b|stuffed|\bkids\b|children|\bbaby\b/.test(t)) return 'toys';
  return 'other';
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const t = text.toLowerCase();
  if (/no purchase/i.test(t)) tags.push('no purchase needed');
  if (/app.?only|in.?app|app.?required/i.test(t)) tags.push('app required');
  if (/in.?store|instore/i.test(t)) tags.push('in-store only');
  if (/\bonline\b|digital/i.test(t)) tags.push('online only');
  if (/bogo|buy one get one/i.test(t)) tags.push('bogo');
  if (/free\s+shipping/i.test(t)) tags.push('free shipping');
  if (/limited.?time|while supplies/i.test(t)) tags.push('limited time');
  if (/\d+%\s*off|save\s*\$\d+/i.test(t)) tags.push('discount');
  return [...new Set(tags)];
}

// ── Flipp location helpers ─────────────────────────────────────────────────

const _locCache: Record<string, { lat: number; lng: number } | null> = {};

async function getMerchantLocation(name: string, fallback: { lat: number; lng: number }): Promise<{ lat: number; lng: number }> {
  if (_locCache[name] !== undefined) return _locCache[name] ?? fallback;
  const key = (process.env as any).EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) { _locCache[name] = null; return fallback; }
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&location=${fallback.lat},${fallback.lng}&radius=10000&key=${key}`;
    const json = await (await fetch(url)).json();
    if ((json as any).results?.length > 0) {
      _locCache[name] = (json as any).results[0].geometry.location;
      return _locCache[name] as { lat: number; lng: number };
    }
  } catch { /* ignore */ }
  _locCache[name] = null;
  return fallback;
}

async function getPostalCode(lat: number, lng: number): Promise<string> {
  const key = (process.env as any).EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) return '10001';
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
    const json = await (await fetch(url)).json();
    const zip = ((json as any).results?.[0]?.address_components ?? []).find((c: any) => c.types.includes('postal_code'));
    if (zip) return zip.short_name;
  } catch { /* ignore */ }
  return '10001';
}

// ── Flipp flyer scraper ────────────────────────────────────────────────────

async function scrapeFlipp(userId: string, location: { lat: number; lng: number }): Promise<any[]> {
  try {
    const postalCode = await getPostalCode(location.lat, location.lng);
    const queries = ['free', 'sale', 'deal'];
    const allItems: any[] = [];
    for (const q of queries) {
      const url = `https://backflipp.wishabi.com/flipp/items/search?locale=en&postal_code=${postalCode}&q=${q}`;
      const json = await (await fetch(url)).json();
      if ((json as any).items) allItems.push(...(json as any).items);
    }
    const seen = new Set<string>();
    const uniqueItems = allItems.filter(item => {
      if (!item.id || seen.has(String(item.id))) return false;
      seen.add(String(item.id));
      return true;
    });

    const deals = await Promise.all(
      uniqueItems.slice(0, 75).map(async (item: any) => {
        const jitter = { lat: location.lat + (Math.random() - 0.5) * 0.05, lng: location.lng + (Math.random() - 0.5) * 0.05 };
        const loc = await getMerchantLocation(item.merchant_name ?? '', jitter);

        const originalPrice: number | null = item.original_price ?? item.was_price ?? null;
        const currentPrice:  number | null = item.current_price ?? null;
        const savings = originalPrice && currentPrice ? (originalPrice - currentPrice).toFixed(2) : null;

        const descParts = [
          item.sale_story ?? null,
          currentPrice  ? `Price: $${currentPrice}`   : null,
          originalPrice ? `Was: $${originalPrice}`     : null,
          savings       ? `Save: $${savings}`          : null,
          item.pre_price_text ?? null,
        ].filter(Boolean);

        const tags = ['in-store only'];
        if (savings && parseFloat(savings) > 0) tags.push('discount');
        if (item.valid_to) tags.push('limited time');

        return {
          title:       (item.name || item.merchant_name || 'Flipp Deal').substring(0, 200),
          description: descParts.join(' | ').substring(0, 500),
          category:    inferCategory((item.name ?? '') + ' ' + (item.sale_story ?? '')),
          source:      'flipp',
          source_name: item.merchant_name ?? 'Flipp',
          source_id:   `flipp_${item.id}`,
          source_url:  `https://flipp.com/item/${item.id}`,
          deal_type:   'in-store',
          tags,
          status:      'available',
          photo_urls:  item.clean_image_url ? [item.clean_image_url] : [],
          user_id:     userId,
          expires_at:  item.valid_to  || null,
          lat: loc.lat, lng: loc.lng,
        };
      })
    );
    return deals;
  } catch (err) {
    console.log('[scraper] Flipp error:', err);
    return [];
  }
}

async function scrapeRedditSub(userId: string, subreddit: string): Promise<any[]> {
  try {
    const rssUrl = `https://www.reddit.com/r/${subreddit}/new.rss`;
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
    const json = await response.json() as any;
    if (json.status !== 'ok') return [];

    const rawDeals = await Promise.all(json.items.map(async (item: any) => {
      const sourceUrl = item.link;
      const title = item.title;
      const desc = item.description || '';

      const isExpired = desc.toLowerCase().includes('expired') || title.toLowerCase().includes('expired');
      if (isExpired) return null;

      let photoUrl = item.thumbnail;
      if (!photoUrl) {
        const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) photoUrl = imgMatch[1];
      }

      let externalLink = sourceUrl;
      const linkMatch = item.content?.match(/<a href="([^"]+)">\[link\]<\/a>/);
      if (linkMatch && linkMatch[1]) externalLink = linkMatch[1];

      if (externalLink.includes('amazon.com') || externalLink.includes('amzn.to') || title.toLowerCase().includes('amazon')) {
        let amazonImg: string | null = null;
        if (externalLink.startsWith('http')) {
          try {
            const res = await fetch(externalLink, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await res.text();
            let m = html.match(/<meta property="og:image" content="([^"]+)"/);
            if (!m) m = html.match(/id="landingImage"[^>]+src="([^"]+)"/);
            if (m && m[1]) amazonImg = m[1];
          } catch { /* ignore */ }
        }
        if (amazonImg) {
          photoUrl = amazonImg;
        } else if (!photoUrl || photoUrl.includes('default') || photoUrl.includes('reddit')) {
          photoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png';
        }
      }

      let cleanDesc = desc.replace(/<[^>]*>?/gm, '');
      cleanDesc = cleanDesc.replace(/submitted by\s+\/u\/[^\s]+\s+\[link\]\s+\[comments\]/gi, '').replace(/\[link\]\s*\[comments\]/gi, '').trim();

      return {
        title:       title.substring(0, 200),
        description: cleanDesc.substring(0, 500),
        category:    inferCategory(title + ' ' + cleanDesc),
        source:      'reddit',
        source_id:   item.guid || sourceUrl,
        source_url:  sourceUrl,
        deal_type:   sourceUrl?.includes('reddit.com') ? 'none' : 'online',
        tags:        extractTags(title + ' ' + cleanDesc),
        status:      'available',
        photo_urls:  photoUrl ? [photoUrl.replace(/&amp;/g, '&')] : [],
        user_id:     userId,
      };
    }));
    return rawDeals.filter(Boolean);
  } catch (err) {
    console.log(`[scraper] Reddit r/${subreddit} error:`, err);
    return [];
  }
}

export async function scrapeMoreFinds(
  userId: string,
  location?: { lat: number; lng: number } | null,
): Promise<number> {
  const loc = location ?? { lat: 40.7128, lng: -74.0060 };

  const [freebies, deals, efreebies, flippDeals] = await Promise.allSettled([
    scrapeRedditSub(userId, 'freebies'),
    scrapeRedditSub(userId, 'deals'),
    scrapeRedditSub(userId, 'eFreebies'),
    scrapeFlipp(userId, loc),
  ]);

  const allDeals: any[] = [
    ...(freebies.status    === 'fulfilled' ? freebies.value    : []),
    ...(deals.status       === 'fulfilled' ? deals.value       : []),
    ...(efreebies.status   === 'fulfilled' ? efreebies.value   : []),
    ...(flippDeals.status  === 'fulfilled' ? flippDeals.value  : []),
  ];

  console.log(`[scraper] Collected ${allDeals.length} raw deals`);

  const sourceIds = [...new Set(allDeals.map(d => d?.source_id).filter(Boolean))];
  const { data: existingRows } = await supabase
    .from('items')
    .select('source_id')
    .in('source_id', sourceIds.slice(0, 400));

  const existingSet = new Set((existingRows ?? []).map((r: any) => r.source_id));
  const newDeals = allDeals.filter(d => d?.source_id && !existingSet.has(d.source_id));

  let inserted = 0;
  for (let i = 0; i < newDeals.length; i += 50) {
    const batch = newDeals.slice(i, i + 50);
    const { error } = await supabase.from('items').insert(batch);
    if (error) {
      for (const deal of batch) {
        const { error: e2 } = await supabase.from('items').insert(deal);
        if (!e2) inserted++;
      }
    } else {
      inserted += batch.length;
    }
  }

  return inserted;
}

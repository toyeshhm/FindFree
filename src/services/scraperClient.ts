import { supabase } from '@/lib/supabase';

// ── Inference utilities ────────────────────────────────────────────────────

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (/food|burger|pizza|taco|chicken|meal|restaurant|dining|breakfast|lunch|dinner|sushi|sandwich|snack|cookie|donut|fries|bbq|wings|burritos/.test(t)) return 'food';
  if (/drink|coffee|tea|starbucks|dunkin|smoothie|juice|soda|beer|wine|latte|espresso|boba|beverage|kombucha/.test(t)) return 'drinks';
  if (/grocery|aldi|kroger|safeway|whole.?foods|trader.?joe|wegmans|publix|costco|produce|organic|cereal|pasta|sauce|condiment/.test(t)) return 'grocery';
  if (/phone|laptop|computer|gaming|\bgame\b|steam|xbox|playstation|nintendo|\btv\b|camera|headphone|speaker|tablet|ipad|iphone|android|\btech\b|gadget|drone|smartwatch/.test(t)) return 'electronics';
  if (/\bcloth|apparel|shirt|pants|shoes|sneaker|dress|jacket|coat|fashion|\bwear\b|sock|underwear|hoodie|jeans|sweater|outfit|boot/.test(t)) return 'clothing';
  if (/furniture|sofa|couch|\bchair\b|\btable\b|\bbed\b|\bdesk\b|shelf|bookcase|\blamp\b|mattress|dresser|ottoman|cabinet/.test(t)) return 'furniture';
  if (/kitchen|cookware|\bpan\b|\bpot\b|utensil|appliance|blender|mixer|coffee maker|instant pot|air fryer|\bknife\b/.test(t)) return 'kitchen';
  if (/\bbook\b|novel|textbook|ebook|kindle|audiobook|magazine|\bcomic\b/.test(t)) return 'books';
  if (/sport|fitness|\bgym\b|workout|exercise|yoga|running|hiking|cycling|golf|tennis|basketball|football|baseball|soccer|athletic/.test(t)) return 'sports';
  if (/\btoy\b|lego|puzzle|board.?game|action.?figure|\bdoll\b|stuffed|\bkids\b|children|\bbaby\b|playmat/.test(t)) return 'toys';
  if (/beauty|makeup|skincare|lotion|shampoo|cosmetic|perfume|fragrance|hair.?care/.test(t)) return 'retail';
  return 'other';
}

function inferClaimType(text: string): 'code' | 'in-store' | 'app-required' | 'no-action' {
  const t = text.toLowerCase();
  if (/promo.?code|coupon.?code|use code|enter code|discount code|code:/i.test(t)) return 'code';
  if (/app.?only|in.?app|app.?required|download.?app|app.?exclusive|mobile app/i.test(t)) return 'app-required';
  if (/in.?store|instore|retail.?store|at.?participating|at.?select|brick.?and.?mortar/i.test(t)) return 'in-store';
  return 'no-action';
}

function extractTags(text: string): string[] {
  const t = text.toLowerCase();
  const tags: string[] = [];
  if (/no purchase/i.test(t)) tags.push('no purchase needed');
  if (/app.?only|in.?app|app.?required/i.test(t)) tags.push('app required');
  if (/in.?store|instore/i.test(t)) tags.push('in-store only');
  if (/\bonline\b|digital/i.test(t)) tags.push('online only');
  if (/bogo|buy one get one/i.test(t)) tags.push('bogo');
  if (/free\s+shipping/i.test(t)) tags.push('free shipping');
  if (/limited.?time|while supplies/i.test(t)) tags.push('limited time');
  if (/\bfree\b.+(?:item|product|sample|gift)/i.test(t)) tags.push('free item');
  if (/\d+%\s*off|save\s*\$\d+/i.test(t)) tags.push('discount');
  if (/amazon/i.test(t)) tags.push('amazon');
  return [...new Set(tags)];
}

// ── RSS parser (no external deps) ──────────────────────────────────────────

function parseRSSItems(xml: string): Array<{ title: string; desc: string; link: string; imageUrl?: string }> {
  const out: Array<{ title: string; desc: string; link: string; imageUrl?: string }> = [];
  const rx = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(xml)) !== null) {
    const raw = m[1];
    const tag = (t: string) =>
      raw.match(new RegExp(`<${t}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${t}>`))?.[1]?.trim() ?? '';
    const unescape = (s: string) =>
      s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const title = unescape(tag('title'));
    const desc  = unescape(tag('description'));
    const link  = tag('link') || (raw.match(/https?:\/\/[^\s<"']+/)?.[0] ?? '');
    const imageUrl =
      raw.match(/<enclosure[^>]+url="([^"]+)"/)?.[1] ||
      raw.match(/<media:content[^>]+url="([^"]+)"/)?.[1] ||
      raw.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1];
    if (title && link) out.push({ title, desc, link, imageUrl });
  }
  return out;
}

// ── Location helpers (for Flipp) ───────────────────────────────────────────

const _locCache: Record<string, { lat: number; lng: number } | null> = {};

async function getMerchantLocation(name: string, loc: { lat: number; lng: number }): Promise<{ lat: number; lng: number } | null> {
  if (_locCache[name] !== undefined) return _locCache[name];
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) { _locCache[name] = null; return null; }
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&location=${loc.lat},${loc.lng}&radius=10000&key=${key}`;
    const json = await (await fetch(url)).json();
    if (json.results?.length > 0) { _locCache[name] = json.results[0].geometry.location; return _locCache[name]; }
  } catch { /* ignore */ }
  _locCache[name] = null;
  return null;
}

async function getPostalCode(lat: number, lng: number): Promise<string> {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) return '10001';
  try {
    const url  = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
    const json = await (await fetch(url)).json();
    const zip  = (json.results?.[0]?.address_components ?? []).find((c: any) => c.types.includes('postal_code'));
    if (zip) return zip.short_name;
  } catch { /* ignore */ }
  return '10001';
}

// ── Scrapers ───────────────────────────────────────────────────────────────

const REDDIT_SUBS: Array<[string, string]> = [
  ['freebies', 'new'], ['eFreebies', 'new'], ['deals', 'hot'],
  ['DealsReddit', 'hot'], ['coupons', 'new'], ['Frugal', 'hot'],
  ['GameDeals', 'hot'], ['frugalmalefashion', 'hot'],
];

async function scrapeReddit(userId: string): Promise<any[]> {
  const results = await Promise.allSettled(
    REDDIT_SUBS.map(async ([sub, sort]) => {
      const res  = await fetch(`https://www.reddit.com/r/${sub}/${sort}.json?limit=25`, {
        headers: { 'User-Agent': 'FindFreeApp/1.0 (deal aggregator; contact me@findfree.app)' },
      });
      const json = await res.json();
      return (json?.data?.children ?? []).map((p: any) => {
        const d = p.data;
        if (d.stickied) return null;
        const combined = (d.title ?? '') + ' ' + (d.selftext ?? '');
        if (/expired|dead|\boss\b|out.of.stock/i.test(combined)) return null;
        let photoUrl: string | null = null;
        if (d.preview?.images?.[0]?.source?.url) {
          photoUrl = d.preview.images[0].source.url.replace(/&amp;/g, '&');
        } else if (d.thumbnail && !['self', 'default', 'nsfw', 'spoiler', ''].includes(d.thumbnail)) {
          photoUrl = d.thumbnail;
        }
        const externalUrl = d.url && !d.url.includes('reddit.com') ? d.url : null;
        return {
          title:       (d.title ?? '').substring(0, 200),
          description: (d.selftext ?? '').substring(0, 500),
          category:    inferCategory(combined),
          source:      'reddit',
          source_name: `r/${sub}`,
          source_id:   `reddit_${d.id}`,
          source_url:  externalUrl || `https://reddit.com${d.permalink}`,
          deal_type:   inferClaimType(combined),
          tags:        extractTags(combined),
          status:      'available',
          photo_urls:  photoUrl ? [photoUrl] : [],
          user_id:     userId,
          expires_at:  null, lat: null, lng: null,
        };
      }).filter(Boolean);
    })
  );
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
}

async function scrapeRSSFeed(userId: string, url: string, source: string, sourceName: string): Promise<any[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FindFreeApp/1.0)' },
    });
    const xml = await res.text();
    return parseRSSItems(xml).map(item => {
      const combined = item.title + ' ' + item.desc.replace(/<[^>]+>/g, '');
      const cleanDesc = item.desc.replace(/<[^>]+>/g, '').substring(0, 500);
      return {
        title:       item.title.substring(0, 200),
        description: cleanDesc,
        category:    inferCategory(combined),
        source,
        source_name: sourceName,
        source_id:   `${source}_${item.link.replace(/[^a-z0-9]/gi, '').substring(0, 60)}`,
        source_url:  item.link,
        deal_type:   inferClaimType(combined),
        tags:        extractTags(combined),
        status:      'available',
        photo_urls:  item.imageUrl ? [item.imageUrl] : [],
        user_id:     userId,
        expires_at:  null, lat: null, lng: null,
      };
    });
  } catch (e) {
    console.log(`[scraper] ${sourceName} error:`, e);
    return [];
  }
}

async function scrapeFlipp(userId: string, location: { lat: number; lng: number }): Promise<any[]> {
  try {
    const postalCode = await getPostalCode(location.lat, location.lng);
    const url  = `https://backflipp.wishabi.com/flipp/items/search?locale=en&postal_code=${postalCode}&q=free`;
    const json = await (await fetch(url)).json();
    if (!json.items) return [];
    const deals = await Promise.all(
      json.items.slice(0, 30).map(async (item: any) => {
        let loc = await getMerchantLocation(item.merchant_name ?? '', location);
        if (!loc) {
          loc = { lat: location.lat + (Math.random() - 0.5) * 0.05, lng: location.lng + (Math.random() - 0.5) * 0.05 };
        }
        const combined = (item.name ?? '') + ' ' + (item.sale_story ?? '');
        const desc = [item.sale_story, item.current_price ? `Price: ${item.current_price}` : ''].filter(Boolean).join('\n');
        return {
          title:       (item.name || item.merchant_name || 'Flipp Deal').substring(0, 200),
          description: desc.substring(0, 500),
          category:    inferCategory(combined),
          source:      'flipp',
          source_name: item.merchant_name,
          source_id:   `flipp_${item.id}`,
          source_url:  `https://flipp.com/item/${item.id}`,
          deal_type:   'in-store',
          tags:        ['in-store only'],
          status:      'available',
          photo_urls:  item.clean_image_url ? [item.clean_image_url] : [],
          user_id:     userId,
          expires_at:  item.valid_to || null,
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

// ── RSS feed list ──────────────────────────────────────────────────────────

const RSS_SOURCES = [
  { url: 'https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&forumchoice[]=9&rating=2&hideExpired=0&rss=1', source: 'slickdeals', name: 'Slickdeals' },
  { url: 'https://9to5toys.com/deals/feed/', source: '9to5toys', name: '9to5Toys' },
  { url: 'https://hip2save.com/deals/free-stuff/feed/', source: 'hip2save', name: 'Hip2Save' },
  { url: 'https://www.dealnews.com/c142/Electronics/feed.rss', source: 'dealnews', name: 'DealNews Electronics' },
  { url: 'https://www.dealnews.com/c179/Grocery-%26-Gourmet/feed.rss', source: 'dealnews', name: 'DealNews Grocery' },
  { url: 'https://thekrazycouponlady.com/feed/', source: 'krazycouponlady', name: 'Krazy Coupon Lady' },
];

// ── Public export ──────────────────────────────────────────────────────────

export async function scrapeMoreFinds(
  userId: string,
  location?: { lat: number; lng: number } | null
): Promise<number> {
  const loc = location ?? { lat: 40.7128, lng: -74.0060 };

  const [redditResult, ...rest] = await Promise.allSettled([
    scrapeReddit(userId),
    ...RSS_SOURCES.map(f => scrapeRSSFeed(userId, f.url, f.source, f.name)),
    scrapeFlipp(userId, loc),
  ]);

  const allDeals: any[] = [
    ...(redditResult.status === 'fulfilled' ? redditResult.value : []),
    ...rest.flatMap(r => r.status === 'fulfilled' ? r.value : []),
  ];

  console.log(`[scraper] Collected ${allDeals.length} raw deals`);

  // Batch-check existing source_ids
  const sourceIds = [...new Set(allDeals.map(d => d.source_id).filter(Boolean))];
  const { data: existingRows } = await supabase
    .from('items')
    .select('source_id')
    .in('source_id', sourceIds.slice(0, 400));

  const existingSet = new Set((existingRows ?? []).map((r: any) => r.source_id));
  const newDeals = allDeals.filter(d => d.source_id && !existingSet.has(d.source_id));

  console.log(`[scraper] Inserting ${newDeals.length} new deals`);

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

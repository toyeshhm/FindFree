import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import path from 'path';
import { scrapeAllFlyers } from './flyer';
import { discoverWithLLM } from './llm-discovery';

// Load the root .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
  if (t.includes('no purchase')) tags.push('no purchase needed');
  if (t.includes('app required') || t.includes('in app') || t.includes('app only')) tags.push('app required');
  if (t.includes('in store') || t.includes('instore')) tags.push('in-store only');
  if (t.includes('online')) tags.push('online only');
  if (t.includes('bogo')) tags.push('bogo');
  if (t.includes('free shipping')) tags.push('free shipping');
  return tags;
}

// ── Flipp location helpers ─────────────────────────────────────────────────

const _locCache: Record<string, { lat: number; lng: number } | null> = {};

async function getMerchantLocation(name: string, fallback: { lat: number; lng: number }): Promise<{ lat: number; lng: number }> {
  if (_locCache[name] !== undefined) return _locCache[name] ?? fallback;
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) { _locCache[name] = null; return fallback; }
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&location=${fallback.lat},${fallback.lng}&radius=10000&key=${key}`;
    const json = await (await fetch(url)).json() as any;
    if (json.results?.length > 0) {
      _locCache[name] = json.results[0].geometry.location;
      return _locCache[name] as { lat: number; lng: number };
    }
  } catch { /* ignore */ }
  _locCache[name] = null;
  return fallback;
}

async function getPostalCode(lat: number, lng: number): Promise<string> {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) return '10001';
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
    const json = await (await fetch(url)).json() as any;
    const zip = (json.results?.[0]?.address_components ?? []).find((c: any) => c.types.includes('postal_code'));
    if (zip) return zip.short_name;
  } catch { /* ignore */ }
  return '10001';
}

// ── Flipp flyer scraper ────────────────────────────────────────────────────

async function scrapeFlipp(location: { lat: number; lng: number }): Promise<any[]> {
  try {
    const postalCode = await getPostalCode(location.lat, location.lng);
    // Search multiple queries to capture sales beyond just free items
    const queries = ['free', 'sale', 'deal'];
    const allItems: any[] = [];
    for (const q of queries) {
      const url = `https://backflipp.wishabi.com/flipp/items/search?locale=en&postal_code=${postalCode}&q=${q}`;
      const json = await (await fetch(url)).json() as any;
      if (json.items) allItems.push(...json.items);
    }
    // Deduplicate across queries
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
          source_id:   `flipp_${item.id}`,
          source_url:  `https://flipp.com/item/${item.id}`,
          deal_type:   'in-store',
          tags,
          status:      'available',
          photo_urls:  item.clean_image_url ? [item.clean_image_url] : [],
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

async function scrapeReddit(subreddit: string) {
  console.log(`Scraping r/${subreddit} via rss2json...`);
  try {
    const rssUrl = `https://www.reddit.com/r/${subreddit}/new.rss`;
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
    const json = await response.json() as any;
    
    if (json.status !== 'ok') {
      console.error(`RSS2JSON failed for r/${subreddit}`);
      return [];
    }

    const rawDeals = await Promise.all(json.items.map(async (item: any) => {
      const sourceUrl = item.link;
      const title = item.title;
      const desc = item.description || '';

      const category = inferCategory(title + ' ' + desc);
      const tags = extractTags(title + ' ' + desc);
      
      const isExpired = desc.toLowerCase().includes('expired') || title.toLowerCase().includes('expired');
      if (isExpired) return null;

      let photoUrl = item.thumbnail;
      if (!photoUrl) {
        const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) photoUrl = imgMatch[1];
      }

      let externalLink = sourceUrl;
      const linkMatch = item.content?.match(/<a href="([^"]+)">\[link\]<\/a>/);
      if (linkMatch && linkMatch[1]) {
        externalLink = linkMatch[1];
      }

      if (externalLink.includes('amazon.com') || externalLink.includes('amzn.to') || title.toLowerCase().includes('amazon')) {
        let amazonImg: string | null = null;
        if (externalLink.startsWith('http')) {
          try {
            const res = await fetch(externalLink, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            const html = await res.text();
            let m = html.match(/<meta property="og:image" content="([^"]+)"/);
            if (!m) m = html.match(/id="landingImage"[^>]+src="([^"]+)"/);
            if (m && m[1]) amazonImg = m[1];
          } catch(e) {
            console.error('Failed to fetch amazon image', e);
          }
        }
        if (amazonImg) {
          photoUrl = amazonImg;
        } else if (!photoUrl || photoUrl.includes('default') || photoUrl.includes('reddit')) {
          photoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png';
        }
      }

      let cleanDesc = desc.replace(/<[^>]*>?/gm, '');
      // Strip reddit RSS boilerplate
      cleanDesc = cleanDesc.replace(/submitted by\s+\/u\/[^\s]+\s+\[link\]\s+\[comments\]/gi, '');
      cleanDesc = cleanDesc.replace(/\[link\]\s*\[comments\]/gi, '');
      cleanDesc = cleanDesc.trim();

      return {
        title: title.substring(0, 200),
        description: cleanDesc.substring(0, 500),
        category: category,
        source: 'reddit',
        source_id: item.guid || sourceUrl,
        source_url: sourceUrl,
        deal_type: sourceUrl?.includes('reddit.com') ? 'none' : 'online',
        tags: tags,
        status: 'available',
        photo_urls: photoUrl ? [photoUrl.replace(/&amp;/g, '&')] : [],
        expires_at: null,
      };
    }));

    const deals = rawDeals.filter(Boolean);
    return deals;
  } catch (err) {
    console.error(`Error scraping r/${subreddit}:`, err);
    return [];
  }
}

async function run() {
  console.log("Starting deals aggregation...");

  // LLM discovery — Groq first (reliable free tier), Gemini as supplement if key present
  let llmInserted = 0;
  if (process.env.GROQ_API_KEY) {
    llmInserted = await discoverWithLLM(supabase, 'groq');
    console.log(`Groq LLM discovery inserted ${llmInserted} deals`);
  }
  if (process.env.GEMINI_API_KEY) {
    const geminiInserted = await discoverWithLLM(supabase, 'gemini');
    console.log(`Gemini LLM discovery inserted ${geminiInserted} deals`);
    llmInserted += geminiInserted;
  }

  const location = {
    lat: parseFloat(process.env.SCRAPER_LAT ?? '40.7128'),
    lng: parseFloat(process.env.SCRAPER_LNG ?? '-74.0060'),
  };

  // Run Flipp REST API + Reddit in parallel; flyer Selenium scrape runs sequentially after
  // (browser automation can't run fully concurrent with itself)
  const [freebies, deals, efreebies, flippApiDeals] = await Promise.all([
    scrapeReddit('freebies'),
    scrapeReddit('deals'),
    scrapeReddit('eFreebies'),
    scrapeFlipp(location),
  ]);

  // Flyer scraper uses a real browser — opt-in via SCRAPER_FLYERS=true env var
  let flyerDeals: any[] = [];
  if (process.env.SCRAPER_FLYERS === 'true') {
    console.log('Running store flyer scraper (browser)...');
    flyerDeals = await scrapeAllFlyers();
  }

  const allDeals = [...freebies, ...deals, ...efreebies, ...flippApiDeals, ...flyerDeals];
  console.log(`Found ${allDeals.length} potential deals (${flippApiDeals.length} from Flipp API, ${flyerDeals.length} from store flyers).`);

  let insertedCount = 0;

  for (const deal of allDeals) {
    // Deduplicate by source_id
    const { data: existing } = await supabase
      .from('items')
      .select('id, photo_urls')
      .eq('source_id', deal.source_id)
      .single();

    if (!existing) {
      const { error } = await supabase.from('items').insert({
        ...deal,
      });
      if (error) {
        console.error("Error inserting deal:", error.message);
      } else {
        insertedCount++;
      }
    } else {
      // Update existing deal with the new photo_url if it changed (and is valid)
      if (deal.photo_urls && deal.photo_urls.length > 0 && deal.photo_urls[0] !== existing.photo_urls?.[0]) {
        const { error } = await supabase.from('items').update({ photo_urls: deal.photo_urls }).eq('id', existing.id);
        if (error) console.error("Error updating deal:", error.message);
      }
    }
  }

  console.log(`Aggregation complete. Inserted ${insertedCount} new deals, updated photos for existing.`);
}

run();

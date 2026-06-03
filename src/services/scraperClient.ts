import { supabase } from '@/lib/supabase';

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('food') || t.includes('burger') || t.includes('taco') || t.includes('meal')) return 'food';
  if (t.includes('drink') || t.includes('coffee') || t.includes('tea') || t.includes('starbucks')) return 'drinks';
  if (t.includes('grocery') || t.includes('aldi') || t.includes('kroger')) return 'grocery';
  if (t.includes('game') || t.includes('steam') || t.includes('playstation')) return 'electronics';
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

export async function scrapeMoreFinds(userId: string): Promise<number> {
  const subreddits = ['freebies', 'deals', 'eFreebies'];
  let inserted = 0;

  for (const sub of subreddits) {
    try {
      const rssUrl = `https://www.reddit.com/r/${sub}/new.rss`;
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
      const json = await response.json();
      
      if (json.status !== 'ok') continue;

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
            } catch(e) { }
          }
          if (amazonImg) {
            photoUrl = amazonImg;
          } else if (!photoUrl || photoUrl.includes('default') || photoUrl.includes('reddit')) {
            photoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png';
          }
        }

        let cleanDesc = desc.replace(/<[^>]*>?/gm, '');
        cleanDesc = cleanDesc.replace(/submitted by\s+\/u\/[^\s]+\s+\[link\]\s+\[comments\]/gi, '');
        cleanDesc = cleanDesc.replace(/\[link\]\s*\[comments\]/gi, '');
        cleanDesc = cleanDesc.trim();

        return {
          title: title.substring(0, 200),
          description: cleanDesc.substring(0, 500),
          category: inferCategory(title + ' ' + cleanDesc),
          source: 'reddit',
          source_id: item.guid || sourceUrl,
          source_url: sourceUrl,
          deal_type: sourceUrl?.includes('reddit.com') ? 'none' : 'online',
          tags: extractTags(title + ' ' + cleanDesc),
          status: 'available',
          photo_urls: photoUrl ? [photoUrl.replace(/&amp;/g, '&')] : [],
          user_id: userId,
        };
      }));

      const deals = rawDeals.filter(Boolean);

      for (const deal of deals) {
        if (!deal) continue;
        const { data: existing } = await supabase.from('items').select('id').eq('source_id', deal.source_id).single();
        if (!existing) {
          const { error } = await supabase.from('items').insert({ ...deal });
          if (!error) inserted++;
        }
      }
    } catch (err) {
      console.log('Error scraping:', err);
    }
  }

  return inserted;
}

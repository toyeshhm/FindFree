import { chromium, Page } from 'playwright';

// ── Types ──────────────────────────────────────────────────────────────────

interface FlyerItem {
  title: string;
  description: string;
  category: string;
  source: 'flipp';
  source_name: string;
  source_id: string;
  source_url: string;
  deal_type: 'in-store';
  tags: string[];
  status: 'available';
  photo_urls: string[];
  expires_at: string | null;
  lat: null;
  lng: null;
}

interface StoreConfig {
  storeName: string;
  url: string;
  maxItems: number;
}

// ── US store list ──────────────────────────────────────────────────────────

export const US_STORES: StoreConfig[] = [
  { storeName: 'walgreens',      url: 'https://www.walgreens.com/store/weeklyad',               maxItems: 50 },
  { storeName: 'dollar_general', url: 'https://www.dollargeneral.com/weekly-ads.html',          maxItems: 50 },
  { storeName: 'family_dollar',  url: 'https://www.familydollar.com/weekly-ad',                 maxItems: 50 },
  { storeName: 'rite_aid',       url: 'https://www.riteaid.com/store/weekly-ad',                maxItems: 50 },
  { storeName: 'winn_dixie',     url: 'https://www.winndixie.com/weeklyad',                     maxItems: 50 },
  { storeName: 'food_lion',      url: 'https://www.foodlion.com/weeklyspecials',                maxItems: 50 },
  { storeName: 'shoprite',       url: 'https://www.shoprite.com/sm/planning/rsid/550/circular', maxItems: 50 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function inferCategory(text: string): string {
  const t = text.toLowerCase();
  if (/food|burger|pizza|taco|chicken|meal|restaurant|breakfast|lunch|dinner|sushi|snack|cookie|donut|fries|bbq/.test(t)) return 'food';
  if (/drink|coffee|tea|starbucks|smoothie|juice|soda|beer|wine|latte|espresso|boba|beverage/.test(t)) return 'drinks';
  if (/grocery|aldi|kroger|safeway|whole.?foods|trader.?joe|wegmans|publix|costco|produce|organic|cereal|pasta/.test(t)) return 'grocery';
  if (/phone|laptop|computer|gaming|\bgame\b|steam|xbox|playstation|nintendo|\btv\b|camera|headphone|tablet|ipad|iphone|android|\btech\b|gadget/.test(t)) return 'electronics';
  if (/\bcloth|apparel|shirt|pants|shoes|sneaker|dress|jacket|coat|fashion|\bwear\b|sock|hoodie|jeans/.test(t)) return 'clothing';
  if (/furniture|sofa|couch|\bchair\b|\btable\b|\bbed\b|\bdesk\b|shelf|mattress/.test(t)) return 'furniture';
  if (/kitchen|cookware|\bpan\b|\bpot\b|utensil|appliance|blender|mixer|air fryer|\bknife\b/.test(t)) return 'kitchen';
  if (/\bbook\b|novel|textbook|ebook|kindle|audiobook|magazine/.test(t)) return 'books';
  if (/sport|fitness|\bgym\b|workout|yoga|running|hiking|cycling|golf|tennis|basketball|football/.test(t)) return 'sports';
  if (/\btoy\b|lego|puzzle|board.?game|action.?figure|\bdoll\b|stuffed|\bkids\b|children|\bbaby\b/.test(t)) return 'toys';
  return 'other';
}

function extractPriceInfo(label: string): { currentPrice: string; savings: string } {
  // "Save $X.XX, $Y.YY"
  const saveMatch = label.match(/Save \$([\d*?]+),\s*\$([\d.]+)/i);
  if (saveMatch) return { savings: saveMatch[1], currentPrice: saveMatch[2] };

  // "Rollback $X.XX"
  const rollbackMatch = label.match(/Rollback[,\s]+\$?([\d.]+)/i);
  if (rollbackMatch) return { savings: '', currentPrice: rollbackMatch[1] };

  // Cents marker (e.g. "50¢ off")
  if (label.includes('¢')) {
    const nums = label.match(/\$?(\d+(?:\.\d+)?)/g) ?? [];
    if (nums.length >= 1) {
      return { savings: (parseFloat(nums[0].replace('$', '')) * 0.01).toFixed(2), currentPrice: '' };
    }
  }

  // Generic dollar extraction
  const dollars = label.match(/\$(\d+(?:\.\d+)?)/g) ?? [];
  if (dollars.length === 1) return { savings: '', currentPrice: dollars[0].replace('$', '') };
  if (dollars.length >= 2) return { savings: dollars[0].replace('$', ''), currentPrice: dollars[1].replace('$', '') };

  return { currentPrice: '', savings: '' };
}

// ── Aside iframe parser (item detail panel) ────────────────────────────────

async function parseFlippAside(page: Page): Promise<{
  startDate: string | null;
  endDate:   string | null;
  description: string;
  seeMoreLink: string;
}> {
  const empty = { startDate: null, endDate: null, description: '', seeMoreLink: '' };
  try {
    // Try asideframe first, fall back to navframe
    let asideSelector = 'iframe.flippiframe.asideframe';
    const hasAside = await page.locator(asideSelector).count() > 0;
    if (!hasAside) asideSelector = 'iframe.flippiframe.navframe';

    const aside = page.frameLocator(asideSelector);

    const startDate = await aside.locator('flipp-validity-dates').getAttribute('start-date', { timeout: 4000 }).catch(() => null);
    const endDate   = await aside.locator('flipp-validity-dates').getAttribute('end-date',   { timeout: 4000 }).catch(() => null);

    const description = await aside.locator('.flipp-description').textContent({ timeout: 3000 }).catch(() => '');
    const seeMoreLink = await aside.locator('.see-more-link').getAttribute('href', { timeout: 3000 }).catch(() => '');

    return {
      startDate:   startDate ?? null,
      endDate:     endDate   ?? null,
      description: description?.trim() ?? '',
      seeMoreLink: seeMoreLink ?? '',
    };
  } catch {
    return empty;
  }
}

// ── Core flyer scraper ────────────────────────────────────────────────────

async function scrapeStoreFlyer(page: Page, config: StoreConfig): Promise<FlyerItem[]> {
  console.log(`[flyer] Scraping ${config.storeName}...`);
  try {
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(5_000);

    // Dismiss modal if present
    await page.locator('.acsAbandonButton, [data-testid="modal-close"]').first().click({ timeout: 3000 }).catch(() => {});

    await page.waitForSelector('iframe.flippiframe.mainframe', { timeout: 15_000 });
    const mainFrame = page.frameLocator('iframe.flippiframe.mainframe');

    await mainFrame.locator('sfml-flyer-image').first().waitFor({ timeout: 15_000 });
    const imageCount = await mainFrame.locator('sfml-flyer-image').count();

    const data: FlyerItem[] = [];
    const parsedLabels = new Set<string>();

    for (let fi = 0; fi < imageCount && data.length < config.maxItems; fi++) {
      const flyerImage   = mainFrame.locator('sfml-flyer-image').nth(fi);
      const buttonCount  = await flyerImage.locator('button').count();

      for (let bi = 0; bi < buttonCount && data.length < config.maxItems; bi++) {
        const button = flyerImage.locator('button').nth(bi);

        const label = await button.getAttribute('aria-label').catch(() => null);
        if (!label || parsedLabels.has(label)) continue;
        parsedLabels.add(label);

        const dataProductId = await button.getAttribute('data-product-id').catch(() => '') ?? '';
        const productName   = label.split(',')[0].trim();
        const { currentPrice, savings } = extractPriceInfo(label);

        // Click item to open detail panel
        try {
          await button.click({ timeout: 5_000 });
          await page.waitForTimeout(3_000);
        } catch {
          continue;
        }

        const aside = await parseFlippAside(page);

        const descParts = [
          aside.description || null,
          currentPrice ? `Price: $${currentPrice}` : null,
          savings      ? `Save: $${savings}`        : null,
        ].filter(Boolean);

        const tags = ['in-store only'];
        if (savings) tags.push('discount');
        if (aside.description.toLowerCase().includes('frozen')) tags.push('frozen');
        if (aside.endDate) tags.push('limited time');

        data.push({
          title:       productName.substring(0, 200),
          description: descParts.join(' | ').substring(0, 500),
          category:    inferCategory(productName + ' ' + aside.description),
          source:      'flipp',
          source_name: config.storeName,
          source_id:   `flipp_flyer_${config.storeName}_${dataProductId}`,
          source_url:  aside.seeMoreLink || config.url,
          deal_type:   'in-store',
          tags,
          status:      'available',
          photo_urls:  [],
          expires_at:  aside.endDate,
          lat:         null,
          lng:         null,
        });
      }
    }

    console.log(`[flyer] ${config.storeName}: ${data.length} items`);
    return data;
  } catch (err) {
    console.log(`[flyer] ${config.storeName} error:`, (err as Error).message);
    return [];
  }
}

// ── Public export ─────────────────────────────────────────────────────────

export async function scrapeAllFlyers(stores: StoreConfig[] = US_STORES): Promise<FlyerItem[]> {
  const browser = await chromium.launch({ headless: true });
  const allItems: FlyerItem[] = [];

  try {
    for (const store of stores) {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
      const items = await scrapeStoreFlyer(page, store);
      allItems.push(...items);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`[flyer] Total across all stores: ${allItems.length}`);
  return allItems;
}

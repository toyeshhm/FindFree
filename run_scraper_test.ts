import { scrapeMoreFinds } from './src/services/scraperClient';

async function run() {
  console.log('Running scraper...');
  try {
    const result = await scrapeMoreFinds('system_scraper', { lat: 40.7128, lng: -74.0060 });
    console.log('Scraper finished. Items loaded:', result);
  } catch (error) {
    console.error('Error running scraper:', error);
  }
}

run();

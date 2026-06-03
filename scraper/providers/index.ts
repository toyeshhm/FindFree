export interface LLMDeal {
  title: string;
  headline: string;
  description: string;
  merchantName: string;
  category:
    | 'food'
    | 'drinks'
    | 'grocery'
    | 'electronics'
    | 'clothing'
    | 'furniture'
    | 'kitchen'
    | 'books'
    | 'sports'
    | 'toys'
    | 'retail'
    | 'other';
  dealType: 'code' | 'in-store' | 'app-required' | 'no-action';
  tags: string[];
  sourceUrl: string;
  couponCode?: string;
  estimatedExpiry?: string | null;
  confidence: number;
  imageUrl?: string;
}

export interface LLMProvider {
  discoverDeals(query: string): Promise<LLMDeal[]>;
}

export type ProviderName = 'gemini' | 'groq';

export function createProvider(
  name: ProviderName,
  config: { apiKey: string },
): LLMProvider {
  if (name === 'gemini') {
    const { GeminiProvider } = require('./gemini');
    return new GeminiProvider(config.apiKey);
  }
  if (name === 'groq') {
    const { GroqProvider } = require('./groq');
    return new GroqProvider(config.apiKey);
  }
  throw new Error(`Unknown provider: ${name}`);
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMDeal } from './index';

const SCHEMA_HINT = `{
  title: string,
  headline: string,
  description: string,
  merchantName: string,
  category: "food"|"drinks"|"grocery"|"electronics"|"clothing"|"furniture"|"kitchen"|"books"|"sports"|"toys"|"retail"|"other",
  dealType: "code"|"in-store"|"app-required"|"no-action",
  tags: string[],
  sourceUrl: string,
  couponCode?: string,
  estimatedExpiry?: string | null,
  confidence: number,
  imageUrl?: string
}`;

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async discoverDeals(query: string): Promise<LLMDeal[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-lite',
        systemInstruction:
          'You are a deal discovery AI. Find real, currently active freebies, deals, discounts and promotional offers. Only return deals you can verify are currently active.',
        tools: [{ googleSearch: {} }] as any,
      });

      const userPrompt = `Search for deals matching: ${query}. Return 5-8 VERIFIED currently active deals as JSON array matching this schema: ${SCHEMA_HINT}. For description use this format: [2 engaging sentences about the deal]\n\n**How to claim:**\n1. [step]\n2. [step]\n\nValid [expiry] · [store] · [deal type]. Only include deals with confidence >= 0.7.`;

      const result = await model.generateContent(userPrompt);
      const text = result.response.text();

      return parseDeals(text);
    } catch (err) {
      console.error('[GeminiProvider] discoverDeals error:', err);
      return [];
    }
  }
}

function parseDeals(text: string): LLMDeal[] {
  try {
    // Strip markdown code fences if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\[[\s\S]*\])/);
    const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();
    const parsed: LLMDeal[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((d) => typeof d.confidence === 'number' && d.confidence >= 0.7);
  } catch {
    return [];
  }
}

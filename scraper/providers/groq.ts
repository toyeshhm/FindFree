import OpenAI from 'openai';
import { LLMProvider, LLMDeal } from './index';

export class GroqProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async discoverDeals(query: string): Promise<LLMDeal[]> {
    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a deal discovery AI with web search access. Find real, currently active promotional offers.',
        },
        {
          role: 'user',
          content: `Find 5-8 verified, currently active deals for: "${query}".

Return a JSON object with a "deals" array. Each deal must follow this exact shape:
{
  "title": string,
  "headline": string (one punchy line),
  "description": string (2 sentences about the deal, then "\\n\\n**How to claim:**\\n1. [step]\\n2. [step]\\n\\nValid [expiry] · [store] · [deal type]"),
  "merchantName": string,
  "category": "food"|"drinks"|"grocery"|"electronics"|"clothing"|"furniture"|"kitchen"|"books"|"sports"|"toys"|"retail"|"other",
  "dealType": "code"|"in-store"|"app-required"|"no-action",
  "tags": string[],
  "sourceUrl": string,
  "couponCode": string|undefined,
  "estimatedExpiry": string|null,
  "confidence": number (0-1, how certain you are this deal is real and active),
  "imageUrl": string|undefined
}

Only include deals with confidence >= 0.7. Verify each deal is currently active before including it.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    let parsed: { deals?: LLMDeal[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return [];
    }

    const deals: LLMDeal[] = Array.isArray(parsed.deals) ? parsed.deals : [];
    return deals.filter((d) => typeof d.confidence === 'number' && d.confidence >= 0.7);
  }
}

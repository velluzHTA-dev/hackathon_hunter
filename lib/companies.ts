import type { Hackathon } from "./types";

/**
 * Big tech companies and the names their hackathons go by. Product names count too:
 * a "Gemini" hackathon is Google's, a "Llama" one is Meta's, a "Claude" one is Anthropic's.
 */
export const COMPANIES: { name: string; pattern: RegExp }[] = [
  { name: "Google", pattern: /\b(google|gemini|deepmind|firebase|kaggle|tensorflow)\b/i },
  { name: "Meta", pattern: /\b(meta|llama|facebook|instagram|whatsapp|executorch)\b/i },
  { name: "Microsoft", pattern: /\b(microsoft|azure|github|xbox)\b/i },
  { name: "Amazon", pattern: /\b(amazon|aws|alexa)\b/i },
  { name: "Apple", pattern: /(?<!big )\b(apple|visionos)\b/i }, // not "Big Apple" (New York)
  { name: "NVIDIA", pattern: /\b(nvidia|cuda)\b/i },
  { name: "OpenAI", pattern: /\b(openai|chatgpt|gpt-?\d+(\.\d+)?)\b/i },
  { name: "Anthropic", pattern: /\b(anthropic|claude)\b/i },
  { name: "IBM", pattern: /\b(ibm|watsonx)\b/i },
  { name: "AMD", pattern: /\bamd\b/i },
  { name: "Intel", pattern: /\bintel\b/i },
  { name: "Tencent", pattern: /\btencent\b/i },
  { name: "ByteDance", pattern: /\b(bytedance|tiktok)\b/i },
  { name: "Samsung", pattern: /\bsamsung\b/i },
  { name: "Salesforce", pattern: /\bsalesforce\b/i },
];

// Local student and community chapters carry a company's name but aren't run by it.
const COMMUNITY_GROUP =
  /\b(google developer groups?|gdg)( on campus)?\b|\baws (student|community) builders?( group)?\b|\bmicrosoft (learn )?student ambassadors?\b/gi;

export function detectCompanies(h: Pick<Hackathon, "title" | "organizer">): string[] {
  const text = `${h.title} \n ${h.organizer ?? ""}`.replace(COMMUNITY_GROUP, " ");
  return COMPANIES.filter((c) => c.pattern.test(text)).map((c) => c.name);
}

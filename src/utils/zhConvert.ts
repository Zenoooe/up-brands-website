import { toSimplifiedChinese } from './opencc-simplified';
import { toTraditionalChinese } from './opencc-traditional';

export type ChineseScript = 'simplified' | 'traditional';

// Automatically renders stored Chinese text in the visitor's preferred script.
// Works regardless of whether the author wrote Simplified or Traditional:
//  - Simplified target: t2cn only rewrites Traditional chars, so Simplified
//    input passes through unchanged.
//  - Traditional target: if t2cn changes the text it was already Traditional,
//    so we keep the original; otherwise we convert Simplified -> Traditional.
export async function convertChinese(text: string, target: ChineseScript): Promise<string> {
  if (!text || !/[\u4e00-\u9fff]/.test(text)) {
    return text;
  }

  const simplified = await toSimplifiedChinese(text);

  if (target === 'simplified') {
    return simplified;
  }

  if (simplified !== text) {
    return text; // Already Traditional
  }

  return toTraditionalChinese(text);
}

import { toSimplifiedChinese } from './opencc-simplified';
import { toTraditionalChinese } from './opencc-traditional';

export type ChineseScript = 'simplified' | 'traditional';

// Automatically renders stored Chinese text in the visitor's preferred script.
//  - Simplified target: t2cn only rewrites Traditional chars, so Simplified
//    input passes through unchanged.
//  - Traditional target: we always run cn -> tw. For genuinely Traditional text
//    it is effectively a no-op, while Simplified text (even when it contains a
//    stray Traditional/Japanese character such as 甘い雲 kept for authenticity)
//    still gets its Simplified characters converted.
//    Previously we treated any text that t2cn touched as "already Traditional",
//    so a single Traditional/Japanese character vetoed conversion of the whole
//    passage.
export async function convertChinese(text: string, target: ChineseScript): Promise<string> {
  if (!text || !/[\u4e00-\u9fff]/.test(text)) {
    return text;
  }

  if (target === 'simplified') {
    return toSimplifiedChinese(text);
  }

  return toTraditionalChinese(text);
}

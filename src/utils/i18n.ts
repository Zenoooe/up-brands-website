import * as OpenCC from 'opencc-js';

// Shared OpenCC converters. Creating a converter is relatively expensive, so we
// instantiate each one once at module load and reuse it across the app.
export const toSimplified = OpenCC.Converter({ from: 'hk', to: 'cn' });
export const toTraditional = OpenCC.Converter({ from: 'cn', to: 'tw' });
export const simplifiedToTraditional = OpenCC.Converter({ from: 'tw', to: 'cn' });

/** Whether the given i18next language code is any Chinese variant. */
export function isZh(language: string): boolean {
  return language.startsWith('zh');
}

/** Whether the given i18next language code is Simplified Chinese. */
export function isSimplified(language: string): boolean {
  return language === 'zh-CN' || language === 'zh';
}

/** Whether the given i18next language code is Traditional Chinese. */
export function isTraditional(language: string): boolean {
  return (
    language.includes('TW') ||
    language.includes('Hant') ||
    language === 'zh-HK'
  );
}

import { useTranslation } from 'react-i18next';
import { isSimplified, isZh, toSimplified } from '../utils/i18n';

/**
 * Shared helper for rendering Chinese content that is authored in Traditional
 * Chinese. Returns the current language flags plus a `localize` function that
 * converts Traditional text to Simplified when the active language requires it,
 * and otherwise returns the text unchanged.
 */
export function useLocalizedText() {
  const { i18n } = useTranslation();
  const zh = isZh(i18n.language);
  const simplified = isSimplified(i18n.language);

  const localize = (text: string) => {
    if (!zh || !simplified) return text;
    return toSimplified(text);
  };

  return { isZh: zh, isSimplified: simplified, localize };
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { toTraditionalChinese } from '../utils/opencc-traditional';

type TagMap = Record<string, string>;

// Loads the canonical tag list (English key -> Chinese label) from Supabase
// settings, the same source used by the admin TagsManager and FilterBar.
async function fetchTagMap(): Promise<TagMap> {
  const [servicesRes, industriesRes] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'services_hierarchy').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'industries_list').maybeSingle(),
  ]);

  const map: TagMap = {};
  const collect = (items: any) => {
    if (!Array.isArray(items)) return;
    items.forEach((item: any) => {
      if (item?.en && item?.zh) map[item.en] = item.zh;
    });
  };

  if (servicesRes.data?.value) {
    servicesRes.data.value.forEach((cat: any) => collect(cat?.items));
  }
  if (industriesRes.data?.value) {
    collect(industriesRes.data.value);
  }

  return map;
}

export function useTagTranslations() {
  const { t, i18n } = useTranslation();
  const [map, setMap] = useState<TagMap>({});
  const [traditionalMap, setTraditionalMap] = useState<TagMap>({});

  const isChinese = i18n.language.startsWith('zh');
  const isTraditional = /^zh-(TW|HK|MO)/i.test(i18n.language);

  useEffect(() => {
    let active = true;
    fetchTagMap()
      .then((loaded) => {
        if (active) setMap(loaded);
      })
      .catch((e) => console.error('Failed to load tag translations', e));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isTraditional || Object.keys(map).length === 0) return;
    let active = true;
    (async () => {
      const entries = await Promise.all(
        Object.entries(map).map(
          async ([en, zh]) => [en, await toTraditionalChinese(zh)] as const,
        ),
      );
      if (active) setTraditionalMap(Object.fromEntries(entries));
    })();
    return () => {
      active = false;
    };
  }, [isTraditional, map]);

  // Resolve a stored English tag key to the label for the current language.
  const translateTag = (key: string): string => {
    if (!isChinese) return key;

    if (isTraditional && traditionalMap[key]) return traditionalMap[key];
    if (map[key]) return map[key];

    // Fall back to the (narrower) i18n dictionary, then the raw key.
    return t(`tags.industries.${key}`, {
      defaultValue: t(`tags.services.${key}`, { defaultValue: key }),
    });
  };

  return { translateTag };
}

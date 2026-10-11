import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseProjectTags } from '../utils/tags';
import type { Project } from '../types';

// Loads the tags offered by the "We design X for Y" filter: the admin-managed
// services/industries from the settings table (each tag can be hidden from the
// filter via its `showInFilter` flag), plus their Chinese translations.
//
// If the settings have no tags configured at all we fall back to the tags the
// projects actually use, so the filter is never empty on a fresh install.
export function useFilterTags(projects: Project[]) {
  const [dynamicServices, setDynamicServices] = useState<string[]>([]);
  const [dynamicIndustries, setDynamicIndustries] = useState<string[]>([]);
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadTagsFromSettings() {
      try {
        const [servicesRes, industriesRes] = await Promise.all([
          supabase.from('settings').select('value').eq('key', 'services_hierarchy').maybeSingle(),
          supabase.from('settings').select('value').eq('key', 'industries_list').maybeSingle(),
        ]);

        const sSet = new Set<string>();
        const iSet = new Set<string>();
        const tMap: Record<string, string> = {};

        if (servicesRes.data && servicesRes.data.value) {
          servicesRes.data.value.forEach((cat: any) => {
            if (cat.items && Array.isArray(cat.items)) {
              cat.items.forEach((item: any) => {
                if (item.en) {
                  if (item.showInFilter !== false) sSet.add(item.en);
                  if (item.zh) tMap[item.en] = item.zh;
                }
              });
            }
          });
        }

        if (industriesRes.data && industriesRes.data.value) {
          industriesRes.data.value.forEach((ind: any) => {
            if (ind.en) {
              if (ind.showInFilter !== false) iSet.add(ind.en);
              if (ind.zh) tMap[ind.en] = ind.zh;
            }
          });
        }

        setDynamicServices(Array.from(sSet).sort());
        setDynamicIndustries(Array.from(iSet).sort());
        setTranslationsMap(tMap);
      } catch (e) {
        console.error('Failed to load tags from settings for FilterBar', e);
      }
    }

    loadTagsFromSettings();
  }, []);

  const { availableServices, availableIndustries } = useMemo(() => {
    const services = new Set<string>(dynamicServices);
    const industries = new Set<string>(dynamicIndustries);

    if (dynamicServices.length === 0 || dynamicIndustries.length === 0) {
      projects.forEach((p) => {
        const tags = parseProjectTags(p.category);
        if (dynamicServices.length === 0) tags.services.forEach((s) => services.add(s));
        if (dynamicIndustries.length === 0) tags.industries.forEach((i) => industries.add(i));
      });
    }

    return {
      availableServices: Array.from(services).sort(),
      availableIndustries: Array.from(industries).sort(),
    };
  }, [projects, dynamicServices, dynamicIndustries]);

  return { availableServices, availableIndustries, translationsMap };
}

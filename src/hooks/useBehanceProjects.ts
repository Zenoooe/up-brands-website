import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project } from '../types';
import { fallbackProjects } from '../data/fallbackProjects';

// 5 seconds timeout for Supabase requests to prevent hanging
const FETCH_TIMEOUT = 5000;

// Mock tags for initial fallback data
const fallbackProjectsWithTags = fallbackProjects.map((p, i) => {
  const services = ['Business Design', 'Strategic Positioning', 'Branding', 'Digital Marketing', 'UI / UX', 'Packaging'];
  const industries = ['FMCG', 'Beauty', 'Tech', 'Lifestyle'];
  return {
    ...p,
    category: JSON.stringify({
      services: [services[i % services.length]],
      industries: [industries[i % industries.length]]
    })
  };
});

export function useBehanceProjects() {
  // We no longer initialize with fallbackProjectsWithTags to prevent the flash of old behance images.
  // Instead, we start with an empty array or loading state.
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      const now = Date.now();

      // 1. Check Cache

      // If no valid cache, try fetching fresh data in background
      
      try {
        // 2. Create Timeout Promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Supabase fetch timeout')), FETCH_TIMEOUT);
        });

        // 3. Supabase Query
        const fetchPromise = supabase
          .from('projects')
          .select('*')
          .or('is_visible.eq.true,is_visible.is.null') 
          .order('sort_order', { ascending: true });

        // 4. Race: Data Fetch vs Timeout
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (error) throw error;

        if (data && data.length > 0) {
          let projectsData = data as Project[];
          
          // MOCK: Auto-assign some tags for testing purposes to projects without tags
          projectsData = projectsData.map((p, i) => {
            let hasTags = false;
            try {
              const parsed = JSON.parse(p.category);
              if (parsed.services?.length || parsed.industries?.length) {
                hasTags = true;
              }
            } catch (e) {}

            if (!hasTags) {
              const services = ['Business Design', 'Strategic Positioning', 'Branding', 'Digital Marketing', 'UI / UX', 'Packaging'];
              const industries = ['FMCG', 'Beauty', 'Tech', 'Lifestyle'];
              
              // deterministically assign based on index
              const assignedService = services[i % services.length];
              const assignedIndustry = industries[i % industries.length];
              
              return {
                ...p,
                category: JSON.stringify({
                  services: [assignedService],
                  industries: [assignedIndustry]
                })
              };
            }
            return p;
          });

          setProjects(projectsData);
          // Update Cache
          sessionStorage.setItem('behance_projects_cache', JSON.stringify(projectsData));
          sessionStorage.setItem('behance_projects_timestamp', now.toString());
        }
      } catch (e) {
        // 5. Silent Failure / Fallback
        console.warn('Supabase connection issue:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return { projects, loading };
}

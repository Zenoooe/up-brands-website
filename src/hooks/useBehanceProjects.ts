import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project } from '../types';
import { fallbackProjects } from '../data/fallbackProjects';

// 5 seconds timeout for Supabase requests to prevent hanging
const FETCH_TIMEOUT = 5000;

export function useBehanceProjects() {
  // Initialize with fallback data for instant load (Optimistic UI)
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  // Loading is false initially because we have data to show immediately
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      const now = Date.now();

      // 1. Check Cache
      const cached = sessionStorage.getItem('behance_projects_cache');
      const cacheTime = sessionStorage.getItem('behance_projects_timestamp');
      
      if (cached && cacheTime && (now - parseInt(cacheTime) < 60000)) {
        try {
          const cachedProjects = JSON.parse(cached);
          if (cachedProjects.length > 0) {
            setProjects(cachedProjects);
            return;
          }
        } catch (e) {
          console.warn('Cache parse error, fetching fresh data...');
        }
      }

      // If no valid cache, try fetching fresh data in background
      // We set loading to true only if you want a spinner, but for "instant feel" we keep it false
      // or manage a separate 'isRefetching' state if needed.
      // Here we keep loading false to avoid UI flickering since we have fallback data.

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
          const projectsData = data as Project[];
          setProjects(projectsData);
          // Update Cache
          sessionStorage.setItem('behance_projects_cache', JSON.stringify(projectsData));
          sessionStorage.setItem('behance_projects_timestamp', now.toString());
        }
      } catch (e) {
        // 5. Silent Failure / Fallback
        // If timeout or error occurs, we just log it.
        // The UI stays intact because 'projects' was initialized with fallbackProjects.
        console.warn('Supabase connection issue, using fallback data:', e);
      }
    }

    fetchProjects();
  }, []);

  return { projects, loading };
}

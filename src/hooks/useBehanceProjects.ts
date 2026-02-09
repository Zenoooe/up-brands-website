import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

export function useBehanceProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      // Check cache first
      const cached = sessionStorage.getItem('behance_projects_cache');
      const cacheTime = sessionStorage.getItem('behance_projects_timestamp');
      const now = Date.now();
      
      // Use cache if less than 1 hour old
      // REDUCED CACHE TIME TO 1 MINUTE TO FIX SYNC ISSUES
      if (cached && cacheTime && (now - parseInt(cacheTime) < 60000)) {
        setProjects(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          // Removed strict .eq('is_visible', true) to handle NULL values (defaults)
          .or('is_visible.eq.true,is_visible.is.null') 
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Error fetching projects:', error);
        } else if (data) {
          const projectsData = data as Project[];
          setProjects(projectsData);
          // Update cache
          sessionStorage.setItem('behance_projects_cache', JSON.stringify(projectsData));
          sessionStorage.setItem('behance_projects_timestamp', now.toString());
        }
      } catch (e) {
        console.error('Exception fetching projects:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return { projects, loading };
}

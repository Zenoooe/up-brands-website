import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

export function useBehanceProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('is_visible', true) // Filter out hidden projects
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Error fetching projects:', error);
        } else if (data) {
          setProjects(data as Project[]);
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

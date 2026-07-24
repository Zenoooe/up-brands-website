import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';

export function usePosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('is_visible', true) // Filter out hidden posts
          .order('sort_order', { ascending: true })
          .order('date', { ascending: false });

        if (error) throw error;

        setPosts((data ?? []) as BlogPost[]);
        setError(null);
      } catch (e) {
        console.error('Error fetching posts:', e);
        setError(e instanceof Error ? e : new Error('Failed to load posts'));
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return { posts, loading, error };
}

export function usePost(slug: string | undefined) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function fetchPost() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;

        setPost((data ?? null) as BlogPost | null);
        setError(null);
      } catch (e) {
        console.error('Error fetching post:', e);
        setError(e instanceof Error ? e : new Error('Failed to load post'));
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  return { post, loading, error };
}

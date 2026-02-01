import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';

export function usePosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('is_visible', true) // Filter out hidden posts
          .order('sort_order', { ascending: true })
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
        } else if (data) {
          setPosts(data as BlogPost[]);
        }
      } catch (e) {
        console.error('Exception fetching posts:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return { posts, loading };
}

export function usePost(slug: string | undefined) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

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
          .single();

        if (error) {
          console.error('Error fetching post:', error);
        } else if (data) {
          setPost(data as BlogPost);
        }
      } catch (e) {
        console.error('Exception fetching post:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  return { post, loading };
}

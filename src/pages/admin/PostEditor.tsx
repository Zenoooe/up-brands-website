import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BlogPost } from '../../types';
import { Helmet } from 'react-helmet-async';

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    slug: '',
    title_en: '',
    title_zh: '',
    excerpt_en: '',
    excerpt_zh: '',
    content_en: '',
    content_zh: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: '',
    author: 'Up-Brands Team',
    tags: []
  });

  const [tagsString, setTagsString] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadPost(id);
    }
  }, [id]);

  const loadPost = async (postId: string) => {
    const { data } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (data) {
      setFormData(data);
      setTagsString(data.tags?.join(', ') || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        tags: tagsString.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (isNew) {
        await supabase.from('posts').insert(payload);
      } else {
        await supabase.from('posts').update(payload).eq('id', id);
      }
      navigate('/admin');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
      <Helmet>
        <title>{isNew ? 'New Post' : 'Edit Post'} | Admin</title>
      </Helmet>

      <h1 className="text-2xl font-bold mb-8 uppercase tracking-tight">
        {isNew ? 'Create New Post' : 'Edit Post'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={e => setFormData({...formData, slug: e.target.value})}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none font-mono text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              required
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              type="text"
              value={formData.author}
              onChange={e => setFormData({...formData, author: e.target.value})}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsString}
              onChange={e => setTagsString(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              placeholder="Design, Branding, News"
            />
          </div>
        </div>

        {/* English Content */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-bold text-lg mb-4">English Content</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN)</label>
              <input
                type="text"
                value={formData.title_en}
                onChange={e => setFormData({...formData, title_en: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (EN)</label>
              <textarea
                value={formData.excerpt_en}
                onChange={e => setFormData({...formData, excerpt_en: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none h-24"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown EN)</label>
              <textarea
                value={formData.content_en}
                onChange={e => setFormData({...formData, content_en: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none h-64 font-mono text-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Chinese Content */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-bold text-lg mb-4">Chinese Content</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (ZH)</label>
              <input
                type="text"
                value={formData.title_zh}
                onChange={e => setFormData({...formData, title_zh: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (ZH)</label>
              <textarea
                value={formData.excerpt_zh}
                onChange={e => setFormData({...formData, excerpt_zh: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none h-24"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown ZH)</label>
              <textarea
                value={formData.content_zh}
                onChange={e => setFormData({...formData, content_zh: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none h-64 font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Enter Traditional or Simplified Chinese. The frontend will automatically convert it based on user region.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-6 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded font-bold uppercase hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import { Helmet } from 'react-helmet-async';
import { Upload, RefreshCw } from 'lucide-react';
import { backupImageToSupabase } from '../../utils/imageBackup';
import toast from 'react-hot-toast';

export default function ProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({
    id: '',
    title: '',
    category: '',
    imageUrl: '',
    backup_image_url: '',
    link: '',
    wechatLink: '',
    redNoteLink: '',
    sort_order: 0
  });

  useEffect(() => {
    if (!isNew && id) {
      loadProject(id);
    }
  }, [id]);

  const loadProject = async (projectId: string) => {
    // Explicitly select all columns including backup_image_url
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (data) {
      // Ensure backup_image_url is loaded even if it's null in DB (set to empty string for controlled input)
      setFormData({
        ...data,
        backup_image_url: data.backup_image_url || ''
      });
    }
  };

  const handleBackupImage = async () => {
    if (!formData.imageUrl) {
      toast.error('Please enter an Image URL first');
      return;
    }

    // Ensure we have an ID for the filename
    const projectId = formData.id || crypto.randomUUID();
    
    setBackingUp(true);
    const toastId = toast.loading('Backing up image...');

    try {
      const newUrl = await backupImageToSupabase(formData.imageUrl, projectId);
      
      // Update backup URL specifically
      setFormData(prev => ({ ...prev, backup_image_url: newUrl }));
      
      // Auto-save the backup URL immediately to DB so it persists even without clicking Save Project
      if (!isNew && id) {
        await supabase.from('projects').update({ backup_image_url: newUrl }).eq('id', id);
      }
      
      toast.success('Image backed up successfully! Backup URL saved.', { id: toastId });
    } catch (error) {
      toast.error('Failed to backup image', { id: toastId });
    } finally {
      setBackingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isNew) {
        // If creating new, let user specify ID or generate one?
        // Schema has ID as text (Behance ID). If user doesn't provide, we might need a strategy.
        // For simplicity, let's require ID (Behance ID) or auto-gen uuid if blank.
        // Actually our schema uses TEXT for ID.
        const payload = { ...formData };
        if (!payload.id) {
           payload.id = crypto.randomUUID(); // Fallback if not Behance ID
        }
        await supabase.from('projects').insert(payload);
      } else {
        await supabase.from('projects').update(formData).eq('id', id);
      }
      navigate('/admin');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
      <Helmet>
        <title>{isNew ? 'New Project' : 'Edit Project'} | Admin</title>
      </Helmet>

      <h1 className="text-2xl font-bold mb-8 uppercase tracking-tight">
        {isNew ? 'Create New Project' : 'Edit Project'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">ID (Behance ID or UUID)</label>
            <input
              type="text"
              value={formData.id}
              onChange={e => setFormData({...formData, id: e.target.value})}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              required
              disabled={!isNew}
            />
          </div>
          <div className="col-span-2 md:col-span-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
             <input
              type="number"
              value={formData.sort_order}
              onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Original)</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              className="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              required
            />
            <button
              type="button"
              onClick={handleBackupImage}
              disabled={backingUp || !formData.imageUrl}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
              title="Backup image to Supabase for reliable access in China"
            >
              <Upload size={16} />
              {backingUp ? 'Backing up...' : 'Backup'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Original URL from Behance (kept for sync). Click "Backup" to generate a stable Supabase link below.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Backup Image URL (Supabase)</label>
          <input
            type="url"
            value={formData.backup_image_url || ''}
            onChange={e => setFormData({...formData, backup_image_url: e.target.value})}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none bg-gray-50"
            placeholder="Generated automatically when you click Backup"
          />
           <p className="text-xs text-gray-500 mt-1">
            This URL will be prioritized on the website if present.
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-900">Links</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Behance Link</label>
            <input
              type="url"
              value={formData.link}
              onChange={e => setFormData({...formData, link: e.target.value})}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WeChat Link (Optional)</label>
            <input
              type="url"
              value={formData.wechatLink || ''}
              onChange={e => setFormData({...formData, wechatLink: e.target.value})}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RedNote Link (Optional)</label>
            <input
              type="url"
              value={formData.redNoteLink || ''}
              onChange={e => setFormData({...formData, redNoteLink: e.target.value})}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6">
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
            {loading ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
}

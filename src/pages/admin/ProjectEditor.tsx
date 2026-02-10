import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import { Helmet } from 'react-helmet-async';
import { Upload, X } from 'lucide-react';
import { backupImageToSupabase } from '../../utils/imageBackup';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { GalleryEditor, GalleryEditorHandle } from './components/GalleryEditor';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'clean']
  ],
};

export default function ProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const galleryEditorRef = useRef<GalleryEditorHandle>(null);
  
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({
    id: '',
    slug: '',
    title: '',
    category: '',
    imageUrl: '',
    backup_image_url: '',
    link: '',
    wechatLink: '',
    redNoteLink: '',
    images: [],
    description: '',
    description_en: '',
    credits: {},
    gallery_layout: 'full',
    image_gap: 0,
    sort_order: 0,
    is_visible: true
  });

  const [newCreditRole, setNewCreditRole] = useState('');
  const [newCreditName, setNewCreditName] = useState('');

  // 1. Load data ONLY ONCE
  useEffect(() => {
    if (!isNew && id) {
      loadProject(id);
    }
  }, []); // Remove [id] dependency to prevent reload loop


  const loadProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (error) throw error;
      if (data) {
        setFormData({
          ...data,
          slug: data.slug || '',
          backup_image_url: data.backup_image_url || '',
          images: data.images || [],
          description: data.description || '',
          description_en: data.description_en || '',
          credits: data.credits || {},
          gallery_layout: data.gallery_layout || 'full',
          image_gap: data.image_gap || 0,
          is_visible: data.is_visible !== false
        });
      }
    } catch (e) {
      console.error("Failed to load project", e);
      toast.error("Failed to load project data");
    }
  };

  const handleAddCredit = () => {
    if (!newCreditRole || !newCreditName) return;
    setFormData(prev => ({
      ...prev,
      credits: { ...prev.credits, [newCreditRole]: newCreditName }
    }));
    setNewCreditRole('');
    setNewCreditName('');
  };

  const handleRemoveCredit = (role: string) => {
    setFormData(prev => {
      const newCredits = { ...prev.credits };
      delete newCredits[role];
      return { ...prev, credits: newCredits };
    });
  };

  const handleBackupImage = async () => {
    if (!formData.imageUrl) {
      toast.error('Please enter an Image URL first');
      return;
    }

    const projectId = formData.id || crypto.randomUUID();
    setBackingUp(true);
    const toastId = toast.loading('Backing up cover image...');

    try {
      const newUrl = await backupImageToSupabase(formData.imageUrl, projectId);
      setFormData(prev => ({ ...prev, backup_image_url: newUrl }));
      
      if (!isNew && id) {
        await supabase.from('projects').update({ backup_image_url: newUrl }).eq('id', id);
      }
      
      toast.success('Cover image backed up!', { id: toastId });
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
      // Get latest images from GalleryEditor
      const currentImages = galleryEditorRef.current?.getImages() || formData.images || [];
      const payload = { ...formData, images: currentImages };

      if (isNew) {
        if (!payload.id) {
           payload.id = crypto.randomUUID();
        }
        await supabase.from('projects').insert(payload);
      } else {
        await supabase.from('projects').update(payload).eq('id', id);
      }
      
      sessionStorage.removeItem('behance_projects_cache');
      sessionStorage.removeItem('behance_projects_timestamp');
      
      // Ping search engines
      try {
        const projectSlug = payload.slug || payload.id;
        const projectUrl = `https://www.up-brands.com/project/${projectSlug}`;
        
        // Bing
        await fetch(`/api/bing-push?url=${encodeURIComponent(projectUrl)}`, { method: 'GET' }).catch(() => {});
        
        // Baidu
        await fetch(`/api/baidu-push?url=${encodeURIComponent(projectUrl)}&site=https://www.up-brands.com&token=YOUR_BAIDU_TOKEN`, { method: 'POST' }).catch(() => {});
      } catch (e) {
        console.warn('Failed to ping search engines', e);
      }
      
      toast.success('Project saved successfully');
      navigate('/admin');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <Helmet>
        <title>{isNew ? 'New Project' : 'Edit Project'} | Admin</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isNew ? 'New Project' : 'Edit Project'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="text-gray-500 hover:text-black"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">ID (Behance ID or UUID)</label>
            <input
              type="text"
              value={formData.id}
              onChange={e => {
                const val = e.target.value;
                setFormData(prev => ({...prev, id: val}));
              }}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none bg-gray-50"
              required
              disabled={!isNew}
            />
          </div>
          <div className="col-span-2 md:col-span-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug (e.g. mysterium-wine)</label>
             <input
              type="text"
              value={formData.slug}
              onChange={e => {
                const val = e.target.value.toLowerCase().replace(/\s+/g, '-');
                setFormData(prev => ({...prev, slug: val}));
              }}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              placeholder="custom-project-name"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to use ID. Format: lowercase, dashes only.</p>
          </div>
          <div className="col-span-2 md:col-span-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
             <input
              type="number"
              value={formData.sort_order}
              onChange={e => {
                const val = parseInt(e.target.value) || 0;
                setFormData(prev => ({...prev, sort_order: val}));
              }}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_visible"
                checked={formData.is_visible !== false} // Default to true if undefined
                onChange={e => setFormData(prev => ({...prev, is_visible: e.target.checked}))}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <label htmlFor="is_visible" className="text-sm text-gray-700">Visible on Site</label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Chinese / Default)</label>
          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={(content) => setFormData(prev => ({...prev, description: content}))}
            modules={modules}
            className="bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (English - Optional)</label>
          <ReactQuill
            theme="snow"
            value={formData.description_en}
            onChange={(content) => setFormData(prev => ({...prev, description_en: content}))}
            modules={modules}
            className="bg-white"
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
           <h3 className="font-bold text-gray-900 mb-4">Project Credits</h3>
           <div className="flex gap-2 mb-4">
             <input
               type="text"
               placeholder="Role (e.g. Production)"
               value={newCreditRole}
               onChange={e => setNewCreditRole(e.target.value)}
               className="flex-1 px-3 py-2 border rounded text-sm outline-none"
             />
             <input
               type="text"
               placeholder="Name (e.g. Calitho)"
               value={newCreditName}
               onChange={e => setNewCreditName(e.target.value)}
               className="flex-1 px-3 py-2 border rounded text-sm outline-none"
             />
             <button
               type="button"
               onClick={handleAddCredit}
               className="bg-black text-white px-4 py-2 rounded text-sm font-bold"
             >
               Add
             </button>
           </div>
           <div className="space-y-2">
             {Object.entries(formData.credits || {}).map(([role, name]) => (
               <div key={role} className="flex justify-between items-center bg-white p-2 rounded border">
                 <div className="text-sm">
                   <span className="font-bold text-gray-900">{role}:</span> <span className="text-gray-600">{name}</span>
                 </div>
                 <button
                   type="button"
                   onClick={() => handleRemoveCredit(role)}
                   className="text-gray-400 hover:text-red-500"
                 >
                   <X size={14} />
                 </button>
               </div>
             ))}
           </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
           <h3 className="font-bold text-gray-900 mb-4">Gallery Settings</h3>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Layout Style</label>
                <select
                  value={formData.gallery_layout}
                  onChange={e => {
                    const val = e.target.value as any;
                    setFormData(prev => ({...prev, gallery_layout: val}));
                  }}
                  className="w-full px-3 py-2 border rounded outline-none bg-white"
                >
                  <option value="full">Full Screen (Zero Gap)</option>
                  <option value="grid">Grid (Columns)</option>
                  <option value="centered">Centered (White Borders)</option>
                  <option value="stack">Stack (All Full Width)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Gap (px)</label>
                <input
                  type="number"
                  value={formData.image_gap}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 0;
                    setFormData(prev => ({...prev, image_gap: val}));
                  }}
                  className="w-full px-3 py-2 border rounded outline-none"
                />
              </div>
           </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => {
              const val = e.target.value;
              setFormData(prev => ({...prev, title: val}));
            }}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={e => {
              const val = e.target.value;
              setFormData(prev => ({...prev, category: val}));
            }}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
            required
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <label className="block text-sm font-bold text-gray-900 mb-4">Cover Image</label>
          <div className="flex gap-4 items-start">
             <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Original URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({...prev, imageUrl: val}));
                      }}
                      className="flex-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleBackupImage}
                      disabled={backingUp || !formData.imageUrl}
                      className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
                    >
                      <Upload size={14} />
                      Backup
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Supabase URL (Auto-filled)</label>
                  <input
                    type="url"
                    value={formData.backup_image_url || ''}
                    readOnly
                    className="w-full px-3 py-2 border rounded text-sm bg-gray-100 text-gray-500"
                  />
                </div>
             </div>
             <div className="w-32 h-32 bg-white border rounded overflow-hidden flex-shrink-0">
               {formData.imageUrl ? (
                 <img src={formData.imageUrl} alt="Cover" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
               )}
             </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-900">Project Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Behance Link</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({...prev, link: val}));
                  }}
                  className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none"
                  required
                />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">WeChat Link</label>
                <input
                  type="url"
                  value={formData.wechatLink || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({...prev, wechatLink: val}));
                  }}
                  className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none"
                />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">RedNote Link</label>
                <input
                  type="url"
                  value={formData.redNoteLink || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({...prev, redNoteLink: val}));
                  }}
                  className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none"
                />
             </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <GalleryEditor
             ref={galleryEditorRef}
             initialImages={formData.images || []}
             projectId={formData.id}
          />
        </div>

        <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white/80 backdrop-blur p-4 border-t border-gray-100 -mx-8 -mb-8 mt-8 z-50">
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
            className="px-6 py-2 bg-black text-white rounded font-bold uppercase hover:bg-gray-800 disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
}

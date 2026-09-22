import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import { Helmet } from 'react-helmet-async';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { GalleryEditor, GalleryEditorHandle } from './components/GalleryEditor';
import { toTraditionalChinese } from '../../utils/opencc-traditional';
import { splitProjectTitle } from '../../../shared/project-metadata';
import { parseProjectTags, stringifyProjectTags } from '../../utils/tags';

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
  const [formData, setFormData] = useState<Partial<Project>>({
    id: '',
    slug: '',
    title: '',
    subtitle: '',
    category: '',
    imageUrl: '',
    backup_image_url: '',
    link: '',
    wechatLink: '',
    redNoteLink: '',
    dribbbleLink: '',
    zcoolLink: '',
    gutianluLink: '',
    instagramLink: '',
    worldBrandSocietyLink: '',
    packagingOfTheWorldLink: '',
    images: [],
    description: '',
    description_tw: '',
    description_en: '',
    credits: {},
    gallery_layout: 'full',
    image_gap: 0,
    sort_order: 0,
    is_visible: true
  });

  const [newCreditRole, setNewCreditRole] = useState('');
  const [newCreditName, setNewCreditName] = useState('');

  const [services, setServices] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [newIndustry, setNewIndustry] = useState('');

  const [availableServices, setAvailableServices] = useState<string[]>([
    "Business Design", "Strategic Positioning", "Branding", 
    "Digital Marketing", "UI / UX", "Packaging", "Research & Insights"
  ]);
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([
    "FMCG", "Beauty", "Tech", "Lifestyle"
  ]);

  // 1. Load data ONLY ONCE
  useEffect(() => {
    if (!isNew && id) {
      loadProject(id);
    }
    fetchAllTags();
  }, []); // Remove [id] dependency to prevent reload loop

  const fetchAllTags = async () => {
    try {
      const sSet = new Set(availableServices);
      const iSet = new Set(availableIndustries);

      // 1. Fetch predefined tags from settings
      const [settingsServices, settingsIndustries] = await Promise.all([
        supabase.from('settings').select('value').eq('key', 'services_hierarchy').maybeSingle(),
        supabase.from('settings').select('value').eq('key', 'industries_list').maybeSingle()
      ]);

      if (settingsServices.data && settingsServices.data.value) {
        settingsServices.data.value.forEach((cat: any) => {
          if (cat.items && Array.isArray(cat.items)) {
            cat.items.forEach((item: any) => {
              if (item.en) sSet.add(item.en);
            });
          }
        });
      }

      if (settingsIndustries.data && settingsIndustries.data.value) {
        settingsIndustries.data.value.forEach((ind: any) => {
          if (ind.en) iSet.add(ind.en);
        });
      }

      // 2. Fetch existing tags from projects as a fallback/supplement
      const { data, error } = await supabase.from('projects').select('category');
      if (error) throw error;
      if (data) {
        data.forEach(p => {
          try {
            const parsed = parseProjectTags(p.category);
            parsed.services.forEach(s => sSet.add(s));
            parsed.industries.forEach(i => iSet.add(i));
          } catch (err) {
            // Ignore parse errors for individual projects
          }
        });
      }
      
      setAvailableServices(Array.from(sSet).sort());
      setAvailableIndustries(Array.from(iSet).sort());
    } catch (e) {
      console.error("Failed to fetch all tags", e);
    }
  };


  const loadProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (error) throw error;
      if (data) {
        const parsedTags = parseProjectTags(data.category);
        setServices(parsedTags.services);
        setIndustries(parsedTags.industries);

        setFormData({
          ...data,
          slug: data.slug || '',
          subtitle: data.subtitle || '',
          backup_image_url: data.backup_image_url || '',
          images: data.images || [],
          description: data.description || '',
          description_tw: data.description_tw || '',
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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prefer the editor's live state if it is mounted.
      const isEditorMounted = galleryEditorRef.current !== null;
      const currentImages = isEditorMounted
        ? galleryEditorRef.current!.getImages()
        : (Array.isArray(formData.images) ? formData.images : []);

      const descriptionTw = formData.description
        ? await toTraditionalChinese(formData.description)
        : '';
      const splitTitle = splitProjectTitle(formData.title || '');
      const payload = {
        ...formData,
        title: splitTitle.title || formData.title,
        subtitle: formData.subtitle || splitTitle.subtitle || '',
        category: stringifyProjectTags({ services, industries }),
        images: currentImages,
        description_tw: descriptionTw,
      };

      if (!payload.title?.trim()) {
        throw new Error('Title is required');
      }

      if (!payload.imageUrl?.trim()) {
        throw new Error('Cover image URL is required');
      }

      if (!payload.link?.trim()) {
        throw new Error('Behance link is required');
      }

      if (isNew) {
        if (!payload.id) {
           payload.id = crypto.randomUUID();
        }
        const { error } = await supabase.from('projects').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('projects').update(payload).eq('id', id);
        if (error) throw error;
      }
      
      sessionStorage.removeItem('behance_projects_cache');
      sessionStorage.removeItem('behance_projects_timestamp');
      
      // Ping search engines & Trigger Automation
      try {
        const projectSlug = payload.slug || payload.id;
        const projectUrl = `https://www.up-brands.com/project/${projectSlug}`;
        
        // 1. Existing IndexNow (Keep if you want immediate ping)
        fetch(`/api/indexnow?url=${encodeURIComponent(projectUrl)}`, { method: 'GET' }).catch(() => {});
        
        // 2. Trigger GitHub Action (Sitemap Generation & Submission & Fallback Sync)
        fetch('/api/trigger-workflow', { method: 'POST' })
          .then(res => res.ok ? console.log('Workflow triggered') : console.error('Workflow trigger failed'))
          .catch(err => console.error('Workflow trigger error', err));

        // Baidu
        await fetch(`/api/baidu-push?url=${encodeURIComponent(projectUrl)}&site=https://www.up-brands.com&token=YOUR_BAIDU_TOKEN`, { method: 'POST' }).catch(() => {});
      } catch (e) {
        console.warn('Failed to ping search engines', e);
      }
      
      toast.success('Project saved successfully');
      navigate('/admin');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save project');
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

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900">Traditional Chinese Description</p>
          <p className="mt-1 text-xs text-gray-600">
            Auto-generated from the default Chinese description when you save this project.
          </p>
          <div className="mt-3 rounded border bg-white p-3 text-sm text-gray-700">
            {formData.description_tw ? 'Saved and available for zh-TW visitors.' : 'Will be generated on save.'}
          </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle / Small Label</label>
          <input
            type="text"
            value={formData.subtitle || ''}
            onChange={e => {
              const val = e.target.value;
              setFormData(prev => ({...prev, subtitle: val}));
            }}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
            placeholder="Luxury Organic Jam & Dopamine Botanical VI"
          />
          <p className="text-xs text-gray-500 mt-1">
            Behance sync will auto-fill this from title formatting like `Main Title | Subtitle`.
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Project Tags (Filters)</h3>
          
          {/* Services */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Services (e.g., Brand Strategy, Brand Identity)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {services.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {tag}
                  <button type="button" onClick={() => setServices(services.filter(t => t !== tag))} className="hover:text-gray-300">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {services.length === 0 && <span className="text-sm text-gray-400 italic">No services added</span>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select 
                value=""
                onChange={e => {
                  const val = e.target.value;
                  if (val && !services.includes(val)) {
                    setServices([...services, val]);
                  }
                }}
                className="sm:w-1/3 px-3 py-2 border rounded text-sm outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="">-- Select existing --</option>
                {availableServices.filter(s => !services.includes(s)).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="flex flex-1 gap-2">
                <input
                  type="text"
                  value={newService}
                  onChange={e => setNewService(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newService.trim() && !services.includes(newService.trim())) {
                        setServices([...services, newService.trim()]);
                        setNewService('');
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 border rounded text-sm outline-none focus:ring-2 focus:ring-black"
                  placeholder="Or type a new service and press Enter..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newService.trim() && !services.includes(newService.trim())) {
                      setServices([...services, newService.trim()]);
                      setNewService('');
                    }
                  }}
                  className="bg-gray-200 text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-300 whitespace-nowrap"
                >
                  Add New
                </button>
              </div>
            </div>
          </div>

          {/* Industries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industries (e.g., Arts & Culture, Tech)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {industries.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-white border border-black text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {tag}
                  <button type="button" onClick={() => setIndustries(industries.filter(t => t !== tag))} className="hover:text-gray-500">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {industries.length === 0 && <span className="text-sm text-gray-400 italic">No industries added</span>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select 
                value=""
                onChange={e => {
                  const val = e.target.value;
                  if (val && !industries.includes(val)) {
                    setIndustries([...industries, val]);
                  }
                }}
                className="sm:w-1/3 px-3 py-2 border rounded text-sm outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="">-- Select existing --</option>
                {availableIndustries.filter(i => !industries.includes(i)).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="flex flex-1 gap-2">
                <input
                  type="text"
                  value={newIndustry}
                  onChange={e => setNewIndustry(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
                        setIndustries([...industries, newIndustry.trim()]);
                        setNewIndustry('');
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 border rounded text-sm outline-none focus:ring-2 focus:ring-black"
                  placeholder="Or type a new industry and press Enter..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
                      setIndustries([...industries, newIndustry.trim()]);
                      setNewIndustry('');
                    }
                  }}
                  className="bg-gray-200 text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-300 whitespace-nowrap"
                >
                  Add New
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <label className="block text-sm font-bold text-gray-900 mb-4">Cover Image</label>
          <div className="flex gap-4 items-start">
             <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Image URL (Behance / External)</label>
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
                      placeholder="https://mir-s3-cdn-cf.behance.net/..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                          if (!formData.imageUrl) return;
                          // Just trigger a re-render or toast, no backup logic needed
                          toast.success('Image URL set');
                      }}
                      className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded text-sm hover:bg-gray-800"
                    >
                      <Plus size={14} />
                      Set
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Use a high-res Behance URL (e.g. 2800_webp). It will be automatically CDN-optimized.
                  </p>
                </div>
                
                {/* Supabase URL field removed/hidden since we are deprecating it */}
                {formData.backup_image_url && (
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-100">
                      <label className="block text-xs font-medium text-yellow-800 mb-1">Legacy Supabase Backup (Deprecated)</label>
                      <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.backup_image_url}
                            readOnly
                            className="flex-1 px-2 py-1 text-xs bg-white border rounded text-gray-500"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({...prev, backup_image_url: null}))}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                      </div>
                      <p className="text-xs text-yellow-600 mt-1">
                        Click remove to stop using Supabase storage for this cover.
                      </p>
                    </div>
                )}
             </div>
             <div className="w-32 h-32 bg-white border rounded overflow-hidden flex-shrink-0 relative group">
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
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Dribbble Link</label>
                <input type="url" value={formData.dribbbleLink || ''} onChange={e => setFormData(prev => ({...prev, dribbbleLink: e.target.value}))} className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none" />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Zcool (站酷) Link</label>
                <input type="url" value={formData.zcoolLink || ''} onChange={e => setFormData(prev => ({...prev, zcoolLink: e.target.value}))} className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none" />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Gutianlu 9 (古田路9号) Link</label>
                <input type="url" value={formData.gutianluLink || ''} onChange={e => setFormData(prev => ({...prev, gutianluLink: e.target.value}))} className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none" />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Instagram Link</label>
                <input type="url" value={formData.instagramLink || ''} onChange={e => setFormData(prev => ({...prev, instagramLink: e.target.value}))} className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none" />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">World Brand Design Society Link</label>
                <input type="url" value={formData.worldBrandSocietyLink || ''} onChange={e => setFormData(prev => ({...prev, worldBrandSocietyLink: e.target.value}))} className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none" />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Packaging of the World Link</label>
                <input type="url" value={formData.packagingOfTheWorldLink || ''} onChange={e => setFormData(prev => ({...prev, packagingOfTheWorldLink: e.target.value}))} className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none" />
             </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <GalleryEditor
             ref={galleryEditorRef}
             initialImages={formData.images || []}
             projectId={formData.id}
             projectLink={formData.link}
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

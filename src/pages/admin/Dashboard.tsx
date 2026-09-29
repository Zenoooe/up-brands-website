import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Project, BlogPost, Subscriber, Lead } from '../../types';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, GripVertical, RefreshCw, Download, Eye, EyeOff, CheckCircle2, ShieldCheck, ExternalLink, Settings as SettingsIcon } from 'lucide-react';
import { backupImageToSupabase } from '../../utils/imageBackup';
import { getSupabaseUrl, getValidImageUrl } from '../../utils/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { TagsManager } from '../../components/admin/TagsManager';
import type { BehanceProjectItem } from '../../../shared/behance';
import {
  getProjectDisplayCategory,
  getProjectDisplaySubtitle,
  isLegacySubtitleText,
} from '../../../shared/project-metadata';

type BehanceSyncResponse = {
  projects: BehanceProjectItem[];
  total: number;
  pageCount: number;
  source?: 'api' | 'graphql' | 'rss';
  warning?: string;
};

function SortableProjectRow({ 
  project, 
  onDelete, 
  onToggleVisibility 
}: { 
  project: Project; 
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, current: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isHidden = project.is_visible === false;

  return (
    <tr ref={setNodeRef} style={style} className={`bg-white hover:bg-gray-50 ${isHidden ? 'opacity-60 bg-gray-50/50' : ''}`}>
      <td className="px-6 py-4 w-12 cursor-grab" {...attributes} {...listeners}>
        <GripVertical size={20} className="text-gray-400" />
      </td>
      <td className="px-6 py-4 w-24">
        <div className="relative">
          <img src={getValidImageUrl(project.backup_image_url, project.imageUrl)} alt="" className={`w-12 h-12 object-cover rounded ${isHidden ? 'grayscale' : ''}`} />
          {isHidden && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded">
              <EyeOff size={16} className="text-white drop-shadow-md" />
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 font-medium">
        <span className={isHidden ? 'line-through text-gray-400' : ''}>
          {project.title}
        </span>
        {isHidden && <span className="ml-2 text-xs text-gray-400 italic">(Hidden)</span>}
      </td>
      <td className="px-6 py-4 text-gray-500">
        {getProjectDisplaySubtitle(project) || getProjectDisplayCategory(project) || '—'}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {project.backup_image_url && !project.backup_image_url.includes('supabase.co') ? (
            <div title="Image backed up (China accessible)" className="p-2 text-green-600">
              <ShieldCheck size={18} />
            </div>
          ) : (
            <div title="Using original Behance URL" className="p-2 text-gray-300">
               <ShieldCheck size={18} />
            </div>
          )}
          <a 
            href={`/project/${project.slug || project.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-black transition-colors"
            title="View Live Page"
          >
            <ExternalLink size={18} />
          </a>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleVisibility(project.id, project.is_visible !== false);
            }}
            type="button"
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isHidden ? 'text-gray-400' : 'text-gray-600'}`}
            title={isHidden ? "Show Project" : "Hide Project"}
          >
            {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <Link 
            to={`/admin/projects/${project.id}`} 
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit Project"
          >
            <Edit2 size={18} />
          </Link>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(project.id);
            }} 
            type="button"
            className="p-2 rounded-full hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors"
            title="Delete Project"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function SortablePostRow({ 
  post, 
  onDelete, 
  onToggleVisibility 
}: { 
  post: BlogPost; 
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, current: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isHidden = post.is_visible === false;

  return (
    <tr ref={setNodeRef} style={style} className={`bg-white hover:bg-gray-50 ${isHidden ? 'opacity-60 bg-gray-50/50' : ''}`}>
      <td className="px-6 py-4 w-12 cursor-grab" {...attributes} {...listeners}>
        <GripVertical size={20} className="text-gray-400" />
      </td>
      <td className="px-6 py-4 w-24">
        <div className="relative">
          <img src={getValidImageUrl(post.backup_image_url, post.imageUrl)} alt="" className={`w-12 h-12 object-cover rounded ${isHidden ? 'grayscale' : ''}`} />
          {isHidden && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded">
              <EyeOff size={16} className="text-white drop-shadow-md" />
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 font-mono text-gray-500">{post.date}</td>
      <td className="px-6 py-4 font-medium max-w-xs truncate" title={post.title_en}>
         <span className={isHidden ? 'line-through text-gray-400' : ''}>{post.title_en}</span>
         {isHidden && <span className="ml-2 text-xs text-gray-400 italic">(Hidden)</span>}
      </td>
      <td className="px-6 py-4 font-medium max-w-xs truncate" title={post.title_zh}>
        <span className={isHidden ? 'line-through text-gray-400' : ''}>{post.title_zh}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {post.backup_image_url && !post.backup_image_url.includes('supabase.co') ? (
            <div title="Image backed up (China accessible)" className="p-2 text-green-600">
              <ShieldCheck size={18} />
            </div>
          ) : (
             <div title="Using original URL" className="p-2 text-gray-300">
               <ShieldCheck size={18} />
            </div>
          )}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleVisibility(post.id, post.is_visible !== false);
            }}
            type="button"
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isHidden ? 'text-gray-400' : 'text-gray-600'}`}
            title={isHidden ? "Show Post" : "Hide Post"}
          >
            {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <Link 
            to={`/admin/posts/${post.id}`} 
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Edit2 size={18} />
          </Link>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(post.id);
            }}
            type="button"
            className="p-2 rounded-full hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [triggering, setTriggering] = useState(false);

  // New settings state
  const [clickSpawnEnabled, setClickSpawnEnabled] = useState(true);
  const [machineGunEnabled, setMachineGunEnabled] = useState(true);
  const [machineGunInterval, setMachineGunInterval] = useState(200);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 12000) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Behance request timed out after ${Math.round(timeoutMs / 1000)}s`);
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const extractResponseError = (body: string) => {
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed?.details === 'string' && parsed.details.trim()) return parsed.details.trim();
      if (typeof parsed?.error === 'string' && parsed.error.trim()) return parsed.error.trim();
    } catch {
      // Non-JSON response bodies are handled below.
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) return '';

    return trimmedBody.slice(0, 160);
  };

  const extractProjectImagesFromLink = async (projectLink: string) => {
    const endpoint = import.meta.env.DEV
      ? `/dev-api/extract-project-images?url=${encodeURIComponent(projectLink)}`
      : `/api/extract-project-images?url=${encodeURIComponent(projectLink)}`;

    const response = await fetchWithTimeout(endpoint, {}, import.meta.env.DEV ? 15000 : 20000);
    const responseText = await response.text();

    if (!response.ok) {
      const responseError = extractResponseError(responseText);
      throw new Error(responseError || `Failed to extract project images: ${response.status}`);
    }

    const payload = JSON.parse(responseText) as { images?: string[] };
    return Array.isArray(payload.images) ? payload.images : [];
  };

  const fetchData = async () => {
    try {
      const [projectsRes, postsRes, subscribersRes, settingsRes, leadsRes] = await Promise.all([
        supabase.from('projects').select('*').order('sort_order', { ascending: true }),
        supabase.from('posts').select('*').order('sort_order', { ascending: true }).order('date', { ascending: false }),
        supabase.from('subscribers').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*'),
        supabase.from('leads').select('*').order('created_at', { ascending: false })
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      if (subscribersRes.data) setSubscribers(subscribersRes.data);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (settingsRes.data) {
        const heroSettings = settingsRes.data.find(s => s.key === 'hero_interaction')?.value || {};
        setClickSpawnEnabled(heroSettings.enable_click_spawn !== false);
        setMachineGunEnabled(heroSettings.enable_machine_gun !== false);
        if (heroSettings.machine_gun_interval) {
          setMachineGunInterval(heroSettings.machine_gun_interval);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateHeroSettings = async (newClickSpawn: boolean, newMachineGun: boolean, newInterval: number) => {
    const newValue = { 
      enable_click_spawn: newClickSpawn,
      enable_machine_gun: newMachineGun,
      machine_gun_interval: newInterval
    };
    
    // Optimistic update
    setClickSpawnEnabled(newClickSpawn);
    setMachineGunEnabled(newMachineGun);
    setMachineGunInterval(newInterval);

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'hero_interaction', value: newValue })
        .select()
        .single();

      if (error) throw error;
      toast.success('Hero settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
      // Revert could be added here
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProjects((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update sort order in backend
        const updates = newItems.map((item, index) => ({
          id: item.id,
          sort_order: index
        }));

        Promise.all(updates.map(u => 
          supabase.from('projects').update({ sort_order: u.sort_order }).eq('id', u.id)
        )).catch(err => {
          console.error('Error updating sort order:', err);
          toast.error('Failed to save sort order');
        });

        return newItems;
      });
    }
  };

  const handlePostDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPosts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update sort order in backend
        const updates = newItems.map((item, index) => ({
          id: item.id,
          sort_order: index
        }));

        Promise.all(updates.map(u => 
          supabase.from('posts').update({ sort_order: u.sort_order }).eq('id', u.id)
        )).catch(err => {
          console.error('Error updating sort order:', err);
          toast.error('Failed to save sort order');
        });

        return newItems;
      });
    }
  };

  const toggleProjectVisibility = async (id: string, currentIsVisible: boolean) => {
    const newValue = !currentIsVisible;
    
    // Optimistic update
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, is_visible: newValue } : p
    ));

    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_visible: newValue })
        .eq('id', id);

      if (error) throw error;
      toast.success(newValue ? 'Project visible' : 'Project hidden');
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
      // Revert on error
      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, is_visible: currentIsVisible } : p
      ));
    }
  };

  const togglePostVisibility = async (id: string, currentIsVisible: boolean) => {
    const newValue = !currentIsVisible;
    
    // Optimistic update
    setPosts(prev => prev.map(p => 
      p.id === id ? { ...p, is_visible: newValue } : p
    ));

    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_visible: newValue })
        .eq('id', id);

      if (error) throw error;
      toast.success(newValue ? 'Post visible' : 'Post hidden');
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
      // Revert on error
      setPosts(prev => prev.map(p => 
        p.id === id ? { ...p, is_visible: currentIsVisible } : p
      ));
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also remove any associated backup images from storage.')) return;
    try {
      // 1. Get backup URL first
      const { data: project } = await supabase
        .from('projects')
        .select('backup_image_url, images')
        .eq('id', id)
        .single();

      // 2. Delete main backup image if exists
      if (project?.backup_image_url && project.backup_image_url.includes('supabase.co')) {
          const parts = project.backup_image_url.split('/');
          const fileName = parts[parts.length - 1]; // e.g. 12345_timestamp.jpg
          if (fileName) {
              await supabase.storage.from('project-images').remove([fileName]);
          }
      }

      // 3. Delete any other images that might be in Supabase Storage (from gallery)
      if (project?.images && Array.isArray(project.images)) {
          const supabaseImages = project.images
             .filter(img => img.includes('supabase.co'))
             .map(img => {
                 const parts = img.split('/');
                 return parts[parts.length - 1];
             });
          
          if (supabaseImages.length > 0) {
              await supabase.storage.from('project-images').remove(supabaseImages);
          }
      }

      // 4. Finally delete database record
      await supabase.from('projects').delete().eq('id', id);
      toast.success('Project and files deleted');
      fetchData();
    } catch (e) {
      console.error('Delete error:', e);
      toast.error('Failed to delete project');
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      // 1. Get backup URL
      const { data: post } = await supabase
        .from('posts')
        .select('backup_image_url')
        .eq('id', id)
        .single();
        
      // 2. Delete file if exists
      if (post?.backup_image_url && post.backup_image_url.includes('supabase.co')) {
          const parts = post.backup_image_url.split('/');
          const fileName = parts[parts.length - 1];
          if (fileName) {
              await supabase.storage.from('project-images').remove([fileName]);
          }
      }

      // 3. Delete record
      await supabase.from('posts').delete().eq('id', id);
      toast.success('Post and files deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete post');
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (!confirm('Are you sure you want to remove this subscriber?')) return;
    try {
      await supabase.from('subscribers').delete().eq('id', id);
      toast.success('Subscriber removed');
      fetchData();
    } catch (e) {
      toast.error('Failed to remove subscriber');
    }
  };

  const exportSubscribers = () => {
    if (subscribers.length === 0) {
      toast.error('No subscribers to export');
      return;
    }

    const headers = ['Email', 'Subscribed At'];
    const csvContent = [
      headers.join(','),
      ...subscribers.map(sub => [
        sub.email,
        new Date(sub.created_at).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to remove this message?')) return;
    try {
      // .select() returns the removed rows so we can detect if RLS blocked the delete
      const { data, error } = await supabase.from('leads').delete().eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('Delete blocked by database policy');
        return;
      }
      toast.success('Message removed');
      fetchData();
    } catch (e) {
      toast.error('Failed to remove message');
    }
  };

  const exportLeads = () => {
    if (leads.length === 0) {
      toast.error('No messages to export');
      return;
    }

    const escapeCsv = (value: string) => `"${(value || '').replace(/"/g, '""')}"`;
    const csvContent = [
      ['Contact', 'Message', 'Source', 'Status', 'Received At'].join(','),
      ...leads.map(lead => [
        escapeCsv(lead.contact_info),
        escapeCsv(lead.message || ''),
        escapeCsv(lead.source),
        escapeCsv(lead.status),
        new Date(lead.created_at).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncBehance = async () => {
    // Removed prompt to avoid blocking/issues. Hardcoded for now as this is a single-client site.
    // In future, could add a settings page.
    const username = 'up-brands';
    
    setSyncing(true);
    const toastId = toast.loading(`Syncing with Behance (@${username})...`);

    try {
      const proxyUrl = import.meta.env.DEV 
        ? `/dev-api/behance-projects?username=${username}`
        : `/api/behance-projects?username=${username}`;
      
      const response = await fetchWithTimeout(proxyUrl, {}, import.meta.env.DEV ? 15000 : 20000);
      const responseText = await response.text();
      
      if (!response.ok) {
          const responseError = extractResponseError(responseText);
          if (response.status === 429) {
            throw new Error('Behance HTTP error: 429 Too many requests. Please wait 1-2 minutes before trying again.');
          }
          throw new Error(responseError || `Failed to fetch Behance feed: ${response.status}`);
      }

      let payload: BehanceSyncResponse;
      try {
        payload = JSON.parse(responseText) as BehanceSyncResponse;
      } catch {
        throw new Error('Behance returned an unexpected response instead of project data');
      }
      
      const items = payload.projects || [];
      
      if (items.length === 0) {
        toast.error('No projects found in Behance profile', { id: toastId });
        return;
      }

      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let galleryFilledCount = 0;
      const existingProjectsById = new Map(projects.map((project) => [project.id, project]));
      const galleryFillTargets = new Map<string, { id: string; link: string }>();
      const inserts: Array<Pick<Project, 'id' | 'title' | 'subtitle' | 'category' | 'imageUrl' | 'backup_image_url' | 'link' | 'sort_order'>> = [];
      const updates: Array<{ id: string; title: string; values: Partial<Project> }> = [];
      const maxSortOrder = projects.length > 0 
        ? Math.max(...projects.map(p => p.sort_order || 0)) 
        : 0;

      for (const item of items) {
        const title = item.title || 'Untitled';
        const rawTitle = item.rawTitle || title;
        const subtitle = item.subtitle || '';
        const link = item.link || '';
        const id = item.id || '';
        const imageUrl = item.imageUrl || '';
        const sourceCategory = item.sourceCategory || '';
        const existingProject = existingProjectsById.get(id);

        if (!id || !imageUrl) {
          skippedCount++;
          continue;
        }

        if (!existingProject) {
          inserts.push({
            id,
            title,
            subtitle,
            category: '',
            imageUrl,
            backup_image_url: null,
            link,
            sort_order: maxSortOrder + inserts.length + 1,
          });
          if (link) {
            galleryFillTargets.set(id, { id, link });
          }
          continue;
        }

        const nextValues: Partial<Project> = {};
        const existingSubtitle = (existingProject.subtitle || '').trim();
        const existingCategory = (existingProject.category || '').trim();
        const hasGalleryImages = Array.isArray(existingProject.images) && existingProject.images.length > 0;
        const legacyCombinedTitle = existingProject.title === rawTitle && Boolean(subtitle);
        const shouldResetLegacyCategory =
          !existingSubtitle &&
          (isLegacySubtitleText(existingCategory) || (Boolean(subtitle) && existingCategory === sourceCategory));

        if (!existingProject.title || legacyCombinedTitle) nextValues.title = title;
        if (!existingSubtitle && subtitle) nextValues.subtitle = subtitle;
        if (!existingProject.link && link) nextValues.link = link;
        if (!existingProject.imageUrl && imageUrl) nextValues.imageUrl = imageUrl;
        if (shouldResetLegacyCategory) nextValues.category = '';

        if (!hasGalleryImages && link) {
          galleryFillTargets.set(id, { id, link });
        }

        if (Object.keys(nextValues).length > 0) {
          updates.push({ id, title, values: nextValues });
        }
      }

      if (inserts.length > 0) {
        const { error: insertError } = await supabase.from('projects').insert(inserts);
        if (insertError) {
          throw new Error(`Failed to insert Behance projects: ${insertError.message}`);
        }
        addedCount = inserts.length;
      }

      for (const update of updates) {
        const { error: updateError } = await supabase.from('projects').update(update.values).eq('id', update.id);
        if (updateError) {
          throw new Error(`Failed to update project ${update.title}: ${updateError.message}`);
        }
      }
      updatedCount = updates.length;

      if (galleryFillTargets.size > 0) {
        const galleryResults = await Promise.allSettled(
          Array.from(galleryFillTargets.values()).map(async (target) => {
            const images = await extractProjectImagesFromLink(target.link);
            if (images.length === 0) return 0;

            const { error } = await supabase.from('projects').update({ images }).eq('id', target.id);
            if (error) {
              throw error;
            }

            return 1;
          }),
        );

        galleryFilledCount = galleryResults.filter(
          (result) => result.status === 'fulfilled' && result.value > 0,
        ).length;
      }

      const fetchedCount = payload.total || items.length;
      const pageCount = payload.pageCount || 1;
      const isLimitedSource = payload.source === 'rss';
      const sourceLabel =
        payload.source === 'api'
          ? 'Behance API'
          : isLimitedSource
            ? 'RSS'
            : 'Behance profile';
      const fetchedLabel = isLimitedSource ? `latest ${fetchedCount} RSS items` : `${fetchedCount} Behance projects`;
      const warningSuffix = payload.warning ? ` ${payload.warning}` : '';

      if (addedCount > 0 || updatedCount > 0 || galleryFilledCount > 0) {
        const parts = [];
        parts.push(`fetched ${fetchedLabel}`);
        if (addedCount > 0) parts.push(`added ${addedCount}`);
        if (updatedCount > 0) parts.push(`updated ${updatedCount}`);
        if (galleryFilledCount > 0) parts.push(`filled ${galleryFilledCount} galleries`);
        if (skippedCount > 0) parts.push(`skipped ${skippedCount}`);
        if (pageCount > 1) parts.push(`${pageCount} pages`);

        toast.success(`Sync complete from ${sourceLabel}: ${parts.join(', ')}.${warningSuffix}`.trim(), { id: toastId });
        fetchData();
        // Trigger automated workflow after significant sync
        handleTriggerSitemap();
      } else if (skippedCount > 0) {
        toast.error(`Behance returned ${fetchedLabel}, but ${skippedCount} could not be synced.${warningSuffix}`.trim(), { id: toastId });
      } else {
        const suffix = pageCount > 1 ? ` across ${pageCount} pages` : '';
        toast.success(`Fetched ${fetchedLabel} from ${sourceLabel}${suffix}; all fetched items are already in sync.${warningSuffix}`.trim(), { id: toastId });
      }

    } catch (error: any) {
      console.error('Sync failed:', error);
      const rawMessage = error instanceof Error ? error.message : 'Unknown error';
      const message = import.meta.env.DEV && rawMessage.includes('timed out')
        ? `${rawMessage}. Local dev proxy could not reach Behance.`
        : rawMessage;
      toast.error(`Sync failed: ${message}`, { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleTriggerSitemap = async () => {
    setTriggering(true);
    const toastId = toast.loading('Sending build trigger...');

    try {
      if (import.meta.env.DEV) {
        // Local dev: generate sitemap locally
        try {
          const res = await fetch('/dev-api/trigger-sitemap', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (res.ok) {
            toast.success('Local sitemap updated!', { icon: '💻' });
          } else {
            console.warn('Local sitemap endpoint returned non-OK status');
          }
        } catch (e) {
          console.error('Local sitemap generation failed', e);
          // Do not throw - continue with remote trigger
        }
      }

      // 1. Try Vercel Deploy Hook from Env Var
      const deployHook = import.meta.env.VITE_VERCEL_DEPLOY_HOOK;
      
      if (deployHook) {
          const res = await fetch(deployHook, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (!res.ok) {
            console.warn('Deploy hook returned non-OK:', res.status);
            // Do not throw for Vercel hooks as they often return 204/302
          }
          toast.success('Rebuild triggered! Sitemap will update in ~2 mins.', { id: toastId });
          return;
      } 
      
      // 2. Try Vercel Deploy Hook from Supabase Settings (Backup)
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'deploy_hook_url')
        .maybeSingle();
        
      if (settingsError) {
        console.warn('Failed to fetch deploy hook from DB:', settingsError.message);
      } else if (settingsData?.value?.url) {
          const res = await fetch(settingsData.value.url, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (!res.ok) {
            console.warn('DB deploy hook returned non-OK:', res.status);
          }
          toast.success('Rebuild triggered via DB setting! (~2 mins)', { id: toastId });
          return;
      }

      // 3. Fallback to API route (GitHub workflow trigger)
      const res = await fetch('/api/trigger-workflow', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'No error body');
        console.warn('API trigger failed:', res.status, errorText);
        toast.error('Deploy hook missing or API failed. Please configure VITE_VERCEL_DEPLOY_HOOK.', { id: toastId });
      } else {
        toast.success('Update signal sent to GitHub workflow!', { id: toastId });
      }
      
    } catch (error: any) {
      console.error('Trigger sitemap error:', error);
      toast.error(`Failed to trigger update: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setTriggering(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-12">
      <TagsManager />
      
      {/* Settings Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
            <SettingsIcon size={24} /> General Settings
          </h2>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden p-6 space-y-6">
          {/* Click Spawn Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Click to Spawn Image</h3>
              <p className="text-sm text-gray-500">Enable clicking on the hero section to spawn random project images.</p>
            </div>
            <button
              onClick={() => updateHeroSettings(!clickSpawnEnabled, machineGunEnabled, machineGunInterval)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                clickSpawnEnabled ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={clickSpawnEnabled}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  clickSpawnEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Machine Gun Toggle */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Machine Gun Mode</h3>
              <p className="text-sm text-gray-500">Enable continuous image spawning when holding down click/touch.</p>
            </div>
            <div className="flex items-center gap-4">
              {machineGunEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Interval:</span>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="50"
                    value={machineGunInterval}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) updateHeroSettings(clickSpawnEnabled, machineGunEnabled, val);
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  />
                  <span className="text-sm text-gray-500">ms</span>
                </div>
              )}
              <button
                onClick={() => updateHeroSettings(clickSpawnEnabled, !machineGunEnabled, machineGunInterval)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                  machineGunEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={machineGunEnabled}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    machineGunEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Projects</h2>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={handleTriggerSitemap}
              disabled={triggering}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={16} className={triggering ? "animate-spin" : ""} />
              {triggering ? 'Updating...' : 'Update Sitemap'}
            </button>
            <button 
              type="button"
              onClick={handleSyncBehance}
              disabled={syncing}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
              {syncing ? 'Syncing...' : 'Sync with Behance'}
            </button>
            <Link 
              to="/admin/projects/new" 
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800"
            >
              <Plus size={16} /> Add Project
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 w-12"></th>
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Small Label</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <SortableContext
                items={projects.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-gray-100">
                  {projects.map((project) => (
                    <SortableProjectRow 
                      key={project.id} 
                      project={project} 
                      onDelete={deleteProject}
                      onToggleVisibility={toggleProjectVisibility}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </section>

      {/* Posts Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Blog Posts</h2>
          <Link 
            to="/admin/posts/new" 
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800"
          >
            <Plus size={16} /> Add Post
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePostDragEnd}
          >
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 w-12"></th>
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Title (EN)</th>
                  <th className="px-6 py-3">Title (ZH)</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <SortableContext
                items={posts.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <SortablePostRow 
                      key={post.id} 
                      post={post} 
                      onDelete={deletePost}
                      onToggleVisibility={togglePostVisibility}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </section>

      {/* Subscribers Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Newsletter Subscribers</h2>
          <button 
            onClick={exportSubscribers}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Subscribed At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No subscribers yet.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{sub.email}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteSubscriber(sub.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={16} className="inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Chat Leads Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Chat Messages</h2>
            <p className="text-sm text-gray-500 mt-1">Messages captured from the website chat widget.</p>
          </div>
          <button
            onClick={exportLeads}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Message</th>
                <th className="px-6 py-3">Received At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No messages yet.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 align-top">
                    <td className="px-6 py-4 font-medium whitespace-nowrap">{lead.contact_info}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-md">
                      {lead.message ? lead.message : <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString()} {new Date(lead.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteLead(lead.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={16} className="inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

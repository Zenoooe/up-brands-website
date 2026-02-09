import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Project, BlogPost, Subscriber } from '../../types';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, GripVertical, RefreshCw, Download, Eye, EyeOff, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import { backupImageToSupabase } from '../../utils/imageBackup';
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
          <img src={project.backup_image_url || project.imageUrl} alt="" className={`w-12 h-12 object-cover rounded ${isHidden ? 'grayscale' : ''}`} />
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
      <td className="px-6 py-4 text-gray-500">{project.category}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {project.backup_image_url ? (
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
            onClick={() => onToggleVisibility(project.id, project.is_visible !== false)}
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isHidden ? 'text-gray-400' : 'text-gray-600'}`}
            title={isHidden ? "Show Project" : "Hide Project"}
          >
            {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <Link 
            to={`/admin/projects/${project.id}`} 
            className="p-2 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit Project"
          >
            <Edit2 size={18} />
          </Link>
          <button 
            onClick={() => onDelete(project.id)} 
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
          <img src={post.backup_image_url || post.imageUrl} alt="" className={`w-12 h-12 object-cover rounded ${isHidden ? 'grayscale' : ''}`} />
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
          {post.backup_image_url ? (
            <div title="Image backed up (China accessible)" className="p-2 text-green-600">
              <ShieldCheck size={18} />
            </div>
          ) : (
             <div title="Using original URL" className="p-2 text-gray-300">
               <ShieldCheck size={18} />
            </div>
          )}
          <button 
            onClick={() => onToggleVisibility(post.id, post.is_visible !== false)}
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isHidden ? 'text-gray-400' : 'text-gray-600'}`}
            title={isHidden ? "Show Post" : "Hide Post"}
          >
            {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <Link to={`/admin/posts/${post.id}`} className="p-2 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors">
            <Edit2 size={18} />
          </Link>
          <button onClick={() => onDelete(post.id)} className="p-2 rounded-full hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors">
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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, postsRes, subscribersRes] = await Promise.all([
        supabase.from('projects').select('*').order('sort_order', { ascending: true }),
        supabase.from('posts').select('*').order('sort_order', { ascending: true }).order('date', { ascending: false }),
        supabase.from('subscribers').select('*').order('created_at', { ascending: false })
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      if (subscribersRes.data) setSubscribers(subscribersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await supabase.from('projects').delete().eq('id', id);
      toast.success('Project deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete project');
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await supabase.from('posts').delete().eq('id', id);
      toast.success('Post deleted');
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

  const handleSyncBehance = async () => {
    // Removed prompt to avoid blocking/issues. Hardcoded for now as this is a single-client site.
    // In future, could add a settings page.
    const username = 'up-brands';
    
    setSyncing(true);
    const toastId = toast.loading(`Syncing with Behance (@${username})...`);

    try {
      // Use local API proxy instead of AllOrigins to avoid CORS/Rate limits
      // Behance RSS: https://www.behance.net/feeds/user?username=up-brands
      const proxyUrl = `/api/behance-rss?username=${username}`;
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) throw new Error('Failed to fetch Behance feed');
      
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const items = xmlDoc.querySelectorAll('item');
      
      if (items.length === 0) {
        toast.error('No projects found in feed', { id: toastId });
        return;
      }

      let count = 0;
      const maxSortOrder = projects.length > 0 
        ? Math.max(...projects.map(p => p.sort_order || 0)) 
        : 0;

      for (const item of Array.from(items)) {
        const title = item.querySelector('title')?.textContent || 'Untitled';
        const link = item.querySelector('link')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        
        const idMatch = link.match(/\/gallery\/(\d+)\//);
        if (!idMatch) continue;
        const id = idMatch[1];

        const imgMatch = description.match(/src="([^"]+)"/);
        const imageUrl = imgMatch ? imgMatch[1] : '';

        const category = item.querySelector('category')?.textContent || 'Branding';

        if (id && imageUrl) {
          const exists = projects.some(p => p.id === id);
          
          if (!exists) {
            // New project: Backup image and insert
            // Check again in DB to be safe
            const { data } = await supabase.from('projects').select('id').eq('id', id).single();
            
            if (!data) {
              let backupUrl = '';
              try {
                // Try to backup immediately for new projects
                backupUrl = await backupImageToSupabase(imageUrl, id);
              } catch (err) {
                console.warn(`Failed to backup image for project ${id}`, err);
              }

              await supabase.from('projects').insert({
                id,
                title,
                category,
                imageUrl, // Keep original Behance URL
                backup_image_url: backupUrl, // Store backup separately
                link,
                sort_order: maxSortOrder + count + 1
              });
              count++;
            }
          } else {
            // Existing project: 
            // Only update if we don't have a backup yet
            const existingProject = projects.find(p => p.id === id);
            
            // Check if backup is missing
            if (existingProject && !existingProject.backup_image_url) {
               // Also check if the original imageUrl has changed, we might want to update it
               if (existingProject.imageUrl !== imageUrl) {
                 await supabase.from('projects').update({ imageUrl }).eq('id', id);
               }

               try {
                const newBackupUrl = await backupImageToSupabase(imageUrl, id);
                if (newBackupUrl) {
                  await supabase.from('projects')
                    .update({ backup_image_url: newBackupUrl }) // Only update backup field
                    .eq('id', id);
                  count++; 
                }
              } catch (err) {
                console.warn(`Failed to create backup for existing project ${id}`, err);
              }
            }
          }
        }
      }

      // Phase 2: Scan ALL local projects for missing backups
      // This ensures we backup everything even if it's not in the latest RSS feed
      // Refresh local projects first to include any newly added ones
      const { data: allProjects } = await supabase.from('projects').select('*');
      
      if (allProjects) {
        // Find projects that have imageUrl but NO backup_image_url
        const pendingBackup = allProjects.filter(p => p.imageUrl && !p.backup_image_url);
        
        if (pendingBackup.length > 0) {
          const loadingMsg = toast.loading(`Backing up ${pendingBackup.length} remaining projects...`, { id: toastId });
          
          for (const project of pendingBackup) {
            try {
              // Double check if we need to backup
              if (!project.backup_image_url) {
                const newBackupUrl = await backupImageToSupabase(project.imageUrl, project.id);
                if (newBackupUrl) {
                  await supabase.from('projects')
                    .update({ backup_image_url: newBackupUrl })
                    .eq('id', project.id);
                  count++;
                }
              }
            } catch (err) {
              console.warn(`Failed to backup existing project ${project.id}`, err);
              // Continue to next even if one fails
            }
          }
        }
      }

      // Phase 3: Scan ALL Blog Posts for missing backups
      const { data: allPosts } = await supabase.from('posts').select('*');
      
      if (allPosts) {
        const pendingPostBackup = allPosts.filter(p => p.imageUrl && !p.backup_image_url);
        
        if (pendingPostBackup.length > 0) {
           const loadingMsg = toast.loading(`Backing up ${pendingPostBackup.length} posts...`, { id: toastId });
           
           for (const post of pendingPostBackup) {
             try {
               // Use slug as part of ID or fallback to random
               const imageId = `post_${post.slug || 'untitled'}_${Date.now()}`;
               const newBackupUrl = await backupImageToSupabase(post.imageUrl, imageId);
               
               if (newBackupUrl) {
                 await supabase.from('posts')
                   .update({ backup_image_url: newBackupUrl })
                   .eq('id', post.id);
                 count++;
               }
             } catch (err) {
               console.warn(`Failed to backup post ${post.id}`, err);
             }
           }
        }
      }

      if (count > 0) {
        toast.success(`Synced! Processed ${count} items`, { id: toastId });
        fetchData();
      } else {
        toast.success('All items up to date', { id: toastId });
      }

    } catch (error: any) {
      console.error('Sync failed:', error);
      toast.error(`Sync failed: ${error.message}`, { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-12">
      {/* Projects Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Projects</h2>
          <div className="flex items-center gap-4">
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
                  <th className="px-6 py-3">Category</th>
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
    </div>
  );
}

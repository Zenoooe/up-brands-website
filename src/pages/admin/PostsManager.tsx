import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { BlogPost } from '../../types';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff, ShieldCheck, ShieldOff, ImageOff, ExternalLink } from 'lucide-react';
import { getValidImageUrl } from '../../utils/image';
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

function PostThumbnail({ src, isHidden }: { src: string; isHidden: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
      {failed || !src ? (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <ImageOff size={20} />
        </div>
      ) : (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover ${isHidden ? 'grayscale' : ''}`}
        />
      )}
      {isHidden && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <EyeOff size={16} className="text-white drop-shadow" />
        </div>
      )}
    </div>
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
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isHidden = post.is_visible === false;
  const isBackedUp = Boolean(post.backup_image_url && post.backup_image_url.includes('cdn.jsdelivr.net'));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 px-4 py-4 bg-white hover:bg-gray-50 transition-colors ${
        isDragging ? 'shadow-lg ring-1 ring-black/5 rounded-lg relative z-10' : ''
      } ${isHidden ? 'opacity-70' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1 -ml-1 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
        title={t('admin.posts.dragToReorder')}
      >
        <GripVertical size={20} />
      </button>

      <PostThumbnail src={getValidImageUrl(post.backup_image_url, post.imageUrl)} isHidden={isHidden} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`font-semibold truncate ${isHidden ? 'line-through text-gray-400' : 'text-gray-900'}`}
            title={post.title_en}
          >
            {post.title_en}
          </p>
          {isHidden && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {t('admin.posts.hidden')}
            </span>
          )}
        </div>
        <p
          className={`text-sm truncate mt-0.5 ${isHidden ? 'text-gray-400' : 'text-gray-500'}`}
          title={post.title_zh}
        >
          {post.title_zh}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
          <span className="font-mono shrink-0">{post.date}</span>
          {post.tags && post.tags.length > 0 && (
            <span className="truncate">· {post.tags.join(', ')}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <span
          title={isBackedUp ? t('admin.posts.backedUp') : t('admin.posts.notBackedUp')}
          className={`p-2 ${isBackedUp ? 'text-green-600' : 'text-gray-300'}`}
        >
          {isBackedUp ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
        </span>
        <button
          type="button"
          onClick={() => onToggleVisibility(post.id, post.is_visible !== false)}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
            isHidden ? 'text-gray-400' : 'text-gray-600'
          }`}
          title={isHidden ? t('admin.posts.show') : t('admin.posts.hide')}
        >
          {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <Link
          to={`/admin/posts/${post.id}`}
          className="p-2 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors"
          title={t('admin.posts.edit')}
        >
          <Edit2 size={18} />
        </Link>
        <a
          href={`/blog/${post.slug}`}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-colors"
          title={t('admin.posts.viewLive')}
        >
          <ExternalLink size={18} />
        </a>
        <button
          type="button"
          onClick={() => onDelete(post.id)}
          className="p-2 rounded-full hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors"
          title={t('admin.posts.delete')}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function PostsManager() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error(t('admin.posts.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePostDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPosts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        const updates = newItems.map((item, index) => ({
          id: item.id,
          sort_order: index
        }));

        Promise.all(updates.map(u => 
          supabase.from('posts').update({ sort_order: u.sort_order }).eq('id', u.id)
        )).catch(err => {
          console.error('Error updating sort order:', err);
          toast.error(t('admin.posts.sortFailed'));
        });

        return newItems;
      });
    }
  };

  const togglePostVisibility = async (id: string, currentIsVisible: boolean) => {
    const newValue = !currentIsVisible;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, is_visible: newValue } : p));
    try {
      const { error } = await supabase.from('posts').update({ is_visible: newValue }).eq('id', id);
      if (error) throw error;
      toast.success(newValue ? t('admin.posts.visible') : t('admin.posts.hiddenToast'));
    } catch (error) {
      toast.error(t('admin.posts.visibilityFailed'));
      setPosts(prev => prev.map(p => p.id === id ? { ...p, is_visible: currentIsVisible } : p));
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm(t('admin.posts.deleteConfirm'))) return;
    try {
      await supabase.from('posts').delete().eq('id', id);
      toast.success(t('admin.posts.deleted'));
      fetchPosts();
    } catch (e) {
      toast.error(t('admin.posts.deleteFailed'));
    }
  };

  if (loading) return <div className="p-8">{t('admin.posts.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">{t('admin.posts.title')}</h2>
          <p className="text-gray-500 mt-1">
            {t('admin.posts.subtitle')}
            {posts.length > 0 && <span className="text-gray-400"> · {t('admin.posts.count', { count: posts.length })}</span>}
          </p>
        </div>
        <Link 
          to="/admin/posts/new" 
          className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm shrink-0"
        >
          <Plus size={18} /> {t('admin.posts.create')}
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {posts.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">
            {t('admin.posts.empty')}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePostDragEnd}
          >
            <SortableContext
              items={posts.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <SortablePostRow
                    key={post.id}
                    post={post}
                    onDelete={deletePost}
                    onToggleVisibility={togglePostVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

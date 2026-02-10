import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../../../components/common/StrictModeDroppable';
import { GalleryImageItem } from './GalleryImageItem';
import { Upload, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { backupImageToSupabase } from '../../../utils/imageBackup';

export interface GalleryEditorHandle {
  getImages: () => string[];
}

interface GalleryItem {
  id: string; // Stable ID for React Key / Draggable ID
  url: string;
}

interface GalleryEditorProps {
  initialImages: string[];
  projectId?: string;
}

export const GalleryEditor = forwardRef<GalleryEditorHandle, GalleryEditorProps>(
  ({ initialImages, projectId }, ref) => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newImageUrl2, setNewImageUrl2] = useState('');
    const [backingUp, setBackingUp] = useState(false);

    // Initialize items with stable IDs when initialImages changes
    useEffect(() => {
      if (initialImages && initialImages.length > 0) {
        // Only initialize if we have no items, OR if we want to force sync?
        // Better: Initialize once. The parent usually passes [] then [data].
        // We can check if we already have items to avoid overwriting ongoing edits if parent re-renders?
        // But parent ProjectEditor only loads once.
        // Let's assume initialImages is stable-ish or we only map if items is empty.
        // Actually, for "Edit" mode, we need to populate.
        // Let's use a simple mapping.
        
        setItems(prev => {
            // If we already have items and they match the URLs, keep them (to keep IDs stable)
            // But checking match is hard.
            // Simplest: Just map on mount.
            // But useEffect runs on prop change.
            // We'll trust the parent to only pass valid initialImages once or we accept re-init.
            // To be safe, let's only do this if items is empty.
            if (prev.length === 0) {
                 return initialImages.map(url => ({
                    id: crypto.randomUUID(),
                    url
                }));
            }
            return prev;
        });
      }
    }, [initialImages]);

    // Expose getImages to parent
    useImperativeHandle(ref, () => ({
      getImages: () => items.map(item => item.url)
    }));

    const handleAddImage = (urlToAdd: string) => {
      if (!urlToAdd) return;
      setItems(prev => [...prev, { id: crypto.randomUUID(), url: urlToAdd }]);
      setNewImageUrl('');
      setNewImageUrl2('');
      toast.success('Image added');
    };

    const handleRemoveImage = useCallback((index: number) => {
      setItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleBackupSingle = useCallback(async (url: string, index: number) => {
      const targetProjectId = projectId || crypto.randomUUID();
      const toastId = toast.loading('Backing up image...');

      try {
        const newUrl = await backupImageToSupabase(url, targetProjectId);
        
        setItems(prev => {
            const newItems = [...prev];
            // Update URL but KEEP ID STABLE
            newItems[index] = { ...newItems[index], url: newUrl };
            return newItems;
        });

        toast.success('Image backed up!', { id: toastId });
      } catch (error) {
        console.error(error);
        toast.error('Backup failed', { id: toastId });
      }
    }, [projectId]);

    const handleBackupAll = async () => {
      if (items.length === 0) return;
      
      const targetProjectId = projectId || crypto.randomUUID();
      const imagesToBackup = items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !item.url.includes('supabase.co') && !item.url.includes('vimeo'));

      if (imagesToBackup.length === 0) {
        toast.success('All images are already backed up!');
        return;
      }

      if (!window.confirm(`Found ${imagesToBackup.length} external images. Backup them all now?`)) return;

      setBackingUp(true);
      const toastId = toast.loading(`Starting backup...`);
      let successCount = 0;

      // We process sequentially to be nice to the server, but update UI immediately
      for (let i = 0; i < imagesToBackup.length; i++) {
        const { item, index } = imagesToBackup[i];
        toast.loading(`Backing up ${i + 1}/${imagesToBackup.length}...`, { id: toastId });

        try {
          const newUrl = await backupImageToSupabase(item.url, targetProjectId);
          successCount++;

          // Immediate UI update with STABLE ID
          setItems(prev => {
             const newItems = [...prev];
             // Find the item by ID to be safe, or use index if we trust it hasn't moved
             // Since we are blocking UI interactions mostly, index should be safe-ish,
             // BUT user *could* reorder while backup runs if we don't disable DND.
             // Best to find by ID.
             const actualIndex = newItems.findIndex(x => x.id === item.id);
             if (actualIndex !== -1) {
                 newItems[actualIndex] = { ...newItems[actualIndex], url: newUrl };
             }
             return newItems;
          });

        } catch (err) {
          console.error(`Failed to backup image ${item.url}`, err);
        }
      }

      setBackingUp(false);
      if (successCount === imagesToBackup.length) {
        toast.success(`All ${successCount} images backed up!`, { id: toastId });
      } else {
        toast.error(`Completed with errors (${successCount}/${imagesToBackup.length})`, { id: toastId });
      }
    };

    const onDragEnd = (result: any) => {
      if (!result.destination) return;
      
      const newItems = Array.from(items);
      const [reorderedItem] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, reorderedItem);
      
      setItems(newItems);
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Gallery Images</h3>
            <button
              type="button"
              onClick={handleBackupAll}
              disabled={backingUp}
              className="flex items-center gap-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
            >
              <Upload size={14} />
              {backingUp ? 'Backing up...' : 'Backup All'}
            </button>
        </div>

        <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Paste image URL or Vimeo link here..."
              className="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage(newImageUrl))}
            />
            <button 
              type="button"
              onClick={() => handleAddImage(newImageUrl)}
              disabled={!newImageUrl}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={18} /> Add
            </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
            <StrictModeDroppable droppableId="gallery-images">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {items.map((item, index) => (
                    <GalleryImageItem
                      key={item.id} // STABLE KEY
                      id={item.id}
                      url={item.url}
                      index={index}
                      onRemove={handleRemoveImage}
                      onBackup={handleBackupSingle}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
        </DragDropContext>

        <div className="flex gap-2 mt-6 pt-6 border-t border-dashed border-gray-200">
            <input 
              type="text" 
              value={newImageUrl2}
              onChange={(e) => setNewImageUrl2(e.target.value)}
              placeholder="Paste another image URL here..."
              className="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage(newImageUrl2))}
            />
            <button 
              type="button"
              onClick={() => handleAddImage(newImageUrl2)}
              disabled={!newImageUrl2}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={18} /> Add
            </button>
        </div>

        {items.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
              No images in gallery yet. Paste a URL above to start.
            </div>
        )}
      </div>
    );
  }
);

import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../../../components/common/StrictModeDroppable';
import { GalleryImageItem } from './GalleryImageItem';
import { Plus, Code, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImageFromUrl } from '../../../utils/imageUpload';
import {
  extractProjectImagesFromHtml,
  isProjectPageUrl,
  mergeUniqueImageUrls,
} from '../../../../shared/project-images';

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
  projectLink?: string;
}

export const GalleryEditor = forwardRef<GalleryEditorHandle, GalleryEditorProps>(
  ({ initialImages, projectId, projectLink }, ref) => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newImageUrl2, setNewImageUrl2] = useState('');
    const [extractingFromLink, setExtractingFromLink] = useState(false);
    
    // New state for HTML extraction
    const [showHtmlInput, setShowHtmlInput] = useState(false);
    const [htmlInput, setHtmlInput] = useState('');

    // Initialize items with stable IDs when initialImages changes
    useEffect(() => {
      if (initialImages && initialImages.length > 0) {
        setItems(prev => {
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
    }), [items]);

    const appendImages = useCallback((incomingUrls: string[]) => {
      if (!incomingUrls.length) return 0;

      let addedCount = 0;
      setItems((prev) => {
        const existingUrls = prev.map((item) => item.url);
        const mergedUrls = mergeUniqueImageUrls(existingUrls, incomingUrls);
        addedCount = mergedUrls.length - existingUrls.length;
        return mergedUrls.map((url, index) => prev[index] || { id: crypto.randomUUID(), url });
      });

      return addedCount;
    }, []);

    const extractImagesFromProjectLink = useCallback(async (urlToExtract?: string) => {
      const targetUrl = (urlToExtract || projectLink || '').trim();
      const endpoint = import.meta.env.DEV
        ? `/dev-api/extract-project-images?url=${encodeURIComponent(targetUrl)}`
        : `/api/extract-project-images?url=${encodeURIComponent(targetUrl)}`;

      if (!targetUrl) {
        toast.error('Add a Behance or ZCOOL project link first.');
        return;
      }

      if (!isProjectPageUrl(targetUrl)) {
        toast.error('This link is not a supported Behance or ZCOOL project page.');
        return;
      }

      const toastId = toast.loading('Extracting images from project page...');
      setExtractingFromLink(true);

      try {
        const response = await fetch(endpoint);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.details || payload?.error || 'Failed to extract project images');
        }

        const nextImages = Array.isArray(payload?.images) ? payload.images : [];
        const addedCount = appendImages(nextImages);

        if (addedCount > 0) {
          toast.success(`Added ${addedCount} images from the project page.`, { id: toastId });
        } else if (nextImages.length > 0) {
          toast.success('Project images are already in the gallery.', { id: toastId });
        } else {
          toast.error('No project images were found on that page.', { id: toastId });
        }
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : 'Failed to extract project images', { id: toastId });
      } finally {
        setExtractingFromLink(false);
      }
    }, [appendImages, projectLink]);

    const handleAddImage = async (urlToAdd: string, resetTarget: 'primary' | 'secondary' = 'primary') => {
      if (!urlToAdd) return;

      if (isProjectPageUrl(urlToAdd)) {
        await extractImagesFromProjectLink(urlToAdd);
      } else {
        appendImages([urlToAdd]);
        toast.success('Image added');
      }

      if (resetTarget === 'primary') {
        setNewImageUrl('');
      } else {
        setNewImageUrl2('');
      }
    };

    const handleParseHtml = () => {
      if (!htmlInput) return;

      try {
        const finalImages = extractProjectImagesFromHtml(htmlInput);

        if (finalImages.length === 0) {
          toast.error('No Behance or ZCOOL project images found in the pasted content.');
          return;
        }

        const addedCount = appendImages(finalImages);
        setHtmlInput('');
        setShowHtmlInput(false);

        if (addedCount > 0) {
          toast.success(`Success! Added ${addedCount} high-res images.`);
        } else {
          toast.success('Those images are already in the gallery.');
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to parse HTML');
      }
    };

    const handleRemoveImage = useCallback(async (index: number) => {
      // Delete from UI. CDN-hosted files remain on the `assets` branch.
      setItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleUploadToCdn = useCallback(async (url: string, index: number) => {
      const toastId = toast.loading('Uploading image to CDN...');

      try {
        const newUrl = await uploadImageFromUrl(url, 'projects');
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], url: newUrl };
            return newItems;
        });
        toast.success('Image uploaded to CDN!', { id: toastId });
      } catch (error) {
        console.error(error);
        toast.error('Upload failed', { id: toastId });
      }
    }, []);

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
            <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => extractImagesFromProjectLink()}
                  disabled={!projectLink || extractingFromLink}
                  className="flex items-center gap-2 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  <Link2 size={14} />
                  {extractingFromLink ? 'Extracting...' : 'Extract Current Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowHtmlInput(!showHtmlInput)}
                  className="flex items-center gap-2 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded transition-colors"
                >
                  <Code size={14} />
                  {showHtmlInput ? 'Hide HTML Extractor' : 'Extract from HTML'}
                </button>
            </div>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Direct link extraction works best for supported public pages. If Behance blocks the request, use the HTML extractor below as fallback.
        </p>

        {/* HTML Extractor Section */}
        {showHtmlInput && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                    Paste Behance or Zcool Page Source Code
                </label>
                <p className="text-xs text-blue-700 mb-3">
                    Right-click on the Behance or Zcool project page, select "View Page Source" (or Inspect), copy the entire HTML (or just the `project-modules` section), and paste it here. We will automatically find and sort the high-res images.
                </p>
                <textarea
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    className="w-full h-32 p-3 text-xs font-mono border rounded focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                    placeholder="<div id='project-modules'>...</div>"
                />
                <button
                    type="button"
                    onClick={handleParseHtml}
                    disabled={!htmlInput}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    Extract Images
                </button>
            </div>
        )}

        <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Paste image URL, Behance link, or Zcool HTML here..."
              className="flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void handleAddImage(newImageUrl))}
            />
            <button 
              type="button"
              onClick={() => void handleAddImage(newImageUrl)}
              disabled={!newImageUrl}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={18} /> {isProjectPageUrl(newImageUrl) ? 'Extract' : 'Add'}
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
                      onUpload={handleUploadToCdn}
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
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void handleAddImage(newImageUrl2, 'secondary'))}
            />
            <button 
              type="button"
              onClick={() => void handleAddImage(newImageUrl2, 'secondary')}
              disabled={!newImageUrl2}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={18} /> {isProjectPageUrl(newImageUrl2) ? 'Extract' : 'Add'}
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

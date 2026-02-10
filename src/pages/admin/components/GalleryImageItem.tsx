import { memo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { GripVertical, Check, Upload, X } from 'lucide-react';

interface GalleryImageItemProps {
  id: string;
  url: string;
  index: number;
  onRemove: (index: number) => void;
  onBackup: (url: string, index: number) => void;
}

export const GalleryImageItem = memo(function GalleryImageItem({ 
  id, 
  url, 
  index, 
  onRemove, 
  onBackup 
}: GalleryImageItemProps) {
  const isVimeo = url.includes('vimeo');
  const isBackedUp = url.includes('supabase.co');

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-center gap-4 p-3 bg-white border rounded-lg shadow-sm group transition-colors ${
            snapshot.isDragging ? 'border-black ring-2 ring-black/10 shadow-lg z-50' : 'hover:border-gray-300'
          }`}
          style={{
             ...provided.draggableProps.style,
             opacity: snapshot.isDragging ? 0.9 : 1
          }}
        >
          <div 
            {...provided.dragHandleProps} 
            className="text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing p-3 -ml-3 flex items-center justify-center"
          >
            <GripVertical size={24} />
          </div>
          
          <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
            {isVimeo ? (
              <div className="w-full h-full flex items-center justify-center bg-black text-white">
                <span className="font-bold text-xs">VIMEO</span>
              </div>
            ) : (
              <img src={url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate mb-1" title={url}>{url}</p>
            {isBackedUp ? (
               <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                 <Check size={10} /> Backed Up
               </span>
            ) : isVimeo ? (
               <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                 Video Embed
               </span>
            ) : (
               <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                 External Link
               </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isBackedUp && (
              <button
                type="button"
                onClick={() => onBackup(url, index)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Backup to Supabase"
              >
                <Upload size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Remove image"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
});

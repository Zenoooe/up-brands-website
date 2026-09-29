import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { Project } from '../../types';

interface ProjectSidebarProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSidebar = ({ project, isOpen, onClose }: ProjectSidebarProps) => {
  const { i18n } = useTranslation();

  // Multi-language Description Logic
  const descriptionEn = project.description_en;
  const descriptionZh = project.description;
  const descriptionTw = project.description_tw;
  const description = useMemo(() => {
    if (i18n.language.startsWith('en') && descriptionEn) {
      return descriptionEn;
    }

    if (i18n.language.includes('TW') || i18n.language.includes('Hant') || i18n.language === 'zh-HK') {
      return descriptionTw || descriptionZh || "";
    }

    return descriptionZh || "";
  }, [i18n.language, descriptionEn, descriptionTw, descriptionZh]);

  const cleanDescription = useMemo(() => {
    return DOMPurify.sanitize(description);
  }, [description]);
  
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Panel */}
      {/* Mobile: fixed full-screen drawer. Desktop: absolute inside the content wrapper so it stops before Related Work. */}
      <div 
        className={`fixed lg:absolute inset-y-0 right-0 w-full max-w-[480px] z-40 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {/* Sticky wrapper so the text follows you as you scroll down the page (desktop only). */}
        {/* data-lenis-prevent lets the inner container scroll on touch devices despite the global smooth-scroll. */}
        <div 
          data-lenis-prevent
          className={`h-[100dvh] lg:sticky lg:top-0 w-full overflow-y-auto overscroll-contain bg-[#F5F2EA] lg:bg-white border-l border-gray-200 transform transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] custom-scrollbar ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onWheel={(e) => {
            // Stop propagation so the body doesn't capture the wheel event
            e.stopPropagation();
          }}
        >
          <div className="p-8 md:p-12 pt-24 md:pt-32 pb-32">
            {/* Description */}
            <div 
              className="text-lg md:text-xl font-medium leading-relaxed [&>p]:mb-6 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 text-[#1A1A1A]"
              dangerouslySetInnerHTML={{ __html: cleanDescription }}
            />
            
            {/* Credits Grid */}
            {project.credits && Object.keys(project.credits).length > 0 && (
              <div className="grid grid-cols-2 gap-y-8 gap-x-4 mt-12 pt-12 border-t border-gray-200">
                 {Object.entries(project.credits).map(([role, name]) => (
                   <div key={role}>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{role}</h3>
                     <p className="text-sm font-medium">{name as string}</p>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
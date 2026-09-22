import { Project } from '../../types';
import { getProjectDisplayCategory, getProjectDisplaySubtitle } from '../../../shared/project-metadata';
import { useTranslation } from 'react-i18next';

interface ProjectInfoProps {
  project: Project;
}

export const ProjectInfo = ({ project }: ProjectInfoProps) => {
  const { t } = useTranslation();
  const subtitle = getProjectDisplaySubtitle(project);
  const categoryText = getProjectDisplayCategory(project);
  
  // Translate category tags if needed
  const categoryTags = categoryText
    ? categoryText.split(',').map((tag: string) => {
        const trimmed = tag.trim();
        // Check if it's an industry or service and translate
        return t(`tags.industries.${trimmed}`, { 
          defaultValue: t(`tags.services.${trimmed}`, { defaultValue: trimmed }) 
        });
      }).filter(Boolean)
    : [];

  return (
    <div className="w-full pt-16 pb-12 px-8 md:px-16 flex flex-col md:flex-row md:items-start justify-between gap-8 bg-[#F5F2EA]">
       {/* Left Column: Title & Tags */}
       <div className="flex-1 max-w-5xl">
         <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-[7.5rem] font-bold leading-[0.9] tracking-tighter break-words hyphens-auto mb-6 text-[#1A1A1A]">
           {project.title}
         </h1>
         
         {subtitle && (
           <p className="mt-4 max-w-3xl text-lg md:text-xl font-medium uppercase tracking-[0.18em] text-gray-500">
             {subtitle}
           </p>
         )}

         {categoryTags.length > 0 && (
           <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs md:text-sm font-medium uppercase tracking-wider text-gray-600 bg-gray-200/50 p-2 rounded-lg inline-flex">
             {categoryTags.map((tag, i) => (
               <span key={i} className="bg-white/60 px-3 py-1.5 rounded-md cursor-default shadow-sm border border-black/5">
                 {tag}
               </span>
             ))}
           </div>
         )}
       </div>
    </div>
  );
};

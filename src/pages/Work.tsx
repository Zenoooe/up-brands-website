import { useTranslation } from 'react-i18next';
import { Layout } from '../components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useBehanceProjects } from '../hooks/useBehanceProjects';
import { Project } from '../types';
import { useMemo } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { getSupabaseUrl, getValidImageUrl } from '../utils/image';
import { getCanonicalUrl, getProjectImageAlt } from '../utils/seo';
import { getProjectDisplayCategory, getProjectDisplaySubtitle } from '../../shared/project-metadata';
import { parseProjectTags } from '../utils/tags';

const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  let displayUrl = getValidImageUrl(project.backup_image_url, project.imageUrl);
  displayUrl = getSupabaseUrl(displayUrl, 800);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
      className="block w-full group"
    >
      <Link to={`/project/${project.slug || project.id}`} className="block w-full">
        <div className="relative overflow-hidden bg-gray-100 aspect-[4/3] md:aspect-[3/4]">
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 z-10" />
          <motion.div
            className="w-full h-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <img
              src={displayUrl}
              alt={getProjectImageAlt(project)}
              className="w-full h-full object-cover block"
              loading="lazy"
            />
          </motion.div>
        </div>
        
        <div className="mt-4 flex flex-col items-start">
          <h3 className="text-xl md:text-2xl font-bold uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4 decoration-black">
            {project.title}
          </h3>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1">
            {getProjectDisplaySubtitle(project) || getProjectDisplayCategory(project)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default function Work() {
  const { t } = useTranslation();
  const { projects, loading } = useBehanceProjects();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const service = searchParams.get('service');
  const industry = searchParams.get('industry');

  // Same listing is served at /work and the SEO alias /projects.
  const basePath = location.pathname.startsWith('/projects') ? '/projects' : '/work';
  const defaultHeading = basePath === '/projects' ? 'Projects' : 'Our Work';

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const tags = parseProjectTags(p.category);
      const matchService = !service || tags.services.includes(service);
      const matchIndustry = !industry || tags.industries.includes(industry);
      return matchService && matchIndustry;
    });
  }, [projects, service, industry]);

  const seoTitle = service || industry 
    ? `${service || ''} ${industry ? `for ${industry}` : ''} | Up-Brands ${defaultHeading}`
    : `${defaultHeading} | Up-Brands`;

  const heading = service || defaultHeading;
  const subheading = industry ? `for ${industry}` : '';

  return (
    <Layout>
      <SEO 
        title={seoTitle}
        description={`Explore our creative projects in ${service || 'branding'} ${industry ? `for the ${industry} industry` : ''}.`}
        url={getCanonicalUrl(basePath)}
      />

      <section className="w-full pt-48 pb-16 px-4 md:px-8 bg-[#F3EFEA] min-h-[50vh] flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link to="/" className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black mb-8 transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-[#1f2021] leading-[0.9]">
            {heading}
          </h1>
          {subheading && (
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-gray-500 mt-4">
              {subheading}
            </h2>
          )}
          <p className="mt-8 text-lg text-gray-600 max-w-2xl font-medium">
            Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} 
            {service ? ` matching ${service}` : ''}
            {industry ? ` in ${industry}` : ''}.
          </p>
        </motion.div>
      </section>

      <section className="w-full px-4 md:px-8 py-16 md:py-32 bg-white min-h-screen">
        {loading ? (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            <AnimatePresence>
              {filteredProjects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </Layout>
  );
}

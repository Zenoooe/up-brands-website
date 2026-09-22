import { Layout } from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { getCanonicalUrl } from '../utils/seo';

export default function NotFound() {
  return (
    <Layout>
      <SEO
        title="404 | Up-Brands"
        description="The page you are looking for could not be found."
        url={getCanonicalUrl('/404')}
        keywords={['404', 'page not found', 'Up-Brands']}
        noIndex
      />

      <section className="min-h-screen bg-[#F5F2EA] text-[#1A1A1A] px-6 py-32 flex items-center">
        <div className="max-w-3xl mx-auto w-full text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-gray-500 mb-6">404</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-6">
            Page Not Found
          </h1>
          <p className="text-lg md:text-2xl text-gray-600 leading-relaxed mb-10">
            The page you requested is unavailable or has moved. You can return to the homepage or browse recent project work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-bold uppercase tracking-wider rounded-full"
            >
              Back Home
            </Link>
            <Link
              to="/blog"
              className="inline-flex items-center justify-center px-6 py-3 border border-black text-black font-bold uppercase tracking-wider rounded-full"
            >
              Browse Insights
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

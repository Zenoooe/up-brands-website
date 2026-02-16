import { Layout } from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  return (
    <Layout>
      <Helmet>
        <title>404 - Page Not Found | Up-Brands</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="w-full h-screen flex flex-col items-center justify-center bg-white text-center px-4">
        <h1 className="text-9xl font-black mb-4">404</h1>
        <p className="text-xl md:text-2xl font-medium mb-8">
          The page you are looking for does not exist.
        </p>
        <Link 
          to="/" 
          className="bg-black text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </Layout>
  );
}

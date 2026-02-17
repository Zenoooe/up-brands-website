import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import Lenis from 'lenis';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/common/ScrollToTop';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin Imports (Also Lazy)
import { AuthProvider } from './contexts/AuthContext';
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProjectEditor = lazy(() => import('./pages/admin/ProjectEditor'));
const PostEditor = lazy(() => import('./pages/admin/PostEditor'));

// Loading Fallback
const PageLoader = () => (
  <div className="w-full h-screen flex items-center justify-center bg-white">
    <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    // Expose lenis to window for ScrollToTop access
    (window as any).lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      (window as any).lenis = null;
    };
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <AuthProvider>
        <Toaster position="top-center" />
        <Router>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="projects/:id" element={<ProjectEditor />} />
                <Route path="posts/:id" element={<PostEditor />} />
              </Route>

              {/* Catch all for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </LazyMotion>
  );
}

export default App;

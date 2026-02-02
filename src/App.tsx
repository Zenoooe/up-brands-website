import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { Toaster } from 'react-hot-toast';

// Admin Imports
import { AuthProvider } from './contexts/AuthContext';
import AdminLogin from './pages/admin/Login';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProjectEditor from './pages/admin/ProjectEditor';
import PostEditor from './pages/admin/PostEditor';

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
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

          {/* Catch all for 404 - redirect old routes to home or about */}
          <Route path="/services" element={<About />} />
          <Route path="/service/*" element={<About />} />
          <Route path="/company" element={<About />} />
          <Route path="/project/*" element={<Home />} />
          <Route path="/projects" element={<Home />} />
          <Route path="/gallery" element={<Home />} />
          <Route path="/store" element={<Home />} />
          <Route path="/detail_*" element={<Home />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

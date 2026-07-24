import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 fixed w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/admin" className="font-bold uppercase tracking-wider text-xl">
            Up-Brands CMS
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/admin" className="text-sm font-medium hover:text-gray-600">Dashboard</Link>
            <Link to="/" className="text-sm font-medium hover:text-gray-600" target="_blank">View Site</Link>
            <button 
              onClick={handleSignOut} 
              className="text-sm font-medium text-red-500 hover:text-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 container mx-auto px-4">
        <Outlet />
      </main>
    </div>
  );
}

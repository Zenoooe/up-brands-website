import { Navigate, Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    // Cycle: en -> zh-TW -> zh-CN -> en
    const currentLang = i18n.language;
    let newLang = 'en';

    if (currentLang.startsWith('en')) {
      newLang = 'zh-TW';
    } else if (currentLang.includes('TW') || currentLang.includes('Hant') || currentLang === 'zh-HK') {
      newLang = 'zh-CN';
    } else {
      newLang = 'en';
    }

    i18n.changeLanguage(newLang);
  };

  const getLangLabel = () => {
    const currentLang = i18n.language;

    if (currentLang.startsWith('en')) {
      return '繁';
    }
    if (currentLang.includes('TW') || currentLang.includes('Hant') || currentLang === 'zh-HK') {
      return '简';
    }
    return 'EN';
  };

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 fixed w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/admin" className="font-bold uppercase tracking-wider text-lg sm:text-xl whitespace-nowrap">
            Up-Brands CMS
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="/admin" className="text-sm font-medium hover:text-gray-600 whitespace-nowrap">{t('admin.nav.dashboard')}</Link>
            <Link to="/admin/posts" className="text-sm font-medium hover:text-gray-600 whitespace-nowrap">{t('admin.nav.blog')}</Link>
            <Link to="/" className="text-sm font-medium hover:text-gray-600 whitespace-nowrap" target="_blank">{t('admin.nav.viewSite')}</Link>
            <button
              onClick={toggleLanguage}
              className="text-sm font-medium px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 whitespace-nowrap"
            >
              {getLangLabel()}
            </button>
            <button 
              onClick={() => signOut()} 
              className="text-sm font-medium text-red-500 hover:text-red-700 whitespace-nowrap"
            >
              {t('admin.nav.signOut')}
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

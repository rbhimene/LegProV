import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppNav from './AppNav';
import ScrollToHash from './ScrollToHash';
import SessionWatcher from './SessionWatcher';
import Footer from '../components/Footer/Footer';

/** Frame shared by every page: navbar, content, footer. */
const AppLayout = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <a href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg">
        {t('common.skipToContent')}
      </a>
      <ScrollToHash />
      <SessionWatcher />
      <AppNav />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
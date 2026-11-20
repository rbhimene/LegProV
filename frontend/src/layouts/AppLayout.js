import { Outlet } from 'react-router-dom';
import AppNav from './AppNav';
import ScrollToHash from './ScrollToHash';
import Footer from '../components/Footer/Footer';

/** Frame shared by every page: navbar, content, footer. */
const AppLayout = () => (
  <div className="flex min-h-screen flex-col bg-bg text-text">
    <ScrollToHash />
    <AppNav />
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default AppLayout;
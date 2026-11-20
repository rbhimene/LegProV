import { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaBars, FaMoon, FaSun, FaTimes } from 'react-icons/fa';
import { ThemeContext } from '../contexts/theme';
import { LanguageContext } from '../contexts/language';
import { getUserInfo, logout, reset } from '../features/authSlice';
import { buttonClasses } from '../components/ui/Button';
import iconImage from '../icon.png';

/** The only navigation bar of the app. Content depends on whether a user is logged in. */
const AppNav = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [{ themeName, toggleTheme }] = useContext(ThemeContext);
  const { currentLanguage, switchLanguage } = useContext(LanguageContext);
  const { user, userInfo } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  // After a page reload the user info is empty: load it again.
  useEffect(() => {
    if (user && !userInfo.id) dispatch(getUserInfo());
  }, [user, userInfo.id, dispatch]);

  const close = () => setOpen(false);
  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    close();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-text'}`;
  const plainLink = 'text-sm font-medium text-muted transition-colors hover:text-text';

  const links = user ? (
    <>
      <NavLink to="/dashboard" end onClick={close} className={linkClass}>{t('nav.projects')}</NavLink>
      {userInfo.is_staff && (
        <NavLink to="/dashboard/user-management" onClick={close} className={linkClass}>{t('nav.users')}</NavLink>
      )}
    </>
  ) : (
    <>
      <Link to="/#samples" onClick={close} className={plainLink}>{t('nav.samples')}</Link>
      <Link to="/#contact" onClick={close} className={plainLink}>{t('nav.contact')}</Link>
    </>
  );

  const auth = user ? (
    <button type="button" onClick={handleLogout} className={buttonClasses('secondary', 'sm')}>
      {t('nav.logout')}
    </button>
  ) : (
    <>
      <Link to="/login" onClick={close} className={buttonClasses('ghost', 'sm')}>{t('nav.login')}</Link>
      <Link to="/register" onClick={close} className={buttonClasses('primary', 'sm')}>{t('register.title')}</Link>
    </>
  );

  const iconButton = 'rounded-lg p-2 text-muted hover:bg-bg hover:text-text';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-lg font-bold">
          <img src={iconImage} alt="" className="h-8 w-8 object-contain" />
          LegProV
        </Link>

        <nav className="hidden items-center gap-6 md:flex">{links}</nav>

        <div className="flex items-center gap-1">
          <button type="button" onClick={switchLanguage} className={`${iconButton} text-sm font-semibold`}
            aria-label="Language">
            {currentLanguage === 'en' ? 'EN' : 'FR'}
          </button>
          <button type="button" onClick={toggleTheme} className={iconButton} aria-label={t('nav.toggleTheme')}>
            {themeName === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          <div className="ml-2 hidden items-center gap-2 md:flex">{auth}</div>
          <button type="button" onClick={() => setOpen(!open)} className={`${iconButton} md:hidden`}
            aria-label={t('nav.toggleNav')} aria-expanded={open}>
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4 md:hidden">
          {links}
          <div className="flex gap-2">{auth}</div>
        </div>
      )}
    </header>
  );
};

export default AppNav;
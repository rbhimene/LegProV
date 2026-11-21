import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClasses } from '../ui/Button';

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t('notFound.title')}</h1>
      <p className="mt-2 text-muted">{t('notFound.text')}</p>
      <Link to="/" className={`${buttonClasses('primary', 'lg')} mt-8`}>{t('notFound.home')}</Link>
    </div>
  );
};

export default NotFound;
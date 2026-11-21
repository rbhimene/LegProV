import { useTranslation } from 'react-i18next';
import { REPO_URL } from '../../config';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border py-6 text-center text-sm text-muted">
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
        {`${t('footer.createdBy')} RABAHI & BADAOUI`}
      </a>
    </footer>
  );
};

export default Footer;
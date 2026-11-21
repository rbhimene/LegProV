import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBalanceScale, FaExternalLinkAlt, FaProjectDiagram, FaQuestionCircle } from 'react-icons/fa';
import { CONTACT_EMAIL, THESIS_URL } from './config';
import { SAMPLES } from './samples';
import { buttonClasses } from './components/ui/Button';

// Colours match the ones used to highlight errors in the verified diagram.
const FAMILIES = [
  { key: 'mi', icon: FaQuestionCircle, colour: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  { key: 's', icon: FaProjectDiagram, colour: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  { key: 'c', icon: FaBalanceScale, colour: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
];

const HomePage = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="space-y-20">
      <section className="py-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t('home.title')}<span className="text-primary">{t('home.highlight')}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg font-medium">{t('home.role')}</p>
        <p className="mx-auto mt-4 max-w-3xl text-muted">{t('home.description')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={user ? '/dashboard' : '/register'} className={buttonClasses('primary', 'lg')}>
            {t('home.ctaStart')}
          </Link>
          <a href={THESIS_URL} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary', 'lg')}>
            {t('home.thesis')}
          </a>
        </div>
      </section>

      <section>
        <h2 className="mb-8 text-center text-2xl font-bold">{t('home.familiesTitle')}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {FAMILIES.map(({ key, icon: Icon, colour }) => (
            <div key={key} className="rounded-2xl border border-border bg-surface p-6">
              <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl ${colour}`}>
                <Icon aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold">{t(`home.families.${key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted">{t(`home.families.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="samples" className="scroll-mt-24">
        <h2 className="mb-8 text-center text-2xl font-bold">{t('home.samplesTitle')}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {SAMPLES.map((sample) => (
            <Link key={sample.id} to={`/diagrams/${sample.id}`}
              className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-primary hover:shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t(`samples.${sample.id}.name`)}</h3>
                <FaExternalLinkAlt className="text-muted group-hover:text-primary" aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm text-muted">{t(`samples.${sample.id}.description`)}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {sample.stack.map((item) => (
                  <li key={item} className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-muted">{item}</li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 pb-6 text-center">
        <h2 className="mb-4 text-2xl font-bold">{t('home.contactTitle')}</h2>
        <a href={`mailto:${CONTACT_EMAIL}`} className={buttonClasses('secondary', 'lg')}>{t('home.emailMe')}</a>
      </section>
    </div>
  );
};

export default HomePage;
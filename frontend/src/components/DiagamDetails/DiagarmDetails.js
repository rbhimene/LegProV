import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaFileDownload } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import { buttonClasses } from '../ui/Button';
import DiagramViewer from '../ui/DiagramViewer';

/** One of the 3 example processes (files in media/3diagrams_example/<id>/). */
const DiagramDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const viewerRef = useRef(null);
  const [tab, setTab] = useState('original');
  const [failed, setFailed] = useState(false);
  const base = `${API_BASE_URL}/media/3diagrams_example/${id}`;

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    (async () => {
      try {
        const file = tab === 'verified' ? 'verified_diagram.bpmn' : 'Processus.bpmn';
        const response = await fetch(`${base}/${file}`);
        if (!response.ok) throw new Error('Failed to fetch the diagram');
        const xml = await response.text();
        if (!cancelled) await viewerRef.current.load(xml);
      } catch (e) {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [base, tab]);

  const tabClass = (name) =>
    'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
    (tab === name ? 'bg-primary text-primary-fg' : 'text-muted hover:bg-bg hover:text-text');

  return (
    <div>
      <Link to="/#samples" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text">
        <FaArrowLeft aria-hidden="true" /> {t('home.samplesTitle')}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{t(`samples.${id}.name`, { defaultValue: `#${id}` })}</h1>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          <button type="button" className={tabClass('original')} onClick={() => setTab('original')}>
            {t('samples.viewDiagram')}
          </button>
          <button type="button" className={tabClass('verified')} onClick={() => setTab('verified')}>
            {t('samples.viewVerified')}
          </button>
        </div>
        <div className="flex gap-2">
          <a href={`${base}/report.docx`} download className={buttonClasses('secondary', 'sm')}>
            <FaFileDownload aria-hidden="true" /> {t('verif.reportFr')}
          </a>
          <a href={`${base}/reportENG.docx`} download className={buttonClasses('secondary', 'sm')}>
            <FaFileDownload aria-hidden="true" /> {t('verif.reportEn')}
          </a>
        </div>
      </div>

      {failed && (
        <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {t('verif.errorLoad')}
        </p>
      )}
      <DiagramViewer ref={viewerRef} className="mt-4 h-[70vh] min-h-[420px]" />
    </div>
  );
};

export default DiagramDetails;
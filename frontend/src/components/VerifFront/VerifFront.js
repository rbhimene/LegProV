import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaFileDownload, FaFolderOpen, FaPlay, FaSyncAlt } from 'react-icons/fa';
import api from '../../api';
import { API_BASE_URL } from '../../config';
import Button, { buttonClasses } from '../ui/Button';
import DiagramViewer from '../ui/DiagramViewer';
import EmptyState from '../ui/EmptyState';
import ResultsPanel from './ResultsPanel';

const NO_FLAGS = { MI: [], S: [], C: [] };

/** Diagram viewer + verification: shows the diagram, runs the checks, lists the errors. */
const VerifFront = () => {
  const { t, i18n } = useTranslation();
  const { projectId, diagramId } = useParams();
  const viewerRef = useRef(null);
  const fileInputRef = useRef(null);
  const cursor = useRef({ MI: 0, S: 0, C: 0 });

  const [diagram, setDiagram] = useState(null);
  const [result, setResult] = useState(null);
  const [flagged, setFlagged] = useState(NO_FLAGS);
  const [localFile, setLocalFile] = useState(null);   // a file checked without being saved
  const [verifying, setVerifying] = useState(false);
  const [errorKey, setErrorKey] = useState('');        // translation key, so a language switch updates it

  const show = useCallback(async (xml) => {
    await viewerRef.current.load(xml);
    cursor.current = { MI: 0, S: 0, C: 0 };
    setFlagged(viewerRef.current.flagged());
  }, []);

  const showUrl = useCallback(async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch the diagram');
    await show(await response.text());
  }, [show]);

  /** Load the stored diagram, or its last verified version with the saved result. */
  const loadSaved = useCallback(async () => {
    setErrorKey('');
    try {
      const { data: d } = await api.get(`/api/projects/${projectId}/diagrams/${diagramId}/`);
      setDiagram(d);
      const last = await api.get(`/api/projects/${projectId}/diagrams/${diagramId}/result/`);
      const saved = last.status === 200 ? last.data : null;
      setResult(saved);
      await showUrl(saved
        ? `${API_BASE_URL}${saved.filename}?v=${encodeURIComponent(saved.verified_at)}`
        : d.file);
    } catch (e) {
      setErrorKey('verif.errorLoad');
    }
  }, [projectId, diagramId, showUrl]);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const handleLocalFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      await show(await file.text());
      setLocalFile(file);
      setResult(null);
      setErrorKey('');
    } catch (e) {
      setErrorKey('verif.errorLoad');
    }
  };

  const backToSaved = () => { setLocalFile(null); loadSaved(); };

  const runVerify = async () => {
    setVerifying(true);
    setErrorKey('');
    try {
      let data;
      if (localFile) {
        const form = new FormData();
        form.append('file', localFile);
        ({ data } = await api.post('/api/upload/verify/', form));
      } else {
        ({ data } = await api.post(`/api/projects/${projectId}/diagrams/${diagramId}/verify/`));
      }
      await showUrl(`${API_BASE_URL}${data.filename}?v=${Date.now()}`);  // coloured version
      setResult(data);
      toast.success(t('verif.done'));
    } catch (e) {
      setErrorKey('verif.errorVerify');
    } finally {
      setVerifying(false);
    }
  };

  /** Each click jumps to the next element highlighted with the colour of that error family. */
  const locate = (family) => {
    const ids = flagged[family];
    if (!ids.length) return;
    viewerRef.current.focus(ids[cursor.current[family] % ids.length]);
    cursor.current[family] += 1;
  };

  const isFrench = i18n.language.startsWith('fr');
  const errors = result ? (isFrench ? result.errors_fr : result.errors_en) || [] : [];
  const title = localFile ? localFile.name : diagram?.name || '…';

  return (
    <div>
      <Link to={`/dashboard/project/${projectId}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-text">
        <FaArrowLeft aria-hidden="true" /> {t('verif.backProject')}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {result
              ? t('verif.verifiedOn', { date: new Date(result.verified_at).toLocaleString(i18n.language) })
              : t('verif.notVerified')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".bpmn" className="hidden" onChange={handleLocalFile} />
          <Button variant="secondary" onClick={() => fileInputRef.current.click()}>
            <FaFolderOpen aria-hidden="true" /> {t('verif.checkLocal')}
          </Button>
          <Button onClick={runVerify} loading={verifying}>
            {!verifying && (result ? <FaSyncAlt aria-hidden="true" /> : <FaPlay aria-hidden="true" />)}
            {verifying ? t('verif.verifying') : t(result ? 'verif.reverify' : 'verif.runVerify')}
          </Button>
        </div>
      </div>

      {localFile && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <span className="text-muted">{t('verif.localBanner')}</span>
          <button type="button" onClick={backToSaved} className="font-medium text-primary hover:underline">
            {t('verif.backToSaved')}
          </button>
        </div>
      )}

      {errorKey && (
        <div role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {t(errorKey)}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <DiagramViewer ref={viewerRef} className="h-[70vh] min-h-[420px]" />

        <aside aria-busy={verifying}>
          <h2 className="mb-3 text-lg font-semibold">{t('verif.results')}</h2>
          {result ? (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <a href={`${API_BASE_URL}${result.report_url}`} download className={buttonClasses('secondary', 'sm')}>
                  <FaFileDownload aria-hidden="true" /> {t('verif.reportFr')}
                </a>
                <a href={`${API_BASE_URL}${result.report_url_en}`} download className={buttonClasses('secondary', 'sm')}>
                  <FaFileDownload aria-hidden="true" /> {t('verif.reportEn')}
                </a>
              </div>
              <ResultsPanel errors={errors} flagged={flagged} onLocate={locate} />
            </>
          ) : (
            <EmptyState title={t('verif.emptyTitle')} text={t('verif.emptyText')} />
          )}
        </aside>
      </div>
    </div>
  );
};

export default VerifFront;
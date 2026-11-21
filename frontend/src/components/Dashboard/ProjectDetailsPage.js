import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaDownload, FaPlus, FaProjectDiagram, FaTrash } from 'react-icons/fa';
import api from '../../api';
import { API_BASE_URL } from '../../config';
import Button, { buttonClasses } from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import UploadDiagramModal from './UploadDiagramModal';

/** Small coloured pill: green when verified, grey otherwise. */
const StatusBadge = ({ verified }) => {
  const { t } = useTranslation();
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' +
        (verified ? 'bg-success/10 text-success' : 'bg-bg text-muted')
      }
    >
      <span className={`h-1.5 w-1.5 rounded-full ${verified ? 'bg-success' : 'bg-muted'}`} />
      {verified ? t('project.statusVerified') : t('project.statusPending')}
    </span>
  );
};

/** One project: its diagrams (status, dates, open/verify, download, delete) and the upload modal. */
const ProjectDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [diagrams, setDiagrams] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, d] = await Promise.all([
        api.get(`/api/projects/${projectId}/`),
        api.get(`/api/projects/${projectId}/diagrams/`),
      ]);
      setProject(p.data);
      setDiagrams(d.data);
    } catch (e) {
      setError(t('project.errorFetch'));
      setDiagrams([]);
    }
  }, [projectId, t]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => [...(diagrams || [])].sort((a, b) => b.id - a.id), [diagrams]);
  const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString(i18n.language) : '—');

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/projects/${projectId}/diagrams/${toDelete.id}/`);
      setDiagrams((prev) => prev.filter((d) => d.id !== toDelete.id));
      toast.success(t('project.deleted'));
      setToDelete(null);
    } catch (e) {
      toast.error(t('project.errorDelete'));
    } finally {
      setDeleting(false);
    }
  };

  const iconButton = 'rounded-lg p-2 text-muted transition hover:bg-bg';

  return (
    <div>
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text">
        <FaArrowLeft aria-hidden="true" /> {t('project.back')}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold">{project ? project.name : '…'}</h1>
          {project && <p className="mt-1 max-w-2xl text-sm text-muted">{project.description}</p>}
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <FaPlus aria-hidden="true" /> {t('project.addDiagram')}
        </Button>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-6">
        {diagrams === null ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
            ))}
          </div>
        ) : rows.length === 0 && !error ? (
          <EmptyState
            icon={FaProjectDiagram}
            title={t('project.emptyTitle')}
            text={t('project.emptyText')}
            action={<Button onClick={() => setUploadOpen(true)}><FaPlus aria-hidden="true" /> {t('project.addDiagram')}</Button>}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('project.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('project.verified')}</th>
                  <th className="px-4 py-3 font-medium">{t('project.addedOn')}</th>
                  <th className="px-4 py-3 font-medium">{t('project.lastVerified')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('project.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-bg/60">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-medium">{d.name}</p>
                      <p className="truncate text-xs text-muted">{d.description}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge verified={d.verified} /></td>
                    <td className="px-4 py-3 text-muted">{formatDate(d.created_at)}</td>
                    <td className="px-4 py-3 text-muted">
                      {d.last_verified_at ? formatDate(d.last_verified_at) : t('project.never')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/dashboard/project/${projectId}/verify/${d.id}`} className={buttonClasses('primary', 'sm')}>
                          {t('project.verifyOpen')}
                        </Link>
                        <a href={`${API_BASE_URL}${d.file}`} download aria-label={t('project.download')}
                          className={`${iconButton} hover:text-primary`}>
                          <FaDownload />
                        </a>
                        <button type="button" onClick={() => setToDelete(d)} aria-label={t('common.delete')}
                          className={`${iconButton} hover:text-danger`}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadDiagramModal open={uploadOpen} projectId={projectId} onClose={() => setUploadOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('project.deleteTitle')}
        message={t('project.confirmDeleteNamed', { name: toDelete?.name })}
        confirmLabel={t('common.delete')}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default ProjectDetailsPage;
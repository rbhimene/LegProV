import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaFolderOpen, FaPlus, FaSearch } from 'react-icons/fa';
import api from '../../api';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import ProjectCard from './ProjectCard';
import ProjectFormModal from './ProjectFormModal';

/** Home of the logged-in area: list of the user's projects. */
const Dashboard = () => {
  const { t } = useTranslation();
  const { userInfo } = useSelector((state) => state.auth);

  const [projects, setProjects] = useState(null); // null = still loading
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);    // project being edited, or null = new
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/api/projects/');
      setProjects(data);
    } catch (e) {
      setError(t('projects.errorFetch'));
      setProjects([]);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  // Newest first, filtered by the search box.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...(projects || [])]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .filter((p) => !q || `${p.name} ${p.description}`.toLowerCase().includes(q));
  }, [projects, query]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (project) => { setEditing(project); setFormOpen(true); };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/projects/${toDelete.id}/`);
      setProjects((prev) => prev.filter((p) => p.id !== toDelete.id));
      toast.success(t('projects.deleted'));
      setToDelete(null);
    } catch (e) {
      toast.error(t('projects.errorDelete'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {t('dashboard.welcome')}{userInfo.first_name ? `, ${userInfo.first_name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted">{t('dashboard.subtitle')}</p>
        </div>
        <Button onClick={openNew}><FaPlus aria-hidden="true" /> {t('dashboard.newProject')}</Button>
      </div>

      <div className="relative mt-6 max-w-md">
        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('dashboard.searchPlaceholder')}
          aria-label={t('common.search')}
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-6">
        {projects === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        ) : projects.length === 0 && !error ? (
          <EmptyState
            icon={FaFolderOpen}
            title={t('dashboard.emptyTitle')}
            text={t('dashboard.emptyText')}
            action={<Button onClick={openNew}><FaPlus aria-hidden="true" /> {t('dashboard.newProject')}</Button>}
          />
        ) : visible.length === 0 && projects.length > 0 ? (
          <p className="py-10 text-center text-muted">{t('dashboard.noResults')}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((project) => (
              <ProjectCard key={project.id} project={project} onEdit={openEdit} onDelete={setToDelete} />
            ))}
          </div>
        )}
      </div>

      <ProjectFormModal
        open={formOpen}
        project={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('projects.deleteTitle')}
        message={t('projects.confirmDeleteNamed', { name: toDelete?.name })}
        confirmLabel={t('common.delete')}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default Dashboard;
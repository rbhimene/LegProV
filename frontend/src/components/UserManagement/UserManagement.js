import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch, FaTrash, FaUserCheck, FaUserSlash, FaUsers } from 'react-icons/fa';
import api from '../../api';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import CreateUserModal from './CreateUserModal';

/** Admin page (the backend also enforces it): list, search, create, (de)activate and delete users. */
const UserManagement = () => {
  const { t } = useTranslation();
  const { userInfo } = useSelector((state) => state.auth);

  const [users, setUsers] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/api/users/');
      setUsers(data);
    } catch (e) {
      setError(t('users.error'));
      setUsers([]);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users || []).filter(
      (u) => !q || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q));
  }, [users, query]);

  const toggleActive = async (user) => {
    try {
      const { data } = await api.post(`/api/users/${user.id}/toggle_active/`);
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      toast.success(t('users.updated'));
    } catch (e) {
      toast.error(e.response?.data?.detail || t('users.error'));
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/users/${toDelete.id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== toDelete.id));
      toast.success(t('users.deleted'));
      setToDelete(null);
    } catch (e) {
      toast.error(e.response?.data?.detail || t('users.error'));
    } finally {
      setDeleting(false);
    }
  };

  const iconButton = 'rounded-lg p-2 text-muted transition hover:bg-bg';

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('users.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('users.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><FaPlus aria-hidden="true" /> {t('users.addUser')}</Button>
      </div>

      <div className="relative mt-6 max-w-md">
        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t('users.searchPlaceholder')} aria-label={t('common.search')}
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-6">
        {users === null ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
            ))}
          </div>
        ) : users.length === 0 && !error ? (
          <EmptyState icon={FaUsers} title={t('users.emptyTitle')} />
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-muted">{t('users.noResults')}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('users.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('users.role')}</th>
                  <th className="px-4 py-3 font-medium">{t('users.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('users.projects')}</th>
                  <th className="px-4 py-3 font-medium">{t('users.completed')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((u) => {
                  const isMe = u.id === userInfo.id;
                  return (
                    <tr key={u.id} className="hover:bg-bg/60">
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {u.first_name} {u.last_name}
                          {isMe && <span className="ml-2 text-xs text-muted">({t('users.you')})</span>}
                        </p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.is_staff ? 'primary' : 'neutral'}>
                          {u.is_staff ? t('users.admin') : t('users.member')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.is_active ? 'success' : 'danger'}>
                          {u.is_active ? t('users.active') : t('users.inactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted">{u.num_projects}</td>
                      <td className="px-4 py-3 text-muted">{u.num_completed_projects}</td>
                      <td className="px-4 py-3">
                        {!isMe && (
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => toggleActive(u)}
                              aria-label={u.is_active ? t('users.deactivate') : t('users.activate')}
                              title={u.is_active ? t('users.deactivate') : t('users.activate')}
                              className={`${iconButton} hover:text-primary`}>
                              {u.is_active ? <FaUserSlash /> : <FaUserCheck />}
                            </button>
                            <button type="button" onClick={() => setToDelete(u)}
                              aria-label={t('common.delete')} className={`${iconButton} hover:text-danger`}>
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('users.deleteTitle')}
        message={t('users.confirmDeleteNamed', {
          name: `${toDelete?.first_name || ''} ${toDelete?.last_name || ''}`.trim(), email: toDelete?.email })}
        confirmLabel={t('common.delete')}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default UserManagement;
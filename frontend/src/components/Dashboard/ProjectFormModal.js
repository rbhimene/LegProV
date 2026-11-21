import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../api';
import { parseApiErrors } from '../../lib/forms';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Modal from '../ui/Modal';

const NAME_MAX = 100; // Project.name max_length in the backend

/** One modal for both creating (project = null) and editing a project. */
const ProjectFormModal = ({ open, project, onClose, onSaved }) => {
  const { t } = useTranslation();
  const editing = Boolean(project);
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Reset the form every time the modal opens.
  useEffect(() => {
    if (open) {
      setForm({ name: project?.name || '', description: project?.description || '' });
      setErrors({});
    }
  }, [open, project]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined, _form: undefined });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('validation.required');
    else if (form.name.length > NAME_MAX) e.name = t('validation.maxLength', { max: NAME_MAX });
    if (!form.description.trim()) e.description = t('validation.required');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const { data } = editing
        ? await api.put(`/api/projects/${project.id}/`, form)
        : await api.post('/api/projects/', form);
      toast.success(t(editing ? 'projects.updated' : 'projects.created'));
      onSaved(data);
      onClose();
    } catch (err) {
      setErrors(parseApiErrors(err, t('projects.errorSave')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t(editing ? 'projects.editTitle' : 'projects.createTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" form="project-form" loading={loading}>
            {t(editing ? 'common.save' : 'projects.submit')}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors._form && (
          <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors._form}
          </div>
        )}
        <Field label={t('projects.nameLabel').replace(/\s*:$/, '')} name="name" value={form.name}
          onChange={handleChange} error={errors.name} maxLength={NAME_MAX} autoFocus required />
        <Field as="textarea" rows={4} label={t('projects.descriptionLabel').replace(/\s*:$/, '')}
          name="description" value={form.description} onChange={handleChange}
          error={errors.description} required />
      </form>
    </Modal>
  );
};

export default ProjectFormModal;
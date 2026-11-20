import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../api';
import { parseApiErrors } from '../../lib/forms';
import Button from '../ui/Button';
import Field from '../ui/Field';
import FileDropzone from '../ui/FileDropzone';
import Modal from '../ui/Modal';

const NAME_MAX = 100;                  // Diagram.name max_length
const MAX_BYTES = 5 * 1024 * 1024;     // same limit as the backend

/** Modal to add a diagram to a project: drop a .bpmn file, name it, describe it. */
const UploadDiagramModal = ({ open, projectId, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', description: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: '', description: '' });
      setFile(null);
      setErrors({});
    }
  }, [open]);

  const fileError = (f) => {
    if (!f.name.toLowerCase().endsWith('.bpmn')) return t('project.onlyBpmn');
    if (f.size === 0) return t('project.emptyFile');
    if (f.size > MAX_BYTES) return t('project.tooLarge');
    return '';
  };

  const handleFile = (f) => {
    const problem = fileError(f);
    if (problem) {
      setFile(null);
      setErrors((prev) => ({ ...prev, file: problem }));
      return;
    }
    setFile(f);
    setErrors((prev) => ({ ...prev, file: undefined }));
    // Suggest a name from the file name if the user has not typed one.
    setForm((prev) => (prev.name ? prev : { ...prev, name: f.name.replace(/\.bpmn$/i, '').slice(0, NAME_MAX) }));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined, _form: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!file) found.file = t('project.selectFile');
    if (!form.name.trim()) found.name = t('validation.required');
    if (!form.description.trim()) found.description = t('validation.required');
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const data = new FormData();
    data.append('name', form.name.trim());
    data.append('description', form.description.trim());
    data.append('file', file);

    setLoading(true);
    try {
      await api.post(`/api/projects/${projectId}/create-diagrams/`, data);
      toast.success(t('project.created'));
      onSaved();
      onClose();
    } catch (err) {
      setErrors(parseApiErrors(err, t('project.errorCreate')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('project.uploadTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" form="diagram-form" loading={loading}>{t('project.create')}</Button>
        </>
      }
    >
      <form id="diagram-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors._form && (
          <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors._form}
          </div>
        )}
        <FileDropzone file={file} onFile={handleFile} accept=".bpmn" error={errors.file} />
        <Field label={t('project.diagramName')} name="name" value={form.name} onChange={handleChange}
          error={errors.name} maxLength={NAME_MAX} required />
        <Field as="textarea" rows={3} label={t('project.diagramDescription')} name="description"
          value={form.description} onChange={handleChange} error={errors.description} required />
      </form>
    </Modal>
  );
};

export default UploadDiagramModal;
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../api';
import { EMAIL_RE, parseApiErrors } from '../../lib/forms';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Modal from '../ui/Modal';

const EMPTY = { first_name: '', last_name: '', email: '', password: '', confirm: '' };
const MIN_PASSWORD = 8;

/** Admin: create an account (active immediately, with the chosen password). */
const CreateUserModal = ({ open, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setForm(EMPTY); setErrors({}); }
  }, [open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined, _form: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.first_name.trim()) found.first_name = t('validation.required');
    if (!form.last_name.trim()) found.last_name = t('validation.required');
    if (!form.email.trim()) found.email = t('validation.required');
    else if (!EMAIL_RE.test(form.email)) found.email = t('validation.email');
    if (!form.password) found.password = t('validation.required');
    else if (form.password.length < MIN_PASSWORD) found.password = t('validation.minLength', { min: MIN_PASSWORD });
    if (form.password !== form.confirm) found.confirm = t('validation.mismatch');
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const { first_name, last_name, email, password } = form;
      await api.post('/api/users/', { first_name, last_name, email, password });
      toast.success(t('users.created'));
      onSaved();
      onClose();
    } catch (err) {
      setErrors(parseApiErrors(err, t('users.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('users.createTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" form="user-form" loading={loading}>{t('users.create')}</Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors._form && (
          <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors._form}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('users.firstName')} name="first_name" value={form.first_name}
            onChange={handleChange} error={errors.first_name} autoFocus required />
          <Field label={t('users.lastName')} name="last_name" value={form.last_name}
            onChange={handleChange} error={errors.last_name} required />
        </div>
        <Field label={t('users.email')} type="email" name="email" value={form.email}
          onChange={handleChange} error={errors.email} required />
        <Field label={t('users.password')} type="password" name="password" value={form.password}
          onChange={handleChange} error={errors.password} autoComplete="new-password"
          hint={t('validation.minLength', { min: MIN_PASSWORD })} required />
        <Field label={t('users.confirmPassword')} type="password" name="confirm" value={form.confirm}
          onChange={handleChange} error={errors.confirm} autoComplete="new-password" required />
      </form>
    </Modal>
  );
};

export default CreateUserModal;
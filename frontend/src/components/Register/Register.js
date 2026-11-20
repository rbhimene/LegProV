import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config';
import { EMAIL_RE, parseApiErrors } from '../../lib/forms';
import Button from '../ui/Button';
import Field from '../ui/Field';

const EMPTY = { first_name: '', last_name: '', email: '', password: '', re_password: '' };
const MIN_PASSWORD = 8;

/** Public sign-up (Djoser: POST /api/v1/auth/users/). */
const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined, _form: undefined });
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = t('validation.required');
    if (!form.last_name.trim()) e.last_name = t('validation.required');
    if (!form.email.trim()) e.email = t('validation.required');
    else if (!EMAIL_RE.test(form.email)) e.email = t('validation.email');
    if (!form.password) e.password = t('validation.required');
    else if (form.password.length < MIN_PASSWORD) e.password = t('validation.minLength', { min: MIN_PASSWORD });
    if (form.password !== form.re_password) e.re_password = t('validation.mismatch');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/users/`, form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setErrors(parseApiErrors(err, t('register.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">{t('register.title')}</h1>

      {errors._form && (
        <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errors._form}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('register.firstName')} name="first_name" value={form.first_name}
            onChange={handleChange} error={errors.first_name} autoComplete="given-name" required />
          <Field label={t('register.lastName')} name="last_name" value={form.last_name}
            onChange={handleChange} error={errors.last_name} autoComplete="family-name" required />
        </div>
        <Field label={t('login.email')} type="email" name="email" value={form.email}
          onChange={handleChange} error={errors.email} autoComplete="email" required />
        <Field label={t('login.password')} type="password" name="password" value={form.password}
          onChange={handleChange} error={errors.password}
          hint={t('validation.minLength', { min: MIN_PASSWORD })} autoComplete="new-password" required />
        <Field label={t('register.confirmPassword')} type="password" name="re_password" value={form.re_password}
          onChange={handleChange} error={errors.re_password} autoComplete="new-password" required />
        <Button type="submit" loading={loading} className="w-full">{t('register.submit')}</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t('register.haveAccount')}{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">{t('login.signIn')}</Link>
      </p>
    </div>
  );
};

export default Register;
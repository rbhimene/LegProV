import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login, reset } from '../../features/authSlice';
import { EMAIL_RE } from '../../lib/forms';
import Button from '../ui/Button';
import Field from '../ui/Field';

const Login = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, isError } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  useEffect(() => {
    if (isError) {
      setErrors({ _form: t('login.errors.invalidCredentials') });
      dispatch(reset());
    }
  }, [isError, dispatch, t]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined, _form: undefined });
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = t('validation.required');
    else if (!EMAIL_RE.test(form.email)) e.email = t('validation.email');
    if (!form.password) e.password = t('validation.required');
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length === 0) dispatch(login(form));
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">{t('login.title')}</h1>

      {location.state?.registered && (
        <div role="status" className="mb-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {t('login.registered')}
        </div>
      )}
      {errors._form && (
        <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errors._form}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label={t('login.email')} type="email" name="email" value={form.email}
          onChange={handleChange} error={errors.email} autoComplete="email" required />
        <Field label={t('login.password')} type="password" name="password" value={form.password}
          onChange={handleChange} error={errors.password} autoComplete="current-password" required />
        <Button type="submit" loading={isLoading} className="w-full">{t('login.signIn')}</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t('login.noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">{t('register.title')}</Link>
      </p>
    </div>
  );
};

export default Login;
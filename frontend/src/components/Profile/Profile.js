import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../api';
import { getUserInfo } from '../../features/authSlice';
import { parseApiErrors } from '../../lib/forms';
import Button from '../ui/Button';
import Field from '../ui/Field';

const MIN_PASSWORD = 8;
const EMPTY_PASSWORDS = { current_password: '', new_password: '', re_new_password: '' };

const Card = ({ title, children }) => (
  <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
    <h2 className="mb-4 text-lg font-semibold">{title}</h2>
    {children}
  </section>
);

const FormError = ({ message }) => message && (
  <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
    {message}
  </div>
);

/** The user's own page: change names, change password. */
const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  const [names, setNames] = useState({ first_name: '', last_name: '' });
  const [nameErrors, setNameErrors] = useState({});
  const [savingNames, setSavingNames] = useState(false);

  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  // Fill the form once the user info is loaded.
  useEffect(() => {
    setNames({ first_name: userInfo.first_name || '', last_name: userInfo.last_name || '' });
  }, [userInfo.first_name, userInfo.last_name]);

  const saveNames = async (e) => {
    e.preventDefault();
    const found = {};
    if (!names.first_name.trim()) found.first_name = t('validation.required');
    if (!names.last_name.trim()) found.last_name = t('validation.required');
    setNameErrors(found);
    if (Object.keys(found).length > 0) return;

    setSavingNames(true);
    try {
      await api.patch('/api/v1/auth/users/me/', {
        first_name: names.first_name.trim(), last_name: names.last_name.trim() });
      dispatch(getUserInfo());
      toast.success(t('profile.saved'));
    } catch (err) {
      setNameErrors(parseApiErrors(err, t('profile.error')));
    } finally {
      setSavingNames(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const found = {};
    if (!passwords.current_password) found.current_password = t('validation.required');
    if (!passwords.new_password) found.new_password = t('validation.required');
    else if (passwords.new_password.length < MIN_PASSWORD) {
      found.new_password = t('validation.minLength', { min: MIN_PASSWORD });
    }
    if (passwords.new_password !== passwords.re_new_password) found.re_new_password = t('validation.mismatch');
    setPasswordErrors(found);
    if (Object.keys(found).length > 0) return;

    setSavingPassword(true);
    try {
      await api.post('/api/v1/auth/users/set_password/', passwords);
      setPasswords(EMPTY_PASSWORDS);
      toast.success(t('profile.passwordChanged'));
    } catch (err) {
      setPasswordErrors(parseApiErrors(err, t('profile.error')));
    } finally {
      setSavingPassword(false);
    }
  };

  const onNames = (e) => {
    setNames({ ...names, [e.target.name]: e.target.value });
    setNameErrors({ ...nameErrors, [e.target.name]: undefined, _form: undefined });
  };
  const onPasswords = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setPasswordErrors({ ...passwordErrors, [e.target.name]: undefined, _form: undefined });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
      <p className="mt-1 text-sm text-muted">{t('profile.subtitle')}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={t('profile.personal')}>
          <form onSubmit={saveNames} noValidate className="space-y-4">
            <FormError message={nameErrors._form} />
            <Field label={t('login.email')} value={userInfo.email || ''} disabled readOnly
              hint={t('profile.emailHint')} />
            <Field label={t('register.firstName')} name="first_name" value={names.first_name}
              onChange={onNames} error={nameErrors.first_name} maxLength={100} required />
            <Field label={t('register.lastName')} name="last_name" value={names.last_name}
              onChange={onNames} error={nameErrors.last_name} maxLength={100} required />
            <Button type="submit" loading={savingNames}>{t('profile.saveChanges')}</Button>
          </form>
        </Card>

        <Card title={t('profile.passwordTitle')}>
          <form onSubmit={changePassword} noValidate className="space-y-4">
            <FormError message={passwordErrors._form} />
            <Field label={t('profile.currentPassword')} type="password" name="current_password"
              value={passwords.current_password} onChange={onPasswords}
              error={passwordErrors.current_password} autoComplete="current-password" required />
            <Field label={t('profile.newPassword')} type="password" name="new_password"
              value={passwords.new_password} onChange={onPasswords} error={passwordErrors.new_password}
              hint={t('validation.minLength', { min: MIN_PASSWORD })} autoComplete="new-password" required />
            <Field label={t('profile.confirmNewPassword')} type="password" name="re_new_password"
              value={passwords.re_new_password} onChange={onPasswords}
              error={passwordErrors.re_new_password} autoComplete="new-password" required />
            <Button type="submit" loading={savingPassword}>{t('profile.changePassword')}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
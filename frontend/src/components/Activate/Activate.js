import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import { buttonClasses } from '../ui/Button';

/** Opened from the activation email (Djoser: POST /api/v1/auth/users/activation/). */
const Activate = () => {
  const { t } = useTranslation();
  const { uid, token } = useParams();
  const [state, setState] = useState('loading'); // loading | ok | error

  useEffect(() => {
    let cancelled = false;
    axios.post(`${API_BASE_URL}/api/v1/auth/users/activation/`, { uid, token })
      .then(() => !cancelled && setState('ok'))
      .catch(() => !cancelled && setState('error'));
    return () => { cancelled = true; };
  }, [uid, token]);

  const view = {
    loading: { Icon: FaSpinner, cls: 'animate-spin text-muted', text: t('activate.loading') },
    ok: { Icon: FaCheckCircle, cls: 'text-success', text: t('activate.success') },
    error: { Icon: FaExclamationCircle, cls: 'text-danger', text: t('activate.error') },
  }[state];

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">{t('activate.title')}</h1>
      <view.Icon className={`mx-auto mb-3 text-4xl ${view.cls}`} aria-hidden="true" />
      <p role="status" className="text-sm">{view.text}</p>
      {state !== 'loading' && (
        <Link to="/login" className={`${buttonClasses('primary')} mt-6`}>{t('login.signIn')}</Link>
      )}
    </div>
  );
};

export default Activate;
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { logout, reset } from '../features/authSlice';

/** When the session ends (see api.js), clear the state, tell the user and go to /login. */
const SessionWatcher = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const onExpired = () => {
      dispatch(logout());
      dispatch(reset());
      toast.info(t('session.expired'), { toastId: 'session-expired' });
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [dispatch, navigate, t]);

  return null;
};

export default SessionWatcher;
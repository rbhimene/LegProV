import { useTranslation } from 'react-i18next';
import Button from './Button';
import Modal from './Modal';

/** "Are you sure?" dialog, used for every delete. */
const ConfirmDialog = ({ open, title, message, confirmLabel, danger = true, loading = false, onConfirm, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel || t('common.confirm')}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
};

export default ConfirmDialog;
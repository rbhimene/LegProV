import { forwardRef, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * Form field: label + input + error/hint.
 *   <Field label="Email" type="email" value={v} onChange={...} error={errors.email} />
 * as="textarea" gives a text area. type="password" gets a show/hide button.
 */
const Field = forwardRef(function Field(
  { label, error, hint, as: Tag = 'input', className = '', ...props }, ref,
) {
  const { t } = useTranslation();
  const id = useId();
  const messageId = `${id}-msg`;
  const [visible, setVisible] = useState(false);
  const isPassword = props.type === 'password';

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {props.required && <span className="text-danger"> *</span>}
      </label>
      <div className="relative">
        <Tag
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={
            'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted ' +
            'focus:outline-none focus:ring-2 focus:ring-primary/40 ' +
            'focus:outline-none focus:ring-2 focus:ring-primary/40 ' +
            'disabled:cursor-not-allowed disabled:bg-bg disabled:text-muted ' +
            (isPassword ? 'pr-10 ' : '') +
            (error ? 'border-danger' : 'border-border')
          }
          {...props}
          type={isPassword && visible ? 'text' : props.type}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-text"
          >
            {visible ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <p id={messageId} className={`mt-1 text-sm ${error ? 'text-danger' : 'text-muted'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default Field;
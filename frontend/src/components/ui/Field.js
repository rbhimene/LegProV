import { forwardRef, useId } from 'react';

/**
 * Form field: label + input + error/hint.
 *   <Field label="Email" type="email" value={v} onChange={...} error={errors.email} />
 * Use as="textarea" for a text area.
 */
const Field = forwardRef(function Field(
  { label, error, hint, as: Tag = 'input', className = '', ...props }, ref,
) {
  const id = useId();
  const messageId = `${id}-msg`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {props.required && <span className="text-danger"> *</span>}
      </label>
      <Tag
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={
          'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted ' +
          'focus:outline-none focus:ring-2 focus:ring-primary/40 ' +
          (error ? 'border-danger' : 'border-border')
        }
        {...props}
      />
      {(error || hint) && (
        <p id={messageId} className={`mt-1 text-sm ${error ? 'text-danger' : 'text-muted'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default Field;
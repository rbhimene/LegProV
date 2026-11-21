/** Friendly message shown when a list is empty. `action` is an optional button. */
const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
    {Icon && <Icon className="mx-auto mb-4 text-4xl text-muted" aria-hidden="true" />}
    <h3 className="text-lg font-semibold">{title}</h3>
    {text && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{text}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default EmptyState;
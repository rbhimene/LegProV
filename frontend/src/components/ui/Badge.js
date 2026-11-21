const TONES = {
  neutral: 'bg-bg text-muted',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
};

/** Small coloured pill for statuses and roles. */
const Badge = ({ tone = 'neutral', children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]}`}>
    {children}
  </span>
);

export default Badge;
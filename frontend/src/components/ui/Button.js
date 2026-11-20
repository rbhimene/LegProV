import { FaSpinner } from 'react-icons/fa';

const VARIANTS = {
  primary: 'bg-primary text-primary-fg hover:opacity-90',
  secondary: 'border border-border bg-surface text-text hover:bg-bg',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost: 'text-muted hover:bg-bg hover:text-text',
};
const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

/** Same look for <button> and for router <Link>: <Link className={buttonClasses('primary')}>. */
export const buttonClasses = (variant = 'primary', size = 'md') =>
  `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition ` +
  `focus:outline-none focus:ring-2 focus:ring-primary/40 ` +
  `disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]}`;

/** Button with a loading state (spinner, disabled while loading). */
const Button = ({ variant, size, loading = false, disabled, className = '', children, ...props }) => (
  <button
    type="button"
    disabled={disabled || loading}
    className={`${buttonClasses(variant, size)} ${className}`}
    {...props}
  >
    {loading && <FaSpinner className="animate-spin" aria-hidden="true" />}
    {children}
  </button>
);

export default Button;
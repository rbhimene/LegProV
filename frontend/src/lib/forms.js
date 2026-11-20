export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Convert an axios error into { fieldName: "message", _form: "general message" }.
 * DRF/Djoser send {"email": ["..."], "password": ["..."], "detail": "..."}.
 */
export function parseApiErrors(err, fallback) {
  const data = err.response?.data;
  if (!data || typeof data !== 'object') return { _form: fallback };
  const out = {};
  Object.entries(data).forEach(([key, value]) => {
    const name = key === 'non_field_errors' || key === 'detail' ? '_form' : key;
    out[name] = [].concat(value).join(' ');
  });
  return out;
}
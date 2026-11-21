import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaCrosshairs } from 'react-icons/fa';

const FAMILIES = {
  MI: { label: 'verif.familyMi', badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-300', dot: 'bg-orange-400' },
  S: { label: 'verif.familyS', badge: 'bg-red-500/10 text-red-700 dark:text-red-300', dot: 'bg-red-400' },
  C: { label: 'verif.familyC', badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300', dot: 'bg-purple-400' },
};

/** Summary, family filter, "locate" legend and the list of errors. */
const ResultsPanel = ({ errors, flagged, onLocate }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('ALL');

  const counts = useMemo(() => {
    const c = { ALL: errors.length, MI: 0, S: 0, C: 0 };
    errors.forEach((e) => { if (c[e.family] !== undefined) c[e.family] += 1; });
    return c;
  }, [errors]);

  const visible = filter === 'ALL' ? errors : errors.filter((e) => e.family === filter);

  if (errors.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
        <FaCheckCircle className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>{t('verif.allClear')}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold">{t('verif.errorsFound', { count: errors.length })}</p>

      <div className="mt-3 flex flex-wrap gap-1.5" role="tablist">
        {['ALL', 'MI', 'S', 'C'].map((key) => (
          <button key={key} type="button" role="tab" aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={'rounded-full px-3 py-1 text-xs font-medium transition ' +
              (filter === key ? 'bg-primary text-primary-fg' : 'bg-bg text-muted hover:text-text')}>
            {key === 'ALL' ? t('verif.all') : t(FAMILIES[key].label)} · {counts[key]}
          </button>
        ))}
      </div>

      {Object.values(flagged).some((ids) => ids.length > 0) && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs text-muted">{t('verif.legend')}</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(FAMILIES).map(([key, f]) => flagged[key].length > 0 && (
              <button key={key} type="button" onClick={() => onLocate(key)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-bg">
                <span className={`h-2.5 w-2.5 rounded-sm ${f.dot}`} />
                {t(f.label)} ({flagged[key].length})
                <FaCrosshairs className="text-muted" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {visible.map((e, i) => (
          <li key={`${e.code}-${i}`} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${FAMILIES[e.family]?.badge}`}>{e.code}</span>
              <span className="text-sm font-medium">{e.type}</span>
            </div>
            {e.legal && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('verif.legal')}</p>
                <p className="mt-0.5 break-words text-sm">{e.legal}</p>
              </div>
            )}
            {e.recommendation && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('verif.recommendation')}</p>
                <p className="mt-0.5 break-words text-sm">{e.recommendation}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResultsPanel;
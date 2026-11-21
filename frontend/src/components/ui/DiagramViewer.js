import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaExpand, FaMinus, FaPlus } from 'react-icons/fa';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

// Stroke colours written by the backend (verification/bpmn_utils.py) -> error family.
const STROKE_FAMILY = { '#6b3c00': 'MI', '#831311': 'S', '#5b176d': 'C' };

/**
 * BPMN viewer with zoom buttons. The parent controls it through a ref:
 *   ref.current.load(xml)    show a diagram
 *   ref.current.flagged()    { MI: [ids], S: [ids], C: [ids] } elements coloured by the verification
 *   ref.current.focus(id)    highlight an element and scroll to it
 * The canvas stays white in dark mode: the error colours are designed for it.
 */
const DiagramViewer = forwardRef(function DiagramViewer({ className = '' }, ref) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    viewerRef.current = new NavigatedViewer({ container: containerRef.current });
    return () => viewerRef.current.destroy();
  }, []);

  const fit = () => viewerRef.current.get('canvas').zoom('fit-viewport', 'auto');

  useImperativeHandle(ref, () => ({
    async load(xml) {
      lastFocus.current = null;
      await viewerRef.current.importXML(xml);
      fit();
    },
    flagged() {
      const found = { MI: [], S: [], C: [] };
      viewerRef.current.get('elementRegistry').forEach((el) => {
        if (el.labelTarget || !el.di) return;
        const stroke = String(el.di.get('bioc:stroke') || '').toLowerCase();
        if (STROKE_FAMILY[stroke]) found[STROKE_FAMILY[stroke]].push(el.id);
      });
      return found;
    },
    focus(id) {
      const canvas = viewerRef.current.get('canvas');
      if (lastFocus.current) canvas.removeMarker(lastFocus.current, 'verif-focus');
      canvas.addMarker(id, 'verif-focus');
      canvas.scrollToElement(id);
      lastFocus.current = id;
    },
  }));

  const tool = 'flex h-9 w-9 items-center justify-center text-muted hover:bg-bg hover:text-text';

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-white ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute right-3 top-3 flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow">
        <button type="button" className={tool} aria-label={t('verif.zoomIn')}
          onClick={() => viewerRef.current.get('zoomScroll').stepZoom(1)}><FaPlus /></button>
        <button type="button" className={tool} aria-label={t('verif.zoomOut')}
          onClick={() => viewerRef.current.get('zoomScroll').stepZoom(-1)}><FaMinus /></button>
        <button type="button" className={tool} aria-label={t('verif.fit')} onClick={fit}><FaExpand /></button>
      </div>
    </div>
  );
});

export default DiagramViewer;
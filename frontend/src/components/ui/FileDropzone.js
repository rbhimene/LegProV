import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFileCode, FaFileUpload } from 'react-icons/fa';

/**
 * Drag-and-drop file picker (also works with click and keyboard).
 * The parent validates the file in `onFile` and passes `error` back.
 */
const FileDropzone = ({ file, onFile, accept, error }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const open = () => inputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFile(dropped);
  };

  const handleInput = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = ''; // lets the user pick the same file again
    if (picked) onFile(picked);
  };

  const Icon = file ? FaFileCode : FaFileUpload;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={
          'flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ' +
          'focus:outline-none focus:ring-2 focus:ring-primary/40 ' +
          (dragging ? 'border-primary bg-primary/5 ' : error ? 'border-danger ' : 'border-border hover:border-primary ')
        }
      >
        <Icon className={`mb-2 text-3xl ${file ? 'text-primary' : 'text-muted'}`} aria-hidden="true" />
        {file ? (
          <>
            <p className="break-all text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB · {t('project.replaceFile')}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">{t('project.dropHere')}</p>
            <p className="text-xs text-muted">{t('project.dropOr')}</p>
          </>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={handleInput} className="hidden" tabIndex={-1} />
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export default FileDropzone;
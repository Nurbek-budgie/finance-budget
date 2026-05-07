import { useRef, useState } from 'react';
import styles from './DropZone.module.css';

interface Props {
  onFile: (file: File) => void;
  isUploading: boolean;
}

export default function DropZone({ onFile, isUploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (!file.name.match(/\.(csv|CSV|xlsx|XLSX|xls|XLS)$/)) {
      alert('Only CSV or Excel (.xlsx) files are supported.');
      return;
    }
    onFile(file);
  }

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.over : ''} ${isUploading ? styles.uploading : ''}`}
      onClick={() => !isUploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className={styles.hidden}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className={styles.ico}>
        {isUploading ? (
          <span className={styles.spinner} />
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
        )}
      </div>

      <p className={styles.primary}>
        {isUploading ? 'Uploading…' : 'Drop your file here'}
      </p>
      <p className={styles.secondary}>
        {isUploading ? 'Processing your transactions' : 'or click to browse · max 50 MB per file'}
      </p>

      {!isUploading && (
        <>
          <div className={styles.formats}>
            <span>CSV</span>
            <span>Excel</span>
          </div>
          <button
            className={styles.chooseBtn}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            Choose file
          </button>
        </>
      )}
    </div>
  );
}

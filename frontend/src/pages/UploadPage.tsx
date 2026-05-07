import { useState, useEffect } from 'react';
import { useUploadCSV, useStagedTransactions, useApproveStaged, useRejectStaged } from '../hooks/useTransactions';
import type { UploadResult } from '../types';
import DropZone from '../components/transactions/DropZone/DropZone';
import StagedReviewTable from '../components/transactions/StagedReviewTable/StagedReviewTable';
import styles from './UploadPage.module.css';

interface UploadRecord {
  filename: string;
  result: UploadResult;
}

const HISTORY_KEY = 'upload-history';
const MAX_HISTORY = 20;

export default function UploadPage() {
  const [history, setHistory] = useState<UploadRecord[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as UploadRecord[]) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const uploadMutation = useUploadCSV();
  const { data: staged = [] } = useStagedTransactions();
  const approveMutation = useApproveStaged();
  const rejectMutation = useRejectStaged();

  function handleFile(file: File) {
    uploadMutation.mutate(file, {
      onSuccess: (result) => {
        setHistory(prev => [{ filename: file.name, result }, ...prev].slice(0, MAX_HISTORY));
      },
    });
  }

  const pending = staged.filter(s => s.status === 'pending');

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Upload <em>a statement.</em></h1>
          <p className={styles.sub}>Files are parsed locally — nothing leaves this device.</p>
        </div>
      </div>

      <DropZone onFile={handleFile} isUploading={uploadMutation.isPending} />

      {uploadMutation.isError && (
        <div className={styles.errorBanner}>
          Upload failed — check the file format and try again.
        </div>
      )}

      {pending.length > 0 && (
        <StagedReviewTable
          staged={staged}
          onApprove={(ids, approveAll) => approveMutation.mutate({ ids, approve_all: approveAll })}
          onReject={(ids) => rejectMutation.mutate(ids)}
          isApproving={approveMutation.isPending}
          isRejecting={rejectMutation.isPending}
        />
      )}

      {history.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.historyHead}>
            <span className={styles.sectionTitle}>Recent uploads</span>
          </div>
          <div className={styles.historyList}>
            {history.map((rec, i) => (
              <div key={i} className={styles.historyRow}>
                <div className={styles.fileIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{rec.filename}</span>
                  <span className={styles.fileMeta}>
                    {rec.result.committed} committed · {rec.result.staged} staged · {rec.result.skipped_duplicates} skipped
                  </span>
                  {rec.result.errors.length > 0 && (
                    <span className={styles.fileErrors}>{rec.result.errors.length} error(s)</span>
                  )}
                </div>
                <span className={styles.parsedBadge}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  parsed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

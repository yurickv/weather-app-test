import type { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  mode: 'confirm' | 'alert';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
}

export default function Modal({ open, title, children, mode, confirmLabel = 'OK', cancelLabel = 'Cancel', onConfirm, onCancel }: ModalProps) {
  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onCancel} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        {children && <div>{children}</div>}
        <div className={styles.actions}>
          {mode === 'confirm' ? (
            <>
              <button className={styles.btn} onClick={onCancel}>{cancelLabel}</button>
              <button className={`${styles.btn} ${styles.confirm}`} onClick={onConfirm}>{confirmLabel}</button>
            </>
          ) : (
            <button className={`${styles.btn} ${styles.confirm}`} onClick={onCancel}>{confirmLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';

// ── Badge ──────────────────────────────────────────────────────────
const STATUS_CLASS = {
  'New Enquiry': 'badge-new-enquiry',
  'Contacted': 'badge-contacted',
  'Counselling Scheduled': 'badge-counselling-scheduled',
  'Document Submitted': 'badge-document-submitted',
  'Admitted': 'badge-admitted',
  'Rejected': 'badge-rejected',
  'Not Interested': 'badge-not-interested',
};

export const Badge = ({ status }) => (
  <span className={`badge ${STATUS_CLASS[status] || ''}`}>{status}</span>
);

// ── Modal ──────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer, size = '' }) => {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <div>
            {typeof title === 'string'
              ? <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700 }}>{title}</h3>
              : title}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ── Spinner ────────────────────────────────────────────────────────
export const Spinner = ({ size = 20 }) => (
  <div className="spinner" style={{ width: size, height: size }} />
);

export const PageLoader = () => (
  <div className="page-loading"><Spinner size={32} /></div>
);

// ── Empty state ────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', text = 'No data found' }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <div className="empty-state-text">{text}</div>
  </div>
);

// ── Confirm dialog ─────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, danger }) => (
  <Modal open={open} onClose={onClose} title={title} size="modal-sm"
    footer={
      <>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirm</button>
      </>
    }
  >
    <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{message}</p>
  </Modal>
);

// ── Pagination ─────────────────────────────────────────────────────
export const Pagination = ({ page, totalPages, total, limit, onPageChange }) => {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>
      <span>Showing {start}–{end} of {total}</span>
      <div className="flex gap-2">
        <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
        <span style={{ padding: '5px 10px', fontSize: 12 }}>Page {page} of {totalPages}</span>
        <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
      </div>
    </div>
  );
};

// ── Search input ───────────────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder = 'Search…' }) => (
  <div style={{ position: 'relative' }}>
    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14 }}>🔍</span>
    <input className="form-input" style={{ paddingLeft: 32, maxWidth: 280 }}
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

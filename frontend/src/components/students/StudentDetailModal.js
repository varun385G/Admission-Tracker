import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Modal, Badge, ConfirmDialog } from '../ui';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PIPELINE = ['New Enquiry','Contacted','Counselling Scheduled','Document Submitted','Admitted'];
const STATUSES = [...PIPELINE, 'Rejected', 'Not Interested'];

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '9px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
      <div style={{ width: 160, fontSize: 11, color: 'var(--text2)', flexShrink: 0, paddingTop: 2, textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

export default function StudentDetailModal({ open, onClose, studentId, onEdit, onDeleted }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => api.get(`/students/${studentId}`).then(r => r.data.student),
    enabled: !!studentId && open,
  });

  const { data: notesData } = useQuery({
    queryKey: ['notes', studentId],
    queryFn: () => api.get(`/notes/student/${studentId}`).then(r => r.data.notes),
    enabled: !!studentId && open,
  });

  const statusMut = useMutation({
    mutationFn: (status) => api.put(`/students/${studentId}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', studentId] });
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['reports-overview'] });
      toast.success('Status updated');
    },
  });

  const noteMut = useMutation({
    mutationFn: (note_text) => api.post('/notes', { student_id: studentId, note_text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', studentId] });
      setNoteText('');
      toast.success('Note added');
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/students/${studentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['reports-overview'] });
      toast.success('Student deleted');
      onDeleted?.();
      onClose();
    },
  });

  const s = studentData;
  const notes = notesData || [];
  const pipelineIdx = PIPELINE.indexOf(s?.status);

  const quickAdvance = () => {
    if (pipelineIdx >= 0 && pipelineIdx < PIPELINE.length - 1) {
      statusMut.mutate(PIPELINE[pipelineIdx + 1]);
    } else {
      toast('Already at final stage');
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="modal-lg"
        title={
          <div>
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700 }}>{s?.name || '…'}</h3>
            {s && <Badge status={s.status} />}
          </div>
        }
        footer={
          isAdmin ? (
            <>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
              <button className="btn btn-outline btn-sm" onClick={() => { onEdit(s); onClose(); }}>Edit</button>
              <select className="form-select" style={{ width: 180, fontSize: 12, padding: '5px 10px' }}
                value={s?.status || ''} onChange={e => statusMut.mutate(e.target.value)}>
                {STATUSES.map(st => <option key={st}>{st}</option>)}
              </select>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={quickAdvance}>Advance Status →</button>
          )
        }
      >
        {isLoading ? (
          <div className="page-loading" style={{ minHeight: 200 }}>Loading…</div>
        ) : s ? (
          <>
            {/* Pipeline */}
            <div className="pipeline">
              {PIPELINE.map((step, i) => (
                <div key={step} className={`pipeline-step ${i < pipelineIdx ? 'done' : i === pipelineIdx ? 'current' : ''}`}
                  onClick={() => isAdmin && statusMut.mutate(step)} title={step}>
                  {step}
                </div>
              ))}
            </div>

            {/* Details */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
              <DetailRow label="Email" value={s.email} />
              <DetailRow label="Phone" value={s.phone} />
              <DetailRow label="Course" value={s.course_interested} />
              <DetailRow label="12th %" value={s.twelfth_percentage} />
              <DetailRow label="Entrance Score" value={s.entrance_score} />
              <DetailRow label="Lead Source" value={s.lead_source} />
              <DetailRow label="Assigned Staff" value={s.staff_name} />
              <DetailRow label="Next Follow-up" value={s.next_followup_date?.split('T')[0]} />
              <DetailRow label="Counselling Date" value={s.counselling_date?.split('T')[0]} />
              <DetailRow label="Enrolled on" value={new Date(s.created_at).toLocaleDateString()} />
            </div>

            {/* Notes */}
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text2)', marginBottom: 12 }}>Call Log & Notes</h4>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0 16px', marginBottom: 12, maxHeight: 220, overflowY: 'auto' }}>
              {notes.length === 0
                ? <p style={{ padding: '16px 0', color: 'var(--text3)', fontSize: 13 }}>No notes yet</p>
                : notes.map(n => (
                  <div key={n.id} className="note-item">
                    <div className="note-meta">
                      <span className="note-author">{n.author_name}</span>
                      <span className="note-time">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <div className="note-text">{n.note_text}</div>
                  </div>
                ))
              }
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" style={{ flex: 1 }} value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && noteText.trim() && noteMut.mutate(noteText)}
                placeholder="Add a call log or note… (Enter to submit)" />
              <button className="btn btn-primary btn-sm" onClick={() => noteText.trim() && noteMut.mutate(noteText)} disabled={noteMut.isPending}>
                Add
              </button>
            </div>
          </>
        ) : null}
      </Modal>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); deleteMut.mutate(); }}
        title="Delete Student" danger
        message={`Are you sure you want to delete "${s?.name}"? This action cannot be undone.`}
      />
    </>
  );
}

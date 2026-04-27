import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Badge, SearchInput, Pagination, EmptyState, PageLoader } from '../components/ui';
import StudentFormModal from '../components/students/StudentFormModal';
import StudentDetailModal from '../components/students/StudentDetailModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUSES = ['New Enquiry','Contacted','Counselling Scheduled','Document Submitted','Admitted','Rejected','Not Interested'];

export default function StudentsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [bulkStatus, setBulkStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['students', filters],
    queryFn: () => api.get('/students', {
      params: { page: filters.page, limit: 15, search: filters.search || undefined, status: filters.status || undefined }
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const bulkMut = useMutation({
    mutationFn: ({ ids, status }) => api.post('/students/bulk-status', { ids, status }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['reports-overview'] });
      toast.success(`Updated ${selectedIds.length} students to "${status}"`);
      setSelectedIds([]);
      setBulkStatus('');
    },
    onError: () => toast.error('Bulk update failed'),
  });

  const setFilter = useCallback((key, val) => {
    setFilters(f => ({ ...f, [key]: val, page: 1 }));
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const toggleAll = () => {
    const allIds = (data?.students || []).map(s => s.id);
    setSelectedIds(ids => ids.length === allIds.length ? [] : allIds);
  };

  const handleExport = async () => {
    const res = await api.get('/students/export/csv', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url; a.download = 'students.csv'; a.click();
    toast.success('CSV exported');
  };

  const students = data?.students || [];
  const pagination = data?.pagination;

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchInput value={filters.search} onChange={v => setFilter('search', v)} placeholder="Search name, email, phone, app. no…" />
        <select className="form-select" style={{ width: 180 }} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {isAdmin && <button className="btn btn-outline btn-sm" onClick={handleExport}>⬇ Export CSV</button>}
          {/* Both admin and staff can add students */}
          <button className="btn btn-primary btn-sm" onClick={() => { setEditStudent(null); setFormOpen(true); }}>+ Add Student</button>
        </div>
      </div>

      {/* Bulk actions - admin only */}
      {isAdmin && selectedIds.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--primary-light)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--primary)' }}>{selectedIds.length} selected</span>
          <select className="form-select" style={{ width: 200 }} value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
            <option value="">Change status to…</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" disabled={!bulkStatus || bulkMut.isPending}
            onClick={() => bulkMut.mutate({ ids: selectedIds, status: bulkStatus })}>
            Apply
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="card">
        {isLoading ? <PageLoader /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {isAdmin && <th><input type="checkbox" checked={selectedIds.length === students.length && students.length > 0} onChange={toggleAll} /></th>}
                    <th>#</th>
                    <th>Name</th>
                    <th>App. No</th>
                    <th>Status</th>
                    <th>Phone</th>
                    {isAdmin && <th>Staff</th>}
                    <th>Follow-up</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={9}><EmptyState icon="👥" text="No students found" /></td></tr>
                  ) : students.map((s, i) => (
                    <tr key={s.id} className="clickable" onClick={() => setDetailId(s.id)}>
                      {isAdmin && <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} /></td>}
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{((filters.page - 1) * 15) + i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 12 }}>{s.application_number || '—'}</td>
                      <td><Badge status={s.status} /></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.phone}</td>
                      {isAdmin && <td style={{ fontSize: 12, color: 'var(--text2)' }}>{s.staff_name || '—'}</td>}
                      <td style={{ fontSize: 12, color: s.next_followup_date ? 'var(--warning)' : 'var(--text3)' }}>
                        {s.next_followup_date?.split('T')[0] || '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && (
              <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={15}
                onPageChange={(p) => setFilters(f => ({ ...f, page: p }))} />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <StudentFormModal open={formOpen} onClose={() => setFormOpen(false)} student={editStudent} />
      <StudentDetailModal open={!!detailId} onClose={() => setDetailId(null)} studentId={detailId}
        onEdit={(s) => { setEditStudent(s); setFormOpen(true); }}
        onDeleted={() => setDetailId(null)} />
    </div>
  );
}
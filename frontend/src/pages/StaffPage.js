import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Modal, ConfirmDialog, PageLoader, EmptyState } from '../components/ui';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', department: '', role: 'staff' };

function StaffFormModal({ open, onClose, user }) {
  const qc = useQueryClient();
  const isEdit = !!user;
  const [form, setForm] = useState(EMPTY_FORM);

  React.useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', password: '', phone: user.phone || '', department: user.department || '', role: user.role || 'staff' });
    else setForm(EMPTY_FORM);
  }, [user, open]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/users/${user.id}`, data) : api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(isEdit ? 'Staff updated' : 'Staff added');
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Staff' : 'Add Staff'} size="modal-sm"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Staff name" />
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@college.com" />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number" />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <input className="form-input" value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Engineering" />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{isEdit ? 'New Password (optional)' : 'Password *'}</label>
          <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)}
            placeholder={isEdit ? 'Leave blank to keep' : 'Min 8 chars, A-Z, 0-9, !@#'} />
        </div>
      </div>
    </Modal>
  );
}

export default function StaffPage() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.users),
  });

  const toggleMut = useMutation({
    mutationFn: (id) => api.patch(`/users/${id}/toggle-active`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Status updated'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Staff deleted'); setConfirmDelete(null); },
    onError: () => toast.error('Cannot delete this user'),
  });

  const users = data || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditUser(null); setFormOpen(true); }}>+ Add Staff</button>
      </div>

      <div className="card">
        {isLoading ? <PageLoader /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Students</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon="👤" text="No staff found" /></td></tr>
                ) : users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{u.email}</td>
                    <td style={{ color: 'var(--text2)' }}>{u.department || '—'}</td>
                    <td>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: u.role === 'admin' ? 'var(--primary-light)' : 'var(--surface2)', color: u.role === 'admin' ? 'var(--primary)' : 'var(--text2)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{u.student_count || 0}</td>
                    <td>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: u.is_active ? 'var(--success-light)' : 'var(--danger-light)', color: u.is_active ? 'var(--success)' : 'var(--danger)' }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => { setEditUser(u); setFormOpen(true); }}>Edit</button>
                        <button className="btn btn-outline btn-sm" onClick={() => toggleMut.mutate(u.id)}>{u.is_active ? 'Deactivate' : 'Activate'}</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(u)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StaffFormModal open={formOpen} onClose={() => setFormOpen(false)} user={editUser} />
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => deleteMut.mutate(confirmDelete?.id)}
        title="Delete Staff Member" danger
        message={`Delete "${confirmDelete?.name}"? Their assigned students will become unassigned.`}
      />
    </div>
  );
}

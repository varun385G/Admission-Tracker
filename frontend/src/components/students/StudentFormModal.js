import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Modal } from '../ui';
import toast from 'react-hot-toast';

const STATUSES = ['New Enquiry','Contacted','Counselling Scheduled','Document Submitted','Admitted','Rejected','Not Interested'];
const SOURCES  = ['Walk-in','Online','Agent','Friend','Social Media','Newspaper','TV Ad'];
const GENDERS  = ['Male','Female','Other'];
const DEFAULT_SUBJECTS = ['Tamil','English','Mathematics','Physics','Chemistry','Biology','Computer Science'];

const makeEmpty = () => ({
  name: '', email: '', phone: '', alt_phone: '',
  application_number: '', gender: '', aadhar_no: '',
  community: '', caste: '',
  status: 'New Enquiry', assigned_staff_id: '',
  twelfth_percentage: '', total_score: '', obtained_score: '',
  subject_marks: DEFAULT_SUBJECTS.map(s => ({ subject: s, max_mark: '', obtained_mark: '' })),
  counselling_date: '', applied_date: '', submitted_date: '',
  next_followup_date: '', lead_source: 'Walk-in', notes: '',
});

export default function StudentFormModal({ open, onClose, student }) {
  const qc = useQueryClient();
  const isEdit = !!student;
  const [form, setForm] = useState(makeEmpty());

  useEffect(() => {
    if (student) {
      const sm = Array.isArray(student.subject_marks) && student.subject_marks.length > 0
        ? student.subject_marks.map(s => ({
            subject: s.subject || '',
            max_mark: s.max_mark ?? '',
            obtained_mark: s.obtained_mark ?? '',
          }))
        : DEFAULT_SUBJECTS.map(s => ({ subject: s, max_mark: '', obtained_mark: '' }));

      setForm({
        name:               student.name || '',
        email:              student.email || '',
        phone:              student.phone || '',
        alt_phone:          student.alt_phone || '',
        application_number: student.application_number || '',
        gender:             student.gender || '',
        aadhar_no:          student.aadhar_no || '',
        community:          student.community || '',
        caste:              student.caste || '',
        status:             student.status || 'New Enquiry',
        assigned_staff_id:  student.assigned_staff_id?._id || student.assigned_staff_id || '',
        twelfth_percentage: student.twelfth_percentage ?? '',
        total_score:        student.total_score ?? '',
        obtained_score:     student.obtained_score ?? '',
        subject_marks:      sm,
        counselling_date:   student.counselling_date?.slice(0,10) || '',
        applied_date:       student.applied_date?.slice(0,10) || '',
        submitted_date:     student.submitted_date?.slice(0,10) || '',
        next_followup_date: student.next_followup_date?.slice(0,10) || '',
        lead_source:        student.lead_source || 'Walk-in',
        notes:              student.notes || '',
      });
    } else {
      setForm(makeEmpty());
    }
  }, [student, open]);

  const { data: staffData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.users.filter(u => u.is_active)),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/students/${student._id || student.id}`, data)
      : api.post('/students', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['reports-overview'] });
      toast.success(isEdit ? 'Student updated!' : 'Student added!');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to save student');
    },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const getMarks = () => Array.isArray(form.subject_marks) ? form.subject_marks : [];

  const setMark = (i, key, val) => {
    const updated = [...getMarks()];
    updated[i] = { ...updated[i], [key]: val };
    setForm(f => ({ ...f, subject_marks: updated }));
  };

  const addSubject = () => setForm(f => ({
    ...f, subject_marks: [...getMarks(), { subject: '', max_mark: '', obtained_mark: '' }]
  }));

  const removeSubject = (i) => setForm(f => ({
    ...f, subject_marks: getMarks().filter((_, idx) => idx !== i)
  }));

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.email.trim()) return toast.error('Email is required');
    if (!form.phone.trim()) return toast.error('Phone is required');
    mutation.mutate({
      ...form,
      twelfth_percentage: form.twelfth_percentage !== '' ? form.twelfth_percentage : undefined,
      total_score:        form.total_score !== '' ? form.total_score : undefined,
      obtained_score:     form.obtained_score !== '' ? form.obtained_score : undefined,
      assigned_staff_id:  form.assigned_staff_id || null,
      subject_marks:      getMarks().filter(s => s.subject.trim() !== ''),
    });
  };

  const sec = (title) => (
    <div style={{ fontSize:11, fontWeight:700, color:'#0ea5e9', textTransform:'uppercase', letterSpacing:'0.08em', margin:'8px 0 12px', paddingBottom:6, borderBottom:'1.5px solid #e0f2fe' }}>
      {title}
    </div>
  );

  const F = ({ label, required, children }) => (
    <div className="form-group">
      <label className="form-label">{label}{required && <span style={{color:'#ef4444'}}> *</span>}</label>
      {children}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Student' : 'Add New Student'}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Student'}
          </button>
        </>
      }
    >
      {sec('Personal Information')}
      <div className="grid-2">
        <F label="Full Name" required>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Student full name" />
        </F>
        <F label="Email" required>
          <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@email.com" />
        </F>
        <F label="Phone" required>
          <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile" maxLength={10} />
        </F>
        <F label="Alternative Mobile">
          <input className="form-input" value={form.alt_phone} onChange={e => set('alt_phone', e.target.value)} placeholder="Alternative number" maxLength={10} />
        </F>
        <F label="Gender">
          <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">Select gender</option>
            {GENDERS.map(g => <option key={g}>{g}</option>)}
          </select>
        </F>
        <F label="Application Number">
          <input className="form-input" value={form.application_number} onChange={e => set('application_number', e.target.value)} placeholder="Application number" />
        </F>
        <F label="Aadhar Number">
          <input className="form-input" value={form.aadhar_no} onChange={e => set('aadhar_no', e.target.value)} placeholder="12-digit Aadhar" maxLength={12} />
        </F>
        <F label="Community">
          <input className="form-input" value={form.community} onChange={e => set('community', e.target.value)} placeholder="e.g. OBC, SC, ST, General" />
        </F>
        <F label="Caste">
          <input className="form-input" value={form.caste} onChange={e => set('caste', e.target.value)} placeholder="Caste name" />
        </F>
        <F label="Lead Source">
          <select className="form-select" value={form.lead_source} onChange={e => set('lead_source', e.target.value)}>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </F>
      </div>

      {sec('Academic Details')}
      <div className="grid-2">
        <F label="12th Percentage">
          <input className="form-input" type="number" step="0.01" min="0" max="100" value={form.twelfth_percentage} onChange={e => set('twelfth_percentage', e.target.value)} placeholder="e.g. 85.50" />
        </F>
        <F label="Total Score">
          <input className="form-input" type="number" min="0" value={form.total_score} onChange={e => set('total_score', e.target.value)} placeholder="Max total score" />
        </F>
        <F label="Obtained Score">
          <input className="form-input" type="number" min="0" value={form.obtained_score} onChange={e => set('obtained_score', e.target.value)} placeholder="Score obtained" />
        </F>
      </div>

      <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', margin:'4px 0 8px' }}>Subject Wise Marks</div>
      <div style={{ border:'1.5px solid #e2e8f0', borderRadius:10, overflow:'hidden', marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 36px', background:'#f8fafc', padding:'7px 12px', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase' }}>
          <span>Subject</span><span>Max Mark</span><span>Obtained</span><span></span>
        </div>
        {getMarks().map((sm, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 36px', borderTop:'1px solid #e2e8f0', padding:'5px 12px', gap:6, alignItems:'center' }}>
            <input value={sm.subject} onChange={e => setMark(i,'subject',e.target.value)} placeholder="Subject"
              style={{ padding:'5px 8px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:13, width:'100%', boxSizing:'border-box' }} />
            <input type="number" value={sm.max_mark} onChange={e => setMark(i,'max_mark',e.target.value)} placeholder="Max"
              style={{ padding:'5px 8px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:13, width:'100%', boxSizing:'border-box' }} />
            <input type="number" value={sm.obtained_mark} onChange={e => setMark(i,'obtained_mark',e.target.value)} placeholder="Got"
              style={{ padding:'5px 8px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:13, width:'100%', boxSizing:'border-box' }} />
            <button onClick={() => removeSubject(i)}
              style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:15, padding:0, textAlign:'center' }}>x</button>
          </div>
        ))}
        <div style={{ padding:'7px 12px', borderTop:'1px solid #e2e8f0' }}>
          <button onClick={addSubject}
            style={{ background:'none', border:'none', color:'#0ea5e9', cursor:'pointer', fontSize:13, fontWeight:600, padding:0 }}>+ Add Subject</button>
        </div>
      </div>

      {sec('Admission Details')}
      <div className="grid-2">
        <F label="Status">
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </F>
        <F label="Assigned Staff">
          <select className="form-select" value={form.assigned_staff_id} onChange={e => set('assigned_staff_id', e.target.value)}>
            <option value="">Unassigned</option>
            {(staffData || []).map(u => <option key={u._id || u.id} value={u._id || u.id}>{u.name}</option>)}
          </select>
        </F>
        <F label="Applied Date">
          <input className="form-input" type="date" value={form.applied_date} onChange={e => set('applied_date', e.target.value)} />
        </F>
        <F label="Submitted Date">
          <input className="form-input" type="date" value={form.submitted_date} onChange={e => set('submitted_date', e.target.value)} />
        </F>
        <F label="Counselling Date">
          <input className="form-input" type="date" value={form.counselling_date} onChange={e => set('counselling_date', e.target.value)} />
        </F>
        <F label="Next Follow-up Date">
          <input className="form-input" type="date" value={form.next_followup_date} onChange={e => set('next_followup_date', e.target.value)} />
        </F>
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)}
          rows={3} placeholder="Any additional notes..."
          style={{ resize:'vertical', fontFamily:'inherit' }} />
      </div>
    </Modal>
  );
}
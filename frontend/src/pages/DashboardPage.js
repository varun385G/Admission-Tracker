import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Badge, PageLoader } from '../components/ui';

const STATUS_COLORS = {
  'New Enquiry': '#3498db', 'Contacted': '#9b59b6', 'Counselling Scheduled': '#f39c12',
  'Document Submitted': '#1abc9c', 'Admitted': '#27ae60',
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['reports-overview'],
    queryFn: () => api.get('/reports/overview').then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: funnelData } = useQuery({
    queryKey: ['funnel'],
    queryFn: () => api.get('/reports/conversion-funnel').then(r => r.data),
  });

  const { data: followups } = useQuery({
    queryKey: ['today-followups'],
    queryFn: () => api.get('/students', { params: { limit: 10, page: 1 } }).then(r =>
      r.data.students.filter(s => s.next_followup_date?.startsWith(new Date().toISOString().split('T')[0]))
    ),
  });

  const { data: recentData } = useQuery({
    queryKey: ['recent-students'],
    queryFn: () => api.get('/students', { params: { limit: 6, page: 1 } }).then(r => r.data),
  });

  if (statsLoading) return <PageLoader />;

  const s = stats || {};
  const funnel = funnelData?.funnel || [];
  const maxFunnel = funnel[0]?.count || 1;

  return (
    <div>
      {/* Stats */}
      <div className="stat-grid">
        <StatCard label="Total Students" value={s.total || 0} sub="All enquiries" color="blue" />
        <StatCard label="Admitted" value={s.admitted || 0} sub="Successfully admitted" color="green" />
        <StatCard label="Conversion Rate" value={`${s.conversion_rate || 0}%`} sub="Admitted / Total" color="purple" />
        <StatCard label="Pending" value={s.pending || 0} sub="In pipeline" color="orange" />
        <StatCard label="Today's Follow-ups" value={s.today_followups || 0} sub="Need attention now" color="red" />
        <StatCard label="Active Staff" value={s.staff_count || 0} sub="Counsellors" color="teal" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Funnel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Conversion Funnel</span>
            <Link to="/reports" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>View full →</Link>
          </div>
          <div className="card-body">
            <div className="funnel-bar">
              {funnel.map(item => {
                const pct = Math.max(4, Math.round(item.count / maxFunnel * 100));
                return (
                  <div key={item.status} className="funnel-row">
                    <div className="funnel-label">{item.status}</div>
                    <div className="funnel-track">
                      <div className="funnel-fill" style={{ width: `${pct}%`, background: STATUS_COLORS[item.status] || '#999' }}>
                        {item.count > 0 && <span>{item.count}</span>}
                      </div>
                    </div>
                    <div className="funnel-count">{item.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Today's follow-ups */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Today's Follow-ups</span>
            <Link to="/calendar" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>Calendar →</Link>
          </div>
          <div className="card-body" style={{ padding: followups?.length ? '12px 20px' : 20 }}>
            {!followups?.length
              ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>No follow-ups for today 🎉</p>
              : followups.map(s => (
                <Link key={s.id} to={`/students?highlight=${s.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.course_interested}</div>
                    </div>
                    <Badge status={s.status} />
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      </div>

      {/* Recent Students */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Students</span>
          <Link to="/students" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none' }}>View all →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Course</th><th>Status</th><th>Staff</th><th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {(recentData?.students || []).map(s => (
                <tr key={s.id} className="clickable">
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td style={{ color: 'var(--text2)' }}>{s.course_interested}</td>
                  <td><Badge status={s.status} /></td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{s.staff_name || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{s.next_followup_date?.split('T')[0] || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

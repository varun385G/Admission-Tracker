import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../api/axios';
import { PageLoader } from '../components/ui';
import toast from 'react-hot-toast';

const COLORS = ['#2E75B6','#27ae60','#f39c12','#9b59b6','#1abc9c','#e74c3c'];
const STATUS_COLORS = { 'New Enquiry':'#3498db','Contacted':'#9b59b6','Counselling Scheduled':'#f39c12','Document Submitted':'#1abc9c','Admitted':'#27ae60' };
const TABS = ['Overview','Funnel','Sources','Staff Performance','Trends'];

function StatCard({ label, value, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [trendRange, setTrendRange] = useState('30d');

  const { data: overview, isLoading: ov_loading } = useQuery({
    queryKey: ['reports-overview'], queryFn: () => api.get('/reports/overview').then(r => r.data),
  });
  const { data: funnelData } = useQuery({
    queryKey: ['funnel'], queryFn: () => api.get('/reports/conversion-funnel').then(r => r.data),
  });
  const { data: sourcesData } = useQuery({
    queryKey: ['lead-sources'], queryFn: () => api.get('/reports/lead-sources').then(r => r.data),
    enabled: activeTab === 'Sources',
  });
  const { data: perfData } = useQuery({
    queryKey: ['staff-performance'], queryFn: () => api.get('/reports/staff-performance').then(r => r.data),
    enabled: activeTab === 'Staff Performance',
  });
  const { data: trendsData } = useQuery({
    queryKey: ['trends', trendRange], queryFn: () => api.get('/reports/trends', { params: { range: trendRange } }).then(r => r.data),
    enabled: activeTab === 'Trends',
  });

  const handleExportCSV = async () => {
    const res = await api.get('/reports/export/csv', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url; a.download = 'admission-report.csv'; a.click();
    toast.success('CSV downloaded');
  };

  const handleExportPDF = async () => {
    const res = await api.get('/reports/export/pdf', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    window.open(url, '_blank');
    toast.success('PDF opened');
  };

  if (ov_loading) return <PageLoader />;

  const s = overview || {};
  const funnel = funnelData?.funnel || [];
  const maxFunnel = funnel[0]?.count || 1;

  return (
    <div>
      {/* Export buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
        <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>⬇ Export CSV</button>
        <button className="btn btn-outline btn-sm" onClick={handleExportPDF}>📄 Export PDF</button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>)}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'Overview' && (
        <div>
          <div className="stat-grid">
            <StatCard label="Total Enquiries" value={s.total || 0} color="blue" />
            <StatCard label="Admitted" value={s.admitted || 0} color="green" />
            <StatCard label="Conversion Rate" value={`${s.conversion_rate || 0}%`} color="purple" />
            <StatCard label="Pending" value={s.pending || 0} color="orange" />
            <StatCard label="Rejected" value={s.rejected || 0} color="red" />
            <StatCard label="Active Staff" value={s.staff_count || 0} color="teal" />
          </div>
          <div className="card card-body">
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Status Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Funnel ── */}
      {activeTab === 'Funnel' && (
        <div className="card card-body">
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Conversion Funnel</h3>
          <div className="funnel-bar">
            {funnel.map(item => {
              const pct = Math.max(4, Math.round(item.count / maxFunnel * 100));
              const rate = s.total > 0 ? Math.round(item.count / s.total * 100) : 0;
              return (
                <div key={item.status} className="funnel-row" style={{ marginBottom: 4 }}>
                  <div className="funnel-label" style={{ width: 190 }}>{item.status}</div>
                  <div className="funnel-track" style={{ height: 32 }}>
                    <div className="funnel-fill" style={{ width: `${pct}%`, background: STATUS_COLORS[item.status] || '#999' }}>
                      {item.count > 0 && <span style={{ fontSize: 12 }}>{item.count}</span>}
                    </div>
                  </div>
                  <div className="funnel-count" style={{ width: 80 }}>{item.count} <span style={{ color: 'var(--text3)', fontSize: 11 }}>({rate}%)</span></div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ padding: 16, background: 'var(--danger-light)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Rejected</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Syne,sans-serif', marginTop: 4 }}>{funnelData?.other?.Rejected || 0}</div>
            </div>
            <div style={{ padding: 16, background: 'var(--surface2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Not Interested</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Syne,sans-serif', marginTop: 4 }}>{funnelData?.other?.['Not Interested'] || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sources ── */}
      {activeTab === 'Sources' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card card-body">
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Lead Sources</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Source</th><th>Total</th><th>Admitted</th><th>Conversion</th></tr></thead>
                <tbody>
                  {(sourcesData?.sources || []).map(row => (
                    <tr key={row.source}>
                      <td style={{ fontWeight: 500 }}>{row.source}</td>
                      <td>{row.total}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{row.admitted}</td>
                      <td><span style={{ fontWeight: 600, color: row.rate > 50 ? 'var(--success)' : 'var(--text2)' }}>{row.rate}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card card-body">
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Source Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sourcesData?.sources || []} dataKey="total" nameKey="source" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
                  {(sourcesData?.sources || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Staff Performance ── */}
      {activeTab === 'Staff Performance' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Staff Performance</span></div>
          <div className="card-body">
            {(perfData?.staff || []).map(u => (
              <div key={u.id} className="perf-row">
                <div className="perf-name">{u.name}</div>
                <div style={{ display: 'flex', gap: 20, flex: 1, alignItems: 'center', fontSize: 12, color: 'var(--text2)' }}>
                  <span>Assigned: <strong style={{ color: 'var(--text)' }}>{u.total_assigned}</strong></span>
                  <span>Admitted: <strong style={{ color: 'var(--success)' }}>{u.admitted}</strong></span>
                  <span>Notes: <strong style={{ color: 'var(--text)' }}>{u.total_notes}</strong></span>
                </div>
                <div className="perf-track">
                  <div className="perf-fill" style={{ width: `${u.conversion_rate}%` }} />
                </div>
                <div className="perf-pct">{u.conversion_rate}%</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 20px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={perfData?.staff || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_assigned" name="Assigned" fill="#9b59b6" radius={[3,3,0,0]} />
                <Bar dataKey="admitted" name="Admitted" fill="var(--success)" radius={[3,3,0,0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Trends ── */}
      {activeTab === 'Trends' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            {['7d','14d','30d'].map(r => (
              <button key={r} className={`btn btn-sm ${trendRange === r ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTrendRange(r)}>
                Last {r === '7d' ? '7' : r === '14d' ? '14' : '30'} days
              </button>
            ))}
          </div>
          <div className="card card-body">
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Enquiry Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(trendsData?.trends || []).map(r => ({ ...r, date: r.date?.split('T')[0], enquiries: parseInt(r.enquiries), admitted: parseInt(r.admitted) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="enquiries" stroke="var(--primary)" strokeWidth={2} dot={false} name="Enquiries" />
                <Line type="monotone" dataKey="admitted" stroke="var(--success)" strokeWidth={2} dot={false} name="Admitted" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

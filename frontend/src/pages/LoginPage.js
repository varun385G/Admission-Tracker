import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@college.com', password: 'Admin@123' });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d0f14 0%, #1a2340 50%, #0d1a2e 100%)',
    }}>
      <div style={{ width: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
            AdmissionDesk
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
            College Admission Management System
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '32px',
          border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
        }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Sign in to continue
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 28 }}>
            Enter your credentials to access the dashboard
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
              <input className="form-input" type="email" value={form.email} required
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                placeholder="your@email.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.5)' }}>Password</label>
              <input className="form-input" type="password" value={form.password} required
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                placeholder="••••••••"
              />
            </div>
            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}
              style={{ marginTop: 8, fontWeight: 600, fontSize: 14 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '16px', background: 'rgba(46,117,182,0.1)', borderRadius: 8, border: '1px solid rgba(46,117,182,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Demo credentials</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Admin: admin@college.com / Admin@123</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>Staff: priya@college.com / Staff@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

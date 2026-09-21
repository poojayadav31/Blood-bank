import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Droplet,
  Lock,
  Mail,
  Shield,
  Building2,
  HeartHandshake,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function Login() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user.role === 'super_admin') navigate('/admin');
        else if (res.user.role === 'org_admin') navigate('/organization');
        else if (res.user.role === 'volunteer') navigate('/volunteer');
        else if (res.user.role === 'donor') navigate('/donor');
        else navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await demoLogin(role);
      if (res.success) {
        if (role === 'super_admin') navigate('/admin');
        else if (role === 'org_admin') navigate('/organization');
        else if (role === 'volunteer') navigate('/volunteer');
        else if (role === 'donor') navigate('/donor');
      }
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="layout-container" style={{ maxWidth: '520px' }}>
        
        {/* Card */}
        <div className="glass-card" style={{ padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 6px 18px var(--primary-glow)',
            }}>
              <Droplet size={28} color="#ffffff" fill="#ffffff" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Welcome to LifePulse BBMS
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Sign in to access your organization, volunteer or donor workspace
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.88rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="admin@bloodbank.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '20px', padding: '12px', fontSize: '0.96rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div style={{ marginTop: '30px', paddingTop: '22px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.04em' }}>
              <Sparkles size={14} color="var(--primary)" />
              1-Click Demo Evaluation Personas
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickDemo('super_admin')}
                className="btn btn-secondary"
                style={{ padding: '8px 10px', fontSize: '0.78rem', justifyContent: 'flex-start' }}
              >
                <Shield size={14} color="#e11d48" />
                Super Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('org_admin')}
                className="btn btn-secondary"
                style={{ padding: '8px 10px', fontSize: '0.78rem', justifyContent: 'flex-start' }}
              >
                <Building2 size={14} color="#0284c7" />
                Org Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('volunteer')}
                className="btn btn-secondary"
                style={{ padding: '8px 10px', fontSize: '0.78rem', justifyContent: 'flex-start' }}
              >
                <HeartHandshake size={14} color="#10b981" />
                Camp Volunteer
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('donor')}
                className="btn btn-secondary"
                style={{ padding: '8px 10px', fontSize: '0.78rem', justifyContent: 'flex-start' }}
              >
                <User size={14} color="#f59e0b" />
                Blood Donor
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/register-donor" style={{ color: 'var(--primary)', fontWeight: 700 }}>Register as Donor</Link> or <Link to="/register-org" style={{ color: 'var(--primary)', fontWeight: 700 }}>Register Organization</Link>
          </div>

        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Droplet,
  Sun,
  Moon,
  User,
  LogOut,
  Shield,
  Building2,
  HeartHandshake,
  Calendar,
  Layers,
  FileText,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleDemoSwitch = async (role) => {
    setShowDemoDropdown(false);
    await demoLogin(role);
    if (role === 'super_admin') navigate('/admin');
    else if (role === 'org_admin') navigate('/organization');
    else if (role === 'volunteer') navigate('/volunteer');
    else if (role === 'donor') navigate('/donor');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'super_admin') return '/admin';
    if (user.role === 'org_admin') return '/organization';
    if (user.role === 'volunteer') return '/volunteer';
    if (user.role === 'donor') return '/donor';
    return '/';
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="layout-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
          }}>
            <Droplet color="#ffffff" size={24} fill="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                LifePulse<span style={{ color: 'var(--primary)' }}>BBMS</span>
              </span>
              <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                v1.0
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1 }}>
              Multi-Org Blood Bank Management
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          <Link
            to="/camps"
            style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: location.pathname === '/camps' ? 'var(--primary)' : 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calendar size={18} />
            Find Camps
          </Link>
          <Link
            to="/eligibility"
            style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: location.pathname === '/eligibility' ? 'var(--primary)' : 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <HeartHandshake size={18} />
            Eligibility Checker
          </Link>
          <Link
            to="/request-blood"
            style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: location.pathname === '/request-blood' ? 'var(--primary)' : 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={18} color="#e11d48" />
            Hospital Request
          </Link>
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* Quick Demo Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDemoDropdown(!showDemoDropdown)}
              className="btn btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
              title="Switch Demo Role for testing"
            >
              <Layers size={15} color="var(--primary)" />
              <span>Demo Roles</span>
              <ChevronDown size={14} />
            </button>

            {showDemoDropdown && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: '240px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  zIndex: 60,
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', padding: '6px 10px', textTransform: 'uppercase' }}>
                  Switch Test Persona
                </div>
                <button
                  onClick={() => handleDemoSwitch('super_admin')}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', color: 'var(--text-main)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Shield size={16} color="#e11d48" />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>Super Admin</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Central control & approvals</div>
                  </div>
                </button>
                <button
                  onClick={() => handleDemoSwitch('org_admin')}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', color: 'var(--text-main)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Building2 size={16} color="#0284c7" />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>Org Admin (Red Cross)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Camps, Quota, Stock</div>
                  </div>
                </button>
                <button
                  onClick={() => handleDemoSwitch('volunteer')}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', color: 'var(--text-main)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <HeartHandshake size={16} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>Camp Volunteer</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>QR Check-in & Donations</div>
                  </div>
                </button>
                <button
                  onClick={() => handleDemoSwitch('donor')}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', color: 'var(--text-main)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <User size={16} color="#f59e0b" />
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>Donor (John Doe)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>QR Pass & Certificates</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
            }}
            title="Toggle Dark / Light Theme"
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#64748b" />}
          </button>

          {/* User Status / Login */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to={getDashboardLink()}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.86rem' }}
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px',
                  cursor: 'pointer',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
                Login
              </Link>
              <Link to="/register-donor" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
                Join as Donor
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}

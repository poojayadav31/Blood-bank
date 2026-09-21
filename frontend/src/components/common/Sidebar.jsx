import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Layers,
  FileCheck,
  ShieldAlert,
  BarChart3,
  Users,
  QrCode,
  Award,
  PlusCircle,
  Clock,
  Heart,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function Sidebar({ role }) {
  const { user } = useAuth();
  const currentRole = role || user?.role || 'super_admin';

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 16px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? '#ffffff' : 'var(--text-main)',
    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
    transition: 'all 0.15s ease',
    marginBottom: '4px',
    textDecoration: 'none',
  });

  return (
    <aside style={{
      width: '260px',
      flexShrink: 0,
      backgroundColor: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      padding: '24px 16px',
      minHeight: 'calc(100vh - 72px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div>
        {/* User Card */}
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-card-subtle)',
          marginBottom: '20px',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>
            {currentRole === 'super_admin' ? 'Super Admin Portal' : currentRole === 'org_admin' ? 'Organization Portal' : currentRole === 'volunteer' ? 'Volunteer Portal' : 'Donor Portal'}
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name || 'User'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {user?.organization?.name || user?.email}
          </div>
        </div>

        {/* Super Admin Navigation */}
        {currentRole === 'super_admin' && (
          <nav>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 12px 8px', letterSpacing: '0.05em' }}>
              Management
            </div>
            <NavLink to="/admin" end style={linkStyle}>
              <LayoutDashboard size={18} />
              Overview
            </NavLink>
            <NavLink to="/admin/organizations" style={linkStyle}>
              <Building2 size={18} />
              Organizations
            </NavLink>
            <NavLink to="/admin/quota-approvals" style={linkStyle}>
              <FileCheck size={18} />
              Quota Requests
            </NavLink>
            <NavLink to="/admin/calendar" style={linkStyle}>
              <Calendar size={18} />
              Allotment Calendar
            </NavLink>
            <NavLink to="/admin/inventory" style={linkStyle}>
              <Layers size={18} />
              Global Inventory
            </NavLink>
            <NavLink to="/admin/donors" style={linkStyle}>
              <Users size={18} />
              Donors Master
            </NavLink>
            <NavLink to="/admin/violations" style={linkStyle}>
              <ShieldAlert size={18} />
              Violation Logs
            </NavLink>
            <NavLink to="/admin/reports" style={linkStyle}>
              <FileSpreadsheet size={18} />
              Global Reports
            </NavLink>
          </nav>
        )}

        {/* Organization Admin Navigation */}
        {currentRole === 'org_admin' && (
          <nav>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 12px 8px', letterSpacing: '0.05em' }}>
              Organization Control
            </div>
            <NavLink to="/organization" end style={linkStyle}>
              <LayoutDashboard size={18} />
              Org Dashboard
            </NavLink>
            <NavLink to="/organization/camps" style={linkStyle}>
              <Calendar size={18} />
              Blood Camps
            </NavLink>
            <NavLink to="/organization/create-camp" style={linkStyle}>
              <PlusCircle size={18} />
              Create Camp
            </NavLink>
            <NavLink to="/organization/quota" style={linkStyle}>
              <FileCheck size={18} />
              Quota Requests
            </NavLink>
            <NavLink to="/organization/inventory" style={linkStyle}>
              <Layers size={18} />
              Blood Stock
            </NavLink>
            <NavLink to="/organization/requests" style={linkStyle}>
              <Heart size={18} />
              Hospital Requests
            </NavLink>
            <NavLink to="/organization/reports" style={linkStyle}>
              <FileSpreadsheet size={18} />
              Org Reports
            </NavLink>
          </nav>
        )}

        {/* Volunteer Navigation */}
        {currentRole === 'volunteer' && (
          <nav>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 12px 8px', letterSpacing: '0.05em' }}>
              Camp Operations
            </div>
            <NavLink to="/volunteer" end style={linkStyle}>
              <LayoutDashboard size={18} />
              Active Camps
            </NavLink>
            <NavLink to="/volunteer/check-in" style={linkStyle}>
              <QrCode size={18} />
              QR Check-In
            </NavLink>
            <NavLink to="/volunteer/eligibility-desk" style={linkStyle}>
              <HelpCircle size={18} />
              Eligibility Desk
            </NavLink>
          </nav>
        )}

        {/* Donor Navigation */}
        {currentRole === 'donor' && (
          <nav>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 12px 8px', letterSpacing: '0.05em' }}>
              Donor Portal
            </div>
            <NavLink to="/donor" end style={linkStyle}>
              <LayoutDashboard size={18} />
              My Profile & Pass
            </NavLink>
            <NavLink to="/donor/history" style={linkStyle}>
              <Clock size={18} />
              Donation History
            </NavLink>
            <NavLink to="/donor/certificates" style={linkStyle}>
              <Award size={18} />
              My Certificates
            </NavLink>
            <NavLink to="/camps" style={linkStyle}>
              <Calendar size={18} />
              Explore Camps
            </NavLink>
          </nav>
        )}
      </div>

      {/* Collection limit notice */}
      {currentRole === 'org_admin' && (
        <div style={{
          padding: '12px',
          borderRadius: '10px',
          backgroundColor: 'var(--primary-light)',
          border: '1px solid rgba(225, 29, 72, 0.2)',
          fontSize: '0.78rem',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '2px' }}>
            Collection Limit
          </div>
          <div style={{ color: 'var(--text-main)' }}>
            Active Limit: <strong>{user?.organization?.collection_limit || 300} Bags</strong>
          </div>
        </div>
      )}
    </aside>
  );
}

import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Common Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Public Pages
import Home from './pages/public/Home';
import BrowseCamps from './pages/public/BrowseCamps';
import DonorEligibilityCheck from './pages/public/DonorEligibilityCheck';
import HospitalBloodRequest from './pages/public/HospitalBloodRequest';
import RegisterDonor from './pages/public/RegisterDonor';
import RegisterOrg from './pages/public/RegisterOrg';
import Login from './pages/public/Login';

// Super Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import OrgManagement from './pages/admin/OrgManagement';
import QuotaApprovals from './pages/admin/QuotaApprovals';
import GlobalInventory from './pages/admin/GlobalInventory';
import ViolationAuditLogs from './pages/admin/ViolationAuditLogs';
import GlobalReports from './pages/admin/GlobalReports';
import AdminCampCalendar from './pages/admin/AdminCampCalendar';

// Organization Admin Pages
import OrgDashboard from './pages/organization/OrgDashboard';
import CampManagement from './pages/organization/CampManagement';
import QuotaRequestPage from './pages/organization/QuotaRequestPage';
import OrgInventory from './pages/organization/OrgInventory';
import OrgRequests from './pages/organization/OrgRequests';
import OrgReports from './pages/organization/OrgReports';

// Volunteer Pages
import VolunteerPortal from './pages/volunteer/VolunteerPortal';

// Donor Pages
import DonorDashboard from './pages/donor/DonorDashboard';

export default function App() {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const isPortalRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/organization') ||
    location.pathname.startsWith('/volunteer') ||
    location.pathname.startsWith('/donor');

  const getActiveRole = () => {
    if (location.pathname.startsWith('/admin')) return 'super_admin';
    if (location.pathname.startsWith('/organization')) return 'org_admin';
    if (location.pathname.startsWith('/volunteer')) return 'volunteer';
    if (location.pathname.startsWith('/donor')) return 'donor';
    return user?.role || 'super_admin';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {isPortalRoute ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 72px)' }}>
          <Sidebar role={getActiveRole()} />
          <main style={{ flex: 1, backgroundColor: 'var(--bg-main)', overflowY: 'auto' }}>
            <Routes>
              {/* Super Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/organizations" element={<OrgManagement />} />
              <Route path="/admin/quota-approvals" element={<QuotaApprovals />} />
              <Route path="/admin/inventory" element={<GlobalInventory />} />
              <Route path="/admin/camps" element={<AdminCampCalendar />} />
              <Route path="/admin/calendar" element={<AdminCampCalendar />} />
              <Route path="/admin/violations" element={<ViolationAuditLogs />} />
              <Route path="/admin/reports" element={<GlobalReports />} />

              {/* Organization Admin Routes */}
              <Route path="/organization" element={<OrgDashboard />} />
              <Route path="/organization/camps" element={<CampManagement />} />
              <Route path="/organization/create-camp" element={<CampManagement />} />
              <Route path="/organization/quota" element={<QuotaRequestPage />} />
              <Route path="/organization/inventory" element={<OrgInventory />} />
              <Route path="/organization/requests" element={<OrgRequests />} />
              <Route path="/organization/reports" element={<OrgReports />} />

              {/* Volunteer Routes */}
              <Route path="/volunteer" element={<VolunteerPortal />} />
              <Route path="/volunteer/check-in" element={<VolunteerPortal />} />
              <Route path="/volunteer/eligibility-desk" element={<DonorEligibilityCheck />} />

              {/* Donor Routes */}
              <Route path="/donor" element={<DonorDashboard />} />
              <Route path="/donor/history" element={<DonorDashboard />} />
              <Route path="/donor/certificates" element={<DonorDashboard />} />
            </Routes>
          </main>
        </div>
      ) : (
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/camps" element={<BrowseCamps />} />
            <Route path="/eligibility" element={<DonorEligibilityCheck />} />
            <Route path="/request-blood" element={<HospitalBloodRequest />} />
            <Route path="/register-donor" element={<RegisterDonor />} />
            <Route path="/register-org" element={<RegisterOrg />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      )}

      {/* Footer for public pages */}
      {!isPortalRoute && (
        <footer style={{
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
          padding: '40px 0 24px',
          marginTop: 'auto',
        }}>
          <div className="layout-container">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '30px', marginBottom: '30px' }}>
              <div style={{ maxWidth: '380px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#ffffff', fontWeight: 800 }}>♥</span>
                  </div>
                  <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>LifePulse BBMS</strong>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Next-generation multi-organization Blood Bank Management Platform enforcing strict collection safety limits, quota approvals, and digital certificates.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', color: 'var(--text-main)' }}>
                    Portals & Services
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <a href="/camps">Find Blood Camps</a>
                    <a href="/eligibility">Eligibility Engine</a>
                    <a href="/request-blood">Hospital Requisitions</a>
                    <a href="/register-org">Organization Accreditation</a>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', color: 'var(--text-main)' }}>
                    Quick Personas
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    <a href="/admin">Super Admin Portal</a>
                    <a href="/organization">Org Admin Portal</a>
                    <a href="/volunteer">Volunteer Check-In</a>
                    <a href="/donor">Donor Dashboard</a>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>© 2026 LifePulse BBMS. All rights reserved. Production-ready Architecture.</span>
              <span>PostgreSQL • React • Node.js • JWT RBAC</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

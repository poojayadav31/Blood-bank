import React, { useState } from 'react';
import { request } from '../../services/api';
import {
  Building2,
  FileCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RegisterOrg() {
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    type: 'Hospital Blood Bank',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_person: '',
    phone: '',
    email: '',
    website: '',
    certificate_url: '',
    license_url: '',
    admin_password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await request('/organizations/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit organization registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: '80px 0', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="layout-container" style={{ maxWidth: '640px' }}>
          <div className="glass-card" style={{ padding: '48px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle2 size={36} color="var(--success)" />
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px' }}>
              Registration Submitted!
            </h2>
            <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
              Thank you for applying to join the BBMS network. Your license and accreditation documents are queued for verification by the Central Super Admin. You will receive an approval notification once verified.
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Go to Login Page
              </Link>
              <Link to="/" className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '50px 0', minHeight: '80vh' }}>
      <div className="layout-container" style={{ maxWidth: '840px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '12px',
          }}>
            <Building2 size={16} />
            Institutional Accreditation
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Register Your Blood Organization
          </h1>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '8px auto 0' }}>
            Join the national multi-organization blood bank management system. Manage blood donation camps, digital inventory, and quota authorizations.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', color: 'var(--primary)' }}>
              1. Organization Details
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Organization Name *</label>
                <input
                  type="text"
                  required
                  name="name"
                  className="form-input"
                  placeholder="e.g. Metro Blood Centre"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration / License Number *</label>
                <input
                  type="text"
                  required
                  name="registration_number"
                  className="form-input"
                  placeholder="e.g. LIC-DL-2026-9912"
                  value={formData.registration_number}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type of Organization *</label>
                <select name="type" className="form-select" value={formData.type} onChange={handleChange}>
                  <option value="Hospital Blood Bank">Hospital Blood Bank</option>
                  <option value="Charitable Society Blood Bank">Charitable Society Blood Bank</option>
                  <option value="Red Cross Society">Red Cross Society</option>
                  <option value="Government Blood Centre">Government Blood Centre</option>
                  <option value="Private Licensed Blood Bank">Private Licensed Blood Bank</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Website (Optional)</label>
                <input
                  type="url"
                  name="website"
                  className="form-input"
                  placeholder="https://exampleblood.org"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Facility Street Address *</label>
              <textarea
                required
                name="address"
                rows="2"
                className="form-textarea"
                placeholder="Building No, Sector, Landmark..."
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '12px' }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  required
                  name="city"
                  className="form-input"
                  placeholder="New Delhi"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  required
                  name="state"
                  className="form-input"
                  placeholder="Delhi"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode *</label>
                <input
                  type="text"
                  required
                  name="pincode"
                  className="form-input"
                  placeholder="110001"
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '28px 0 16px', color: 'var(--primary)' }}>
              2. Admin Contact & Login Credentials
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Contact Person / Nodal Officer *</label>
                <input
                  type="text"
                  required
                  name="contact_person"
                  className="form-input"
                  placeholder="Dr. Rajesh Verma"
                  value={formData.contact_person}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  name="phone"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Official Email (Username) *</label>
                <input
                  type="email"
                  required
                  name="email"
                  className="form-input"
                  placeholder="admin@organization.org"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Admin Account Password *</label>
                <input
                  type="password"
                  required
                  name="admin_password"
                  className="form-input"
                  placeholder="Create strong password"
                  value={formData.admin_password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '28px 0 16px', color: 'var(--primary)' }}>
              3. Regulatory Compliance Documents
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Registration Certificate URL/Document *</label>
                <input
                  type="text"
                  name="certificate_url"
                  className="form-input"
                  placeholder="e.g. /uploads/docs/cert_rc.pdf"
                  value={formData.certificate_url}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Drug Controller License URL/Document *</label>
                <input
                  type="text"
                  name="license_url"
                  className="form-input"
                  placeholder="e.g. /uploads/docs/drug_license.pdf"
                  value={formData.license_url}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)', marginTop: '20px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              ℹ️ Standard approved blood collection quota limit for new organizations is <strong>300 Blood Bags</strong>. Additional quota can be requested post-approval through your dashboard.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '24px', padding: '14px', fontSize: '1rem' }}
            >
              {submitting ? 'Submitting Registration...' : 'Submit Organization Application'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  Droplet,
  User,
  Phone,
  Mail,
  Lock,
  Calendar,
  Scale,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function RegisterDonor() {
  const { registerDonor } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dob: '1998-05-14',
    gender: 'Male',
    blood_group: 'O+',
    weight: '68',
    address: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    medical_history: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await registerDonor(formData);
      if (res.success) {
        navigate('/donor');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '50px 0', minHeight: '80vh' }}>
      <div className="layout-container" style={{ maxWidth: '820px' }}>
        
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
            <Heart size={16} />
            Life Saver Community
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Register as a Voluntary Blood Donor
          </h1>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '8px auto 0' }}>
            Create your donor profile, receive digital QR entry passes for donation drives, track history, and download official certificates.
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
              1. Personal & Account Information
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  name="name"
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  name="email"
                  className="form-input"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  required
                  name="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
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
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '28px 0 16px', color: 'var(--primary)' }}>
              2. Medical & Physiological Profile
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Blood Group *</label>
                <select name="blood_group" className="form-select" value={formData.blood_group} onChange={handleChange}>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  required
                  name="dob"
                  className="form-input"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Body Weight (kg) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  name="weight"
                  className="form-input"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '28px 0 16px', color: 'var(--primary)' }}>
              3. Emergency Contact & Location
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  className="form-input"
                  placeholder="Guardian / Spouse Name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Phone</label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  className="form-input"
                  placeholder="+91 98765 00000"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '12px' }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  required
                  name="city"
                  className="form-input"
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
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '24px', padding: '14px', fontSize: '1rem' }}
            >
              {submitting ? 'Creating Donor Account...' : 'Complete Donor Registration'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Login here</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

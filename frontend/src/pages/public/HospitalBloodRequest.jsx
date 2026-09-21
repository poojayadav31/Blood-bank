import React, { useState, useEffect } from 'react';
import { request } from '../../services/api';
import {
  AlertTriangle,
  Building2,
  Phone,
  Droplet,
  Send,
  CheckCircle2,
  Clock,
  HeartPulse,
} from 'lucide-react';

export default function HospitalBloodRequest() {
  const [formData, setFormData] = useState({
    hospital_name: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    blood_group: 'O+',
    quantity: '2',
    urgency: 'Normal',
    patient_case: '',
    required_by_date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [requestsList, setRequestsList] = useState([]);

  const fetchRequests = () => {
    request('/blood-requests')
      .then((res) => {
        if (res.success) setRequestsList(res.requests);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await request('/blood-requests', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setMsg({ type: 'success', text: 'Hospital Blood Request successfully broadcasted to all blood banks!' });
        setFormData({
          hospital_name: '',
          contact_person: '',
          contact_phone: '',
          contact_email: '',
          blood_group: 'O+',
          quantity: '2',
          urgency: 'Normal',
          patient_case: '',
          required_by_date: new Date().toISOString().split('T')[0],
        });
        fetchRequests();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to submit blood request.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '50px 0', minHeight: '80vh' }}>
      <div className="layout-container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '12px',
          }}>
            <HeartPulse size={16} />
            Emergency Blood Request Network
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Hospital & Clinic Blood Requisition
          </h1>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', maxWidth: '640px', margin: '8px auto 0' }}>
            Submit clinical blood requests for emergency transfusions, surgical procedures, or thalassemia care. All registered blood banks are alerted immediately.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          
          {/* Request Form */}
          <div className="glass-card" style={{ padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="var(--primary)" />
              New Blood Request Form
            </h3>

            {msg && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', backgroundColor: msg.type === 'error' ? 'var(--danger-light)' : 'var(--success-light)', color: msg.type === 'error' ? 'var(--danger)' : 'var(--success)', fontSize: '0.88rem', fontWeight: 600 }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Hospital / Institution Name *</label>
                <input
                  type="text"
                  required
                  name="hospital_name"
                  className="form-input"
                  placeholder="e.g. Apollo Multi-Specialty Hospital"
                  value={formData.hospital_name}
                  onChange={handleChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Contact Person (Doctor/Nurse) *</label>
                  <input
                    type="text"
                    required
                    name="contact_person"
                    className="form-input"
                    placeholder="Dr. K. Sharma"
                    value={formData.contact_person}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone / Extension *</label>
                  <input
                    type="tel"
                    required
                    name="contact_phone"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={formData.contact_phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
                  <label className="form-label">Quantity (Units) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    name="quantity"
                    className="form-input"
                    value={formData.quantity}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Urgency Level *</label>
                  <select name="urgency" className="form-select" value={formData.urgency} onChange={handleChange}>
                    <option value="Normal">Normal (Routine)</option>
                    <option value="Urgent">Urgent (Within 24h)</option>
                    <option value="Critical">Critical (Immediate)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Required By Date *</label>
                <input
                  type="date"
                  required
                  name="required_by_date"
                  className="form-input"
                  value={formData.required_by_date}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Indication / Patient Case</label>
                <textarea
                  name="patient_case"
                  rows="3"
                  className="form-textarea"
                  placeholder="e.g. Emergency trauma road accident surgery, immediate whole blood required."
                  value={formData.patient_case}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px', padding: '12px' }}
              >
                <Send size={18} />
                {submitting ? 'Broadcasting Request...' : 'Submit Blood Request'}
              </button>
            </form>
          </div>

          {/* Active Blood Requests List */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '20px' }}>
              Recent Hospital Blood Requests
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '560px', overflowY: 'auto' }}>
              {requestsList.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: `1px solid ${req.urgency === 'Critical' ? 'var(--danger)' : 'var(--border-color)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="blood-pill" style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}>
                        {req.blood_group}
                      </span>
                      <strong style={{ fontSize: '0.96rem' }}>{req.hospital_name}</strong>
                    </div>
                    <span className={`badge badge-${req.status}`}>
                      {req.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Required: <strong>{req.quantity} Unit(s)</strong> • Urgency:{' '}
                    <strong style={{ color: req.urgency === 'Critical' ? 'var(--danger)' : req.urgency === 'Urgent' ? 'var(--warning)' : 'inherit' }}>
                      {req.urgency}
                    </strong>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '4px 0 8px' }}>
                    {req.patient_case || 'Standard clinical requisition'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span>Contact: {req.contact_person} ({req.contact_phone})</span>
                    <span>Date: {req.required_by_date}</span>
                  </div>

                  {req.fulfilled_by_org_name && (
                    <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--success)', fontWeight: 700 }}>
                      ✔ Fulfilled by {req.fulfilled_by_org_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

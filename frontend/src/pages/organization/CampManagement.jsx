import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import BloodLimitWarning from '../../components/common/BloodLimitWarning';
import {
  Calendar,
  PlusCircle,
  Clock,
  MapPin,
  Search,
  AlertOctagon,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function CampManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const orgLimit = Math.min(user?.organization?.collection_limit || 300, 300);

  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViolationAlertModal, setShowViolationAlertModal] = useState(false);
  const [conflictModalData, setConflictModalData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    organizer: user?.organization?.name || 'Blood Centre',
    location: '',
    address: '',
    city: user?.organization?.city || 'New Delhi',
    state: user?.organization?.state || 'Delhi',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '15:00',
    expected_donors: '150',
    expected_blood_bags: '120',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const isLimitViolated = parseInt(formData.expected_blood_bags || 0) > 300 || parseInt(formData.expected_blood_bags || 0) > parseInt(orgLimit);

  const fetchCamps = () => {
    setLoading(true);
    request(`/camps?organization_id=${user?.organization_id || 1}`)
      .then((res) => {
        if (res.success) setCamps(res.camps);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrorMsg(null);

    // If user changes expected blood bags to more than the limit, trigger alert modal
    if (name === 'expected_blood_bags') {
      const numVal = parseInt(value || 0);
      if (numVal > parseInt(orgLimit)) {
        setShowViolationAlertModal(true);
      }
    }
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();

    if (isLimitViolated) {
      setShowViolationAlertModal(true);
      setErrorMsg(`Maximum allowed collection limit is ${orgLimit} blood bags. Please reduce the target or request approval from Super Admin.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setConflictModalData(null);

    try {
      const res = await request('/camps', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          organization_id: user?.organization_id,
        }),
      });

      if (res.success) {
        setShowCreateModal(false);
        fetchCamps();
        setFormData({
          name: '',
          organizer: user?.organization?.name || 'Blood Centre',
          location: '',
          address: '',
          city: user?.organization?.city || 'New Delhi',
          state: user?.organization?.state || 'Delhi',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '15:00',
          expected_donors: '150',
          expected_blood_bags: '120',
          description: '',
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create blood camp.');
      if (err.data?.error_type === 'COLLECTION_LIMIT_EXCEEDED') {
        setShowViolationAlertModal(true);
      } else if (err.data?.error_type === 'CAMP_SCHEDULE_CONFLICT') {
        setConflictModalData(err.data.conflicting_camp || { name: 'Existing Camp', date: formData.date, start_time: formData.start_time, end_time: formData.end_time });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Drive Scheduling & Management
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
            Blood Donation Camps
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Schedule and manage donation drives. Active Collection Quota: <strong style={{ color: 'var(--primary)' }}>{orgLimit} Blood Bags</strong> per drive.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
        >
          <PlusCircle size={18} /> Schedule New Camp
        </button>
      </div>

      {/* Info notice about single-slot conflict-free policy */}
      <div style={{
        padding: '14px 18px',
        borderRadius: '12px',
        backgroundColor: 'var(--secondary-light)',
        border: '1px solid rgba(2, 132, 199, 0.2)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.86rem',
        color: 'var(--text-main)',
      }}>
        <Calendar size={20} color="var(--secondary)" />
        <div>
          <strong>Conflict-Free Scheduling Policy:</strong> Only one blood donation camp can be scheduled per date and overlapping time slot. The system automatically verifies availability and blocks duplicate or conflicting schedules.
        </div>
      </div>

      {/* Camps List Grid */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading organization camps...</div>
      ) : camps.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
          <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No Blood Camps Scheduled Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', marginBottom: '20px' }}>
            Plan a voluntary donation drive in schools, tech parks, or community centres.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Schedule First Camp
          </button>
        </div>
      ) : (
        <div className="grid-cols-3">
          {camps.map((camp) => (
            <div key={camp.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className={`badge badge-${camp.status}`}>{camp.status}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Target: {camp.expected_blood_bags} Bags
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
                  {camp.name}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} color="var(--primary)" />
                    <strong>{camp.date}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={15} color="var(--primary)" />
                    <span>{camp.start_time} - {camp.end_time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{camp.location}, {camp.city}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {camp.description}
                </p>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Collected</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {camp.collected_blood_bags || 0} / {camp.expected_blood_bags} Bags
                  </div>
                </div>

                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Expected Donors: {camp.expected_donors}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Blood Camp Modal with Strict 300-Bag Limit Highlight */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 90,
          padding: '20px',
        }}>
          <div className="glass-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={22} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
              Schedule Blood Donation Camp
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Your organization's maximum approved limit is <strong style={{ color: 'var(--primary)' }}>{orgLimit} Blood Bags</strong> per drive.
            </p>

            {/* Strict Warning Banner if Limit Exceeded */}
            <BloodLimitWarning
              limit={orgLimit}
              currentTarget={formData.expected_blood_bags}
              showQuotaLink={true}
            />

            {errorMsg && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.88rem', fontWeight: 600 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCamp}>
              <div className="form-group">
                <label className="form-label">Camp Name / Theme *</label>
                <input
                  type="text"
                  required
                  name="name"
                  className="form-input"
                  placeholder="e.g. Annual Tech Park Life Saver Drive 2026"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Organizer Entity *</label>
                  <input
                    type="text"
                    required
                    name="organizer"
                    className="form-input"
                    value={formData.organizer}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Camp Date *</label>
                  <input
                    type="date"
                    required
                    name="date"
                    className="form-input"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    required
                    name="start_time"
                    className="form-input"
                    value={formData.start_time}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    required
                    name="end_time"
                    className="form-input"
                    value={formData.end_time}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Venue Location *</label>
                <input
                  type="text"
                  required
                  name="location"
                  className="form-input"
                  placeholder="e.g. Pragati Maidan Hall 5"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Venue Address *</label>
                <input
                  type="text"
                  required
                  name="address"
                  className="form-input"
                  placeholder="e.g. Mathura Road, Railway Colony"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Expected Donors (Footfall) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    name="expected_donors"
                    className="form-input"
                    value={formData.expected_donors}
                    onChange={handleChange}
                  />
                </div>

                {/* Expected Blood Bags with Strict Red Highlight when > limit */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Expected Blood Bags *</span>
                    <span style={{ fontSize: '0.74rem', color: isLimitViolated ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                      Max Allowed: {orgLimit} Bags
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    name="expected_blood_bags"
                    className={`form-input ${isLimitViolated ? 'limit-violation-input' : ''}`}
                    value={formData.expected_blood_bags}
                    onChange={handleChange}
                  />
                  {isLimitViolated && (
                    <span style={{ fontSize: '0.76rem', color: 'var(--danger)', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertOctagon size={14} /> Exceeds maximum limit of {orgLimit} bags. Submission is locked.
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Drive Description & Volunteer Instructions</label>
                <textarea
                  name="description"
                  rows="3"
                  className="form-textarea"
                  placeholder="Describe target demographic, free refreshment packs, certifications..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLimitViolated || submitting}
                  className={`btn ${isLimitViolated ? 'btn-danger' : 'btn-primary'}`}
                  style={{ flex: 1 }}
                >
                  {isLimitViolated ? `Blocked: Exceeds ${orgLimit} Bags Limit` : submitting ? 'Scheduling Camp...' : 'Confirm & Schedule Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Alert Popup Modal when > 300 bags is attempted */}
      {showViolationAlertModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div className="glass-card" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            textAlign: 'center',
            border: '2px solid var(--danger)',
            boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <ShieldAlert size={36} color="var(--danger)" />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '8px' }}>
              Blood Collection Limit Alert!
            </h3>

            <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '20px' }}>
              <strong>Maximum allowed collection limit is {orgLimit} blood bags.</strong>
              <br />
              Please reduce the target to <strong>{orgLimit} bags or below</strong>, or submit an additional quota request for Super Admin approval before scheduling this camp.
            </p>

            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              fontSize: '0.84rem',
              color: 'var(--text-muted)',
              marginBottom: '24px',
              textAlign: 'left',
            }}>
              <div>• Current Attempted Target: <strong style={{ color: 'var(--danger)' }}>{formData.expected_blood_bags} Bags</strong></div>
              <div>• Maximum Approved Limit: <strong>{orgLimit} Bags</strong></div>
              <div>• Status: <strong style={{ color: 'var(--danger)' }}>Submission Blocked</strong></div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowViolationAlertModal(false);
                  setFormData({ ...formData, expected_blood_bags: String(orgLimit) });
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Set to {orgLimit} Bags (Max Allowed)
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowViolationAlertModal(false);
                  setShowCreateModal(false);
                  navigate('/organization/quota');
                }}
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                Request Quota <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Alert Popup Modal when a Schedule Conflict occurs on same date & time */}
      {conflictModalData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div className="glass-card" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '32px',
            textAlign: 'center',
            border: '2px solid #f59e0b',
            boxShadow: '0 10px 40px rgba(245, 158, 11, 0.25)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <AlertTriangle size={36} color="#d97706" />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginBottom: '8px' }}>
              Camp Schedule Conflict Detected!
            </h3>

            <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '20px' }}>
              Another blood donation camp is already scheduled on <strong>{conflictModalData.date}</strong> during this time slot.
              <br />
              <strong>Two camps cannot be scheduled on the same date and overlapping time.</strong>
            </p>

            <div style={{
              padding: '14px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              fontSize: '0.84rem',
              color: 'var(--text-muted)',
              marginBottom: '24px',
              textAlign: 'left',
            }}>
              <div style={{ marginBottom: '6px' }}>• Existing Drive: <strong style={{ color: 'var(--text-main)' }}>{conflictModalData.name}</strong></div>
              <div style={{ marginBottom: '6px' }}>• Organization: <strong>{conflictModalData.organization || 'Registered Blood Bank'}</strong></div>
              <div style={{ marginBottom: '6px' }}>• Date & Time: <strong>{conflictModalData.date} ({conflictModalData.start_time} - {conflictModalData.end_time})</strong></div>
              {conflictModalData.location && (
                <div>• Venue: <span>{conflictModalData.location}, {conflictModalData.city}</span></div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setConflictModalData(null)}
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#d97706', border: 'none' }}
              >
                Change Date / Time Slot
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

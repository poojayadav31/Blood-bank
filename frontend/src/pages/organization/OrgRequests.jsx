import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Phone,
  Send,
} from 'lucide-react';

export default function OrgRequests() {
  const { user } = useAuth();
  const [requestsList, setRequestsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fulfillModalReq, setFulfillModalReq] = useState(null);
  const [unitsToFulfill, setUnitsToFulfill] = useState('1');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = () => {
    setLoading(true);
    request('/blood-requests')
      .then((res) => {
        if (res.success) setRequestsList(res.requests);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenFulfill = (req) => {
    setFulfillModalReq(req);
    setUnitsToFulfill(String(req.quantity));
    setRemarks(`Dispatched by ${user?.organization?.name || 'Blood Centre'} on ${new Date().toLocaleDateString()}`);
    setError(null);
  };

  const handleConfirmFulfill = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      const res = await request(`/blood-requests/${fulfillModalReq.id}/fulfill`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'fulfilled',
          units_to_fulfill: parseInt(unitsToFulfill),
          remarks,
        }),
      });

      if (res.success) {
        setFulfillModalReq(null);
        fetchRequests();
      }
    } catch (err) {
      setError(err.message || 'Failed to fulfill request.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Hospital Blood Dispatch
        </span>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
          Hospital Blood Requests
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Review emergency and routine blood transfusion orders from regional hospitals and fulfill them from available stock.
        </p>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading hospital requests...</div>
      ) : requestsList.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No Pending Hospital Requests</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            All clinical blood demands are currently satisfied.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {requestsList.map((req) => {
            const isCritical = req.urgency === 'Critical';

            return (
              <div
                key={req.id}
                className="glass-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${isCritical ? 'var(--danger)' : req.urgency === 'Urgent' ? 'var(--warning)' : 'var(--border-color)'}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className={`badge badge-${req.status}`}>{req.status}</span>
                    <span style={{
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      color: isCritical ? 'var(--danger)' : req.urgency === 'Urgent' ? 'var(--warning)' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}>
                      ⚡ {req.urgency} Urgency
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div className="blood-pill" style={{ width: '42px', height: '42px', fontSize: '1rem' }}>
                      {req.blood_group}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{req.hospital_name}</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Contact: {req.contact_person} ({req.contact_phone})
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                    Required Units: <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>{req.quantity} Bags</strong> • By: <strong>{req.required_by_date}</strong>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: '4px 0 14px', backgroundColor: 'var(--bg-card-subtle)', padding: '10px', borderRadius: '8px' }}>
                    <strong>Clinical Indication:</strong> {req.patient_case || 'Emergency transfusion'}
                  </p>

                  {req.fulfilled_by_org_name && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700, marginBottom: '10px' }}>
                      ✔ Fulfilled by {req.fulfilled_by_org_name} ({req.fulfilled_units} units)
                    </div>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                    <button
                      onClick={() => handleOpenFulfill(req)}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '9px', fontSize: '0.88rem' }}
                    >
                      <CheckCircle2 size={16} /> Fulfill from Inventory
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fulfill Modal */}
      {fulfillModalReq && (
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
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              Fulfill Blood Request
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {fulfillModalReq.hospital_name} • Blood Group: <strong style={{ color: 'var(--primary)' }}>{fulfillModalReq.blood_group}</strong>
            </p>

            {error && (
              <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.86rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleConfirmFulfill}>
              <div className="form-group">
                <label className="form-label">Units to Dispatch</label>
                <input
                  type="number"
                  min="1"
                  max={fulfillModalReq.quantity}
                  required
                  className="form-input"
                  value={unitsToFulfill}
                  onChange={(e) => setUnitsToFulfill(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dispatch Remarks / Dispatch Note</label>
                <textarea
                  rows="3"
                  className="form-textarea"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setFulfillModalReq(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={processing} className="btn btn-primary" style={{ flex: 1 }}>
                  {processing ? 'Fulfilling...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

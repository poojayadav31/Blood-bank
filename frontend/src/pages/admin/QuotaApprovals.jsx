import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  ArrowRight,
  FileText,
  Clock,
} from 'lucide-react';

export default function QuotaApprovals() {
  const [quotaRequests, setQuotaRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState('approved');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchQuotaRequests = () => {
    setLoading(true);
    request('/quota-requests')
      .then((res) => {
        if (res.success) setQuotaRequests(res.quotaRequests);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuotaRequests();
  }, []);

  const handleOpenReview = (req, action) => {
    setSelectedReq(req);
    setActionType(action);
    setAdminRemarks(action === 'approved' ? 'Approved based on certified storage and phlebotomy capacity.' : '');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const res = await request(`/quota-requests/${selectedReq.id}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          status: actionType,
          admin_remarks: adminRemarks,
        }),
      });

      if (res.success) {
        setSelectedReq(null);
        fetchQuotaRequests();
      }
    } catch (err) {
      alert(err.message || 'Failed to review quota request.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Collection Limit Authorizations
        </span>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
          Additional Quota Approval Workflow
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Review and approve requests from organizations needing collection limits beyond the standard 300 blood bags threshold.
        </p>
      </div>

      {/* Grid of Quota Requests */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading quota requests...</div>
      ) : quotaRequests.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No Pending Quota Requests</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            All organizations are operating within their approved standard quotas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {quotaRequests.map((req) => (
            <div key={req.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className={`badge badge-${req.status}`}>{req.status}</span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{req.created_at}</span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
                  {req.organization_name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Reg: {req.registration_number} • City: {req.org_city}
                </div>

                {/* Limit Increase Stat Card */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  marginBottom: '16px',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Limit</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{req.current_limit} Bags</div>
                  </div>
                  <ArrowRight size={22} color="var(--primary)" />
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 800 }}>Requested Limit</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{req.requested_limit} Bags</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.86rem', marginBottom: '14px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Justification Reason:</span>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, backgroundColor: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    "{req.reason}"
                  </p>
                </div>

                {req.admin_remarks && (
                  <div style={{ fontSize: '0.82rem', padding: '10px', borderRadius: '8px', backgroundColor: req.status === 'approved' ? 'var(--success-light)' : 'var(--danger-light)', color: req.status === 'approved' ? 'var(--success)' : 'var(--danger)', marginBottom: '14px' }}>
                    <strong>Admin Remarks:</strong> {req.admin_remarks}
                  </div>
                )}
              </div>

              {req.status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => handleOpenReview(req, 'approved')}
                    className="btn btn-success"
                    style={{ flex: 1, padding: '9px' }}
                  >
                    <CheckCircle2 size={16} /> Approve ({req.requested_limit} Bags)
                  </button>
                  <button
                    onClick={() => handleOpenReview(req, 'rejected')}
                    className="btn btn-danger"
                    style={{ flex: 1, padding: '9px' }}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReq && (
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
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              {actionType === 'approved' ? 'Approve Additional Quota' : 'Reject Quota Request'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {selectedReq.organization_name} • Requested: <strong>{selectedReq.requested_limit} Blood Bags</strong>
            </p>

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">Official Review Remarks / Decision Note *</label>
                <textarea
                  required
                  rows="4"
                  className="form-textarea"
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setSelectedReq(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`btn ${actionType === 'approved' ? 'btn-success' : 'btn-danger'}`}
                  style={{ flex: 1 }}
                >
                  {processing ? 'Processing...' : actionType === 'approved' ? `Confirm Approval (${selectedReq.requested_limit} Bags)` : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  FileText,
} from 'lucide-react';

export default function QuotaRequestPage() {
  const { user } = useAuth();
  const currentLimit = user?.organization?.collection_limit || 300;

  const [quotaRequests, setQuotaRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [requestedLimit, setRequestedLimit] = useState('300');
  const [reason, setReason] = useState('');
  const [docUrl, setDocUrl] = useState('/uploads/docs/quota_expansion_plan.pdf');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await request('/quota-requests', {
        method: 'POST',
        body: JSON.stringify({
          requested_limit: parseInt(requestedLimit),
          reason,
          supporting_doc_url: docUrl,
        }),
      });

      if (res.success) {
        setShowSubmitModal(false);
        setReason('');
        fetchQuotaRequests();
      }
    } catch (err) {
      setMsg(err.message || 'Failed to submit quota request.');
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
            Collection Capacity Authorizations
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
            Additional Quota Requests
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Current Active Limit: <strong style={{ color: 'var(--primary)' }}>{currentLimit} Blood Bags</strong>. Submit quota increase requests for mega blood drives or disaster relief campaigns.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
        >
          <PlusCircle size={18} /> Request Limit Increase
        </button>
      </div>

      {/* Info Card */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck size={22} color="var(--primary)" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Standard vs Expanded Quota Policy</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Standard quota is 300 bags. Requests above 300 bags require Super Admin review and are granted based on certified cold storage and phlebotomy capacity.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Max Target</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{currentLimit} Bags</div>
        </div>
      </div>

      {/* Requests History List */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
          Quota Increase Applications History
        </h3>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading requests...</div>
        ) : quotaRequests.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
            No quota increase requests submitted yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {quotaRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge badge-${req.status}`}>{req.status}</span>
                    <strong style={{ fontSize: '1.05rem' }}>
                      Request to Increase Limit: {req.current_limit} → {req.requested_limit} Bags
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{req.created_at}</span>
                </div>

                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <strong>Justification:</strong> "{req.reason}"
                </div>

                {req.admin_remarks && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: req.status === 'approved' ? 'var(--success-light)' : 'var(--danger-light)',
                    color: req.status === 'approved' ? 'var(--success)' : 'var(--danger)',
                    fontSize: '0.82rem',
                  }}>
                    <strong>Super Admin Remarks:</strong> {req.admin_remarks} {req.reviewed_at ? `(Reviewed on ${req.reviewed_at})` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Quota Request Modal */}
      {showSubmitModal && (
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
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '30px' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>
              Request Additional Blood Quota
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Current Limit: <strong>{currentLimit} Blood Bags</strong>
            </p>

            {msg && (
              <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.86rem' }}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">New Target Quota Limit (Bags) *</label>
                <input
                  type="number"
                  min="50"
                  max="300"
                  step="10"
                  required
                  className="form-input"
                  placeholder="e.g. 300"
                  value={requestedLimit}
                  onChange={(e) => setRequestedLimit(e.target.value)}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Maximum platform collection limit is strictly capped at 300 blood bags.</span>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Campaign Justification & Capacity Rationale *</label>
                <textarea
                  required
                  rows="4"
                  className="form-textarea"
                  placeholder="Explain event scale, venue infrastructure, mobile vans, cold storage capabilities..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Supporting Capacity Document URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowSubmitModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {submitting ? 'Submitting...' : 'Submit to Super Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

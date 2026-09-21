import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Shield,
  FileText,
  Sliders,
} from 'lucide-react';

export default function OrgManagement() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [actionModalOrg, setActionModalOrg] = useState(null);
  const [newStatus, setNewStatus] = useState('approved');
  const [customLimit, setCustomLimit] = useState('300');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrgs = () => {
    setLoading(true);
    let url = `/organizations?`;
    if (statusFilter) url += `status=${statusFilter}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    request(url)
      .then((res) => {
        if (res.success) setOrgs(res.organizations);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrgs();
  }, [statusFilter, search]);

  const handleOpenAction = (org, targetStatus) => {
    setActionModalOrg(org);
    setNewStatus(targetStatus);
    setCustomLimit(String(org.collection_limit || 300));
    setRemarks('');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const res = await request(`/organizations/${actionModalOrg.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          collection_limit: parseInt(customLimit),
          rejection_reason: remarks,
        }),
      });

      if (res.success) {
        setActionModalOrg(null);
        fetchOrgs();
      }
    } catch (err) {
      alert(err.message || 'Failed to update organization status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Accreditation & Registry
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
            Organization Management
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Review institutional applications, approve blood bank licenses, configure collection quotas, or suspend non-compliant organizations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '18px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search organization name, city, or license reg number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: '0 1 200px' }}>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved & Active</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Organization Name</th>
                <th>Registration No.</th>
                <th>Type</th>
                <th>Location</th>
                <th>Nodal Contact</th>
                <th>Active Limit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading organizations...
                  </td>
                </tr>
              ) : orgs.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No organizations found matching the selected filter.
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr key={org.id}>
                    <td style={{ fontWeight: 700 }}>#{org.id}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{org.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{org.email}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-card-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                        {org.registration_number}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{org.type}</td>
                    <td style={{ fontSize: '0.84rem' }}>{org.city}, {org.state}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      <div>{org.contact_person}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{org.phone}</div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--primary)' }}>{org.collection_limit} Bags</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${org.status}`}>{org.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {org.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleOpenAction(org, 'approved')}
                              className="btn btn-success"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenAction(org, 'rejected')}
                              className="btn btn-danger"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Reject
                            </button>
                          </>
                        ) : org.status === 'approved' ? (
                          <>
                            <button
                              onClick={() => handleOpenAction(org, 'approved')}
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Adjust Limit
                            </button>
                            <button
                              onClick={() => handleOpenAction(org, 'suspended')}
                              className="btn btn-danger"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Suspend
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(org, 'approved')}
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Re-Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {actionModalOrg && (
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
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              Update Organization Status: {actionModalOrg.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Reg: {actionModalOrg.registration_number} • City: {actionModalOrg.city}
            </p>

            <form onSubmit={handleSaveStatus}>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="approved">Approved & Active</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {newStatus === 'approved' && (
                <div className="form-group">
                  <label className="form-label">Approved Blood Collection Limit (Bags)</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    required
                    className="form-input"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard default is 300 blood bags per camp.</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Super Admin Remarks / Reason</label>
                <textarea
                  rows="3"
                  className="form-textarea"
                  placeholder="e.g. License verified against drug controller registry."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setActionModalOrg(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="btn btn-primary" style={{ flex: 1 }}>
                  {updating ? 'Saving...' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

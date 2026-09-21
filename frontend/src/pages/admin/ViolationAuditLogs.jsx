import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
} from 'lucide-react';

export default function ViolationAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    let url = `/audit/logs?`;
    if (statusFilter) url += `status=${statusFilter}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    request(url)
      .then((res) => {
        if (res.success) setLogs(res.logs);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, search]);

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Compliance & Security Audits
        </span>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
          Violation Attempts & System Audit Logs
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Immutable log trail capturing blood collection limit violations, quota decisions, accreditation approvals, and authorization events.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '18px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search action, organization, or violation details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: '0 1 220px' }}>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="violation_attempt">🚨 Violation Attempts Only</option>
            <option value="success">Success Events</option>
            <option value="failed">Failed Actions</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>User / Role</th>
                <th>Action Code</th>
                <th>Entity Type</th>
                <th>Audit Details</th>
                <th>IP Address</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No audit records matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isViolation = log.status === 'violation_attempt';

                  return (
                    <tr
                      key={log.id}
                      style={{
                        backgroundColor: isViolation ? 'var(--danger-light)' : 'transparent',
                      }}
                    >
                      <td style={{ fontWeight: 700 }}>#{log.id}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {log.timestamp}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.user_name || 'System / Public'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Role: {log.user_role}</div>
                      </td>
                      <td>
                        <code style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: isViolation ? '#dc2626' : 'var(--primary)',
                          backgroundColor: 'var(--bg-card)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                        }}>
                          {log.action}
                        </code>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}</td>
                      <td style={{ fontSize: '0.84rem', maxWidth: '380px' }}>
                        {log.details}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {log.ip_address}
                      </td>
                      <td>
                        <span className={`badge ${isViolation ? 'badge-rejected' : 'badge-approved'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

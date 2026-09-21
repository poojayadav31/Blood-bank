import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import BloodGroupChart from '../../components/charts/BloodGroupChart';
import {
  Building2,
  Calendar,
  Droplet,
  Users,
  AlertTriangle,
  ShieldAlert,
  FileCheck,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request('/analytics/super-admin')
      .then((res) => {
        if (res.success) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Super Admin Dashboard Analytics...</div>;
  }

  const stats = data?.stats || {};

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Central Monitoring Authority
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px', letterSpacing: '-0.02em' }}>
            Super Admin Platform Overview
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin/calendar" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.86rem' }}>
            <Calendar size={16} />
            Allotment Calendar
          </Link>
          <Link to="/admin/quota-approvals" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.86rem' }}>
            <FileCheck size={16} />
            Quota Requests ({stats.pendingQuotaRequests || 0})
          </Link>
          <Link to="/admin/organizations" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.86rem' }}>
            <Building2 size={16} />
            Orgs ({stats.pendingOrganizations || 0})
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
        <StatsCard
          title="Organizations"
          value={stats.totalOrganizations}
          subtitle={`${stats.approvedOrganizations} Approved • ${stats.pendingOrganizations} Pending`}
          icon={Building2}
          color="var(--secondary)"
          badge={{ text: 'Multi-Org', type: 'approved' }}
        />
        <StatsCard
          title="Active Camps"
          value={stats.activeCamps}
          subtitle={`${stats.totalCamps} total drives organized`}
          icon={Calendar}
          color="var(--success)"
        />
        <StatsCard
          title="Total Blood Stock"
          value={`${stats.totalAvailableStock} Units`}
          subtitle={`${stats.totalIssuedUnits} units issued to hospitals`}
          icon={Droplet}
          color="var(--primary)"
        />
        <StatsCard
          title="Violation Attempts"
          value={stats.violationAttemptsCount}
          subtitle="Strict 300-bag limits enforced"
          icon={ShieldAlert}
          color="var(--danger)"
          badge={{ text: 'Security', type: 'rejected' }}
        />
      </div>

      {/* Charts & Organization Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* Blood Group Distribution Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>National Blood Inventory Distribution</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Available vs Issued units by Blood Group</p>
            </div>
            <Link to="/admin/inventory" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
              Full Matrix →
            </Link>
          </div>
          <BloodGroupChart data={data?.bloodGroupStock || []} />
        </div>

        {/* Top Organizations Performance */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Organization Performance</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Collection volume & approved collection limits</p>
            </div>
            <Link to="/admin/organizations" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
              Manage →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.orgPerformance?.map((org, idx) => (
              <div
                key={org.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{org.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {org.city} • {org.total_camps} Camps • Max Limit: <strong>{org.collection_limit} Bags</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {org.total_collected} Bags
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Collected</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Violation Attempts & Security Log */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} color="var(--danger)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Recent Blood Collection Limit Violations</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Automatic blocking & auditing of attempts exceeding 300 blood bags</p>
            </div>
          </div>
          <Link to="/admin/violations" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            View Full Audit Logs
          </Link>
        </div>

        {data?.recentViolations?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '16px 0' }}>
            No limit violation attempts recorded. All organizations adhering to approved quotas.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Trigger</th>
                  <th>Details & Offending Quantity</th>
                  <th>IP Address</th>
                  <th>System Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentViolations?.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {log.timestamp}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 700 }}>
                        {log.action}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {log.details}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {log.ip_address}
                    </td>
                    <td>
                      <span className="badge badge-rejected">Blocked</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

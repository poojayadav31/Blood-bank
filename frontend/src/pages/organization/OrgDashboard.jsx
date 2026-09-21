import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import BloodGroupChart from '../../components/charts/BloodGroupChart';
import {
  Calendar,
  Droplet,
  Users,
  FileCheck,
  PlusCircle,
  Clock,
  MapPin,
  HeartHandshake,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrgDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request('/analytics/organization')
      .then((res) => {
        if (res.success) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Organization Dashboard...</div>;
  }

  const stats = data?.stats || {};
  const org = data?.organization || {};

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Organization Control Center
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
            {org.name || 'Organization Dashboard'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Reg: {org.registration_number} • City: {org.city}, {org.state}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/organization/create-camp" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.86rem' }}>
            <PlusCircle size={16} /> Schedule Blood Camp
          </Link>
          <Link to="/organization/quota" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.86rem' }}>
            <FileCheck size={16} /> Request Quota
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
        <StatsCard
          title="Collection Quota Limit"
          value={`${stats.collectionLimit} Bags`}
          subtitle="Max target per camp"
          icon={AlertOctagon}
          color="var(--primary)"
          badge={{ text: stats.collectionLimit > 300 ? 'Expanded' : 'Standard', type: stats.collectionLimit > 300 ? 'approved' : 'pending' }}
        />
        <StatsCard
          title="Current Available Stock"
          value={`${stats.currentAvailableStock} Units`}
          subtitle={`${stats.totalIssuedUnits} units issued`}
          icon={Droplet}
          color="var(--secondary)"
        />
        <StatsCard
          title="Total Blood Collected"
          value={`${stats.totalBloodCollected} Bags`}
          subtitle={`Across ${stats.activeCamps + stats.upcomingCampsCount} drives`}
          icon={Calendar}
          color="var(--success)"
        />
        <StatsCard
          title="Registered Donors"
          value={stats.registeredDonors}
          subtitle="Participated in org camps"
          icon={Users}
          color="var(--warning)"
        />
      </div>

      {/* Charts & Upcoming Camps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
        
        {/* Blood Group Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Organization Blood Inventory</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Real-time stock across 8 blood groups</p>
            </div>
            <Link to="/organization/inventory" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
              Manage Stock →
            </Link>
          </div>
          <BloodGroupChart data={data?.bloodGroupStock || []} />
        </div>

        {/* Upcoming Blood Donation Camps */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Upcoming Blood Camps</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Scheduled donation drives & targets</p>
            </div>
            <Link to="/organization/camps" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
              All Camps →
            </Link>
          </div>

          {data?.upcomingCamps?.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No upcoming camps scheduled. Click "Schedule Blood Camp" to organize a drive.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data?.upcomingCamps?.map((camp) => (
                <div
                  key={camp.id}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className={`badge badge-${camp.status}`}>{camp.status}</span>
                      <strong style={{ fontSize: '0.92rem' }}>{camp.name}</strong>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                      <span>📅 {camp.date}</span>
                      <span>⏰ {camp.start_time} - {camp.end_time}</span>
                      <span>📍 {camp.location}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {camp.expected_blood_bags} Bags Target
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Collected: {camp.collected_blood_bags || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

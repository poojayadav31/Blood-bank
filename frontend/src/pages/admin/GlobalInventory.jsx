import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import BloodInventoryGrid from '../../components/common/BloodInventoryGrid';
import { Layers, Building2, Droplet, ArrowDownUp } from 'lucide-react';

export default function GlobalInventory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request('/inventory/global')
      .then((res) => {
        if (res.success) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Global Blood Inventory...</div>;
  }

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Aggregate Stock Reserves
        </span>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
          National Blood Inventory Matrix
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Real-time aggregated blood availability across all approved institutional blood banks.
        </p>
      </div>

      {/* Aggregate Visual Grid */}
      <div style={{ marginBottom: '36px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
          Total Available Stock Across 8 Blood Groups
        </h3>
        <BloodInventoryGrid inventory={data?.globalInventory || []} readOnly={true} />
      </div>

      {/* Breakdown by Organization */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={20} color="var(--primary)" />
          Stock Breakdown by Organization
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Org ID</th>
                <th>Organization Name</th>
                <th>City</th>
                <th>Total Available Stock</th>
                <th>Total Units Issued</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.organizationBreakdown?.map((org) => (
                <tr key={org.organization_id}>
                  <td style={{ fontWeight: 700 }}>#{org.organization_id}</td>
                  <td>
                    <strong style={{ color: 'var(--text-main)' }}>{org.organization_name}</strong>
                  </td>
                  <td>{org.city}</td>
                  <td>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>
                      {org.total_available || 0} Bags
                    </strong>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--secondary)' }}>
                      {org.total_issued || 0} Bags
                    </strong>
                  </td>
                  <td>
                    <span className="badge badge-approved">Active & Certified</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

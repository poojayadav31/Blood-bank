import React from 'react';
import { AlertCircle, CheckCircle2, Droplet } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodInventoryGrid({ inventory = [], onAdjustStock, readOnly = false }) {
  const invMap = {};
  inventory.forEach(item => {
    invMap[item.blood_group] = item;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
      {BLOOD_GROUPS.map((bg) => {
        const item = invMap[bg] || { blood_group: bg, available_units: 0, reserved_units: 0, expired_units: 0, issued_units: 0 };
        const available = parseInt(item.available_units || 0);
        const isCritical = available <= 3;
        const isLow = available > 3 && available < 10;
        const isHealthy = available >= 10;

        return (
          <div
            key={bg}
            className="glass-card"
            style={{
              padding: '18px',
              borderLeft: `4px solid ${isCritical ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)'}`,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div className="blood-pill">
                {bg}
              </div>
              <div>
                {isCritical && (
                  <span className="badge badge-critical" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> Critical
                  </span>
                )}
                {isLow && (
                  <span className="badge badge-pending" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> Low Stock
                  </span>
                )}
                {isHealthy && (
                  <span className="badge badge-healthy" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Healthy
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Available Units</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                  {available} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Bags</span>
                </span>
              </div>
              
              {/* Visual meter */}
              <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
                <div
                  style={{
                    width: `${Math.min(100, (available / 35) * 100)}%`,
                    height: '100%',
                    backgroundColor: isCritical ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.76rem', textAlign: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Reserved</span>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.reserved_units || 0}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Issued</span>
                <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{item.issued_units || 0}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Expired</span>
                <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{item.expired_units || 0}</div>
              </div>
            </div>

            {!readOnly && onAdjustStock && (
              <button
                onClick={() => onAdjustStock(item)}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '12px', padding: '6px', fontSize: '0.78rem' }}
              >
                Adjust Stock
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import BloodInventoryGrid from '../../components/common/BloodInventoryGrid';
import {
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sliders,
  PlusCircle,
} from 'lucide-react';

export default function OrgInventory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustItem, setAdjustItem] = useState(null);
  const [availableUnits, setAvailableUnits] = useState('0');
  const [reservedUnits, setReservedUnits] = useState('0');
  const [reason, setReason] = useState('Inventory audit reconciliation');
  const [saving, setSaving] = useState(false);

  const fetchInventory = () => {
    setLoading(true);
    request('/inventory')
      .then((res) => {
        if (res.success) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdjust = (item) => {
    setAdjustItem(item);
    setAvailableUnits(String(item.available_units || 0));
    setReservedUnits(String(item.reserved_units || 0));
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await request('/inventory/update', {
        method: 'PUT',
        body: JSON.stringify({
          blood_group: adjustItem.blood_group,
          available_units: parseInt(availableUnits),
          reserved_units: parseInt(reservedUnits),
          adjustment_reason: reason,
        }),
      });

      if (res.success) {
        setAdjustItem(null);
        fetchInventory();
      }
    } catch (err) {
      alert(err.message || 'Failed to adjust stock.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Blood Stock Inventory...</div>;
  }

  const summary = data?.summary || {};

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Real-time Cold Storage Matrix
        </span>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
          Blood Inventory Management
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Monitor available units, reserved hospital quotas, low stock alerts, and shelf-life expiration dates.
        </p>
      </div>

      {/* Alerts Banners if Low / Critical Stock */}
      {(summary.criticalStockAlerts?.length > 0 || summary.lowStockAlerts?.length > 0) && (
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {summary.criticalStockAlerts?.map((alert) => (
            <div
              key={alert.blood_group}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                backgroundColor: 'var(--danger-light)',
                border: '1px solid var(--danger)',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={18} color="var(--danger)" />
              <span>
                <strong>CRITICAL SHORTAGE:</strong> Blood group <strong>{alert.blood_group}</strong> has only <strong>{alert.available} unit(s)</strong> available. Please organize a blood camp.
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 8-Blood Group Grid */}
      <div style={{ marginBottom: '32px' }}>
        <BloodInventoryGrid inventory={data?.inventory || []} onAdjustStock={handleOpenAdjust} />
      </div>

      {/* Expiring Batches Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="var(--primary)" />
          Expiring Blood Batches (Next 7 Days)
        </h3>

        {data?.expiringBatches?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No batches expiring within the next 7 days. Cold chain shelf-life healthy.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Collection Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.expiringBatches?.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700 }}>BATCH-{b.id}</td>
                    <td>
                      <span className="blood-pill" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                        {b.blood_group}
                      </span>
                    </td>
                    <td><strong>{b.units} Unit(s)</strong></td>
                    <td style={{ fontSize: '0.82rem' }}>{b.collection_date}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 700 }}>{b.expiry_date}</td>
                    <td>
                      <span className="badge badge-pending">Expiring Soon</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {adjustItem && (
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
          <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              Adjust Stock: {adjustItem.blood_group}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Manual inventory audit adjustment
            </p>

            <form onSubmit={handleSaveStock}>
              <div className="form-group">
                <label className="form-label">Available Units</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="form-input"
                  value={availableUnits}
                  onChange={(e) => setAvailableUnits(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reserved Units</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="form-input"
                  value={reservedUnits}
                  onChange={(e) => setReservedUnits(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Audit Adjustment Reason</label>
                <textarea
                  rows="2"
                  className="form-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setAdjustItem(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

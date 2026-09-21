import React from 'react';
import { AlertOctagon, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BloodLimitWarning({ limit = 300, currentTarget = 0, showQuotaLink = true }) {
  const isViolated = parseInt(currentTarget) > parseInt(limit);

  if (!isViolated) return null;

  return (
    <div className="limit-violation-banner" style={{ marginTop: '12px', marginBottom: '16px' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AlertOctagon size={22} color="#dc2626" />
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#991b1b', marginBottom: '2px' }}>
          Blood Collection Limit Exceeded!
        </div>
        <p style={{ fontSize: '0.85rem', color: '#7f1d1d', lineHeight: 1.4, margin: 0 }}>
          Maximum allowed collection limit is <strong>{limit} blood bags</strong>. Please reduce the target or request approval from Super Admin.
          (Attempted: <strong>{currentTarget} bags</strong>).
        </p>
      </div>

      {showQuotaLink && (
        <Link
          to="/organization/quota"
          className="btn btn-danger"
          style={{
            fontSize: '0.78rem',
            padding: '6px 12px',
            whiteSpace: 'nowrap',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          Request Quota
          <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
  );
}

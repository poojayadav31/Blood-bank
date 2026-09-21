import React from 'react';

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'var(--primary)', trend, badge }) {
  return (
    <div className="glass-card" style={{ padding: '22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </p>
          <h3 style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {value}
          </h3>
        </div>
        {Icon && (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: `${color}18`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={24} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>{subtitle}</span>
        {badge && (
          <span className={`badge ${badge.type ? `badge-${badge.type}` : 'badge-primary'}`}>
            {badge.text}
          </span>
        )}
        {trend && (
          <span style={{ fontWeight: 700, color: trend.isPositive ? 'var(--success)' : 'var(--danger)' }}>
            {trend.text}
          </span>
        )}
      </div>
    </div>
  );
}

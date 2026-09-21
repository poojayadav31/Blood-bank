import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function BloodGroupChart({ data = [] }) {
  const formattedData = data.map((item) => ({
    name: item.blood_group,
    available: parseInt(item.available || item.available_units || 0),
    issued: parseInt(item.issued || item.issued_units || 0),
  }));

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              borderRadius: '10px',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
          <Bar dataKey="available" name="Available Units" fill="#e11d48" radius={[4, 4, 0, 0]} />
          <Bar dataKey="issued" name="Issued Units" fill="#0284c7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

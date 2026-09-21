import React, { useState } from 'react';
import { request } from '../../services/api';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Table,
  Layers,
  Calendar,
  Users,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export default function GlobalReports() {
  const [reportType, setReportType] = useState('inventory');
  const [format, setFormat] = useState('json');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      if (format === 'csv' || format === 'xlsx') {
        // Trigger browser file download
        const token = localStorage.getItem('bbms_token');
        const url = `/api/reports?type=${reportType}&format=${format}`;
        window.open(url, '_blank');
      } else {
        const res = await request(`/reports?type=${reportType}&format=json`);
        if (res.success) setData(res);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Intelligence & Data Exports
        </span>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
          Platform Reports Generator
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Export comprehensive reports for audit compliance, ministry reporting, and inventory forecasting in PDF, Excel (XLSX), and CSV formats.
        </p>
      </div>

      {/* Control Form */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label className="form-label">Report Category</label>
            <select className="form-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="inventory">Blood Inventory & Stock Levels</option>
              <option value="camps">Blood Donation Camps & Collection</option>
              <option value="donors">Registered Donors Master Data</option>
              <option value="organizations">Organizations & Accreditations</option>
              <option value="requests">Hospital Blood Requests & Transfusions</option>
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Export Format</label>
            <select className="form-select" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="json">Interactive Table Preview (JSON)</option>
              <option value="xlsx">Microsoft Excel Spreadsheet (.xlsx)</option>
              <option value="csv">Standard Comma-Separated Values (.csv)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '10px 22px' }}>
              {format === 'json' ? <Table size={16} /> : <Download size={16} />}
              {loading ? 'Generating...' : format === 'json' ? 'Preview Report' : `Download ${format.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>

      {/* Report Table Display */}
      {data && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{data.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Generated {data.count} records on {new Date().toLocaleDateString()}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  window.open(`/api/reports?type=${reportType}&format=csv`, '_blank');
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <Download size={14} /> Export CSV
              </button>
              <button
                onClick={() => {
                  window.open(`/api/reports?type=${reportType}&format=xlsx`, '_blank');
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <FileSpreadsheet size={14} color="#16a34a" /> Export Excel
              </button>
            </div>
          </div>

          {data.data.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>No records found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    {Object.keys(data.data[0]).map((key) => (
                      <th key={key} style={{ textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} style={{ fontSize: '0.85rem' }}>
                          {String(val !== null && val !== undefined ? val : '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CertificateModal from '../../components/common/CertificateModal';
import {
  HeartHandshake,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Droplet,
  Calendar,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VolunteerPortal() {
  const { user } = useAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [activeCamp, setActiveCamp] = useState(null);
  const [campsList, setCampsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vitalBp, setVitalBp] = useState('120/80');
  const [vitalHb, setVitalHb] = useState('14.2');
  const [vitalWeight, setVitalWeight] = useState('68');
  const [bloodBags, setBloodBags] = useState('1');

  const [generatedCert, setGeneratedCert] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    request(`/camps?organization_id=${user?.organization_id || 1}&status=active`)
      .then((res) => {
        if (res.success && res.camps.length > 0) {
          setCampsList(res.camps);
          setActiveCamp(res.camps[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleRecordDonation = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setMsg({ type: 'error', text: 'Please enter or scan a valid QR Pass Token.' });
      return;
    }

    setProcessing(true);
    setMsg(null);

    try {
      const res = await request('/camps/record-donation', {
        method: 'POST',
        body: JSON.stringify({
          qr_code_token: tokenInput.trim(),
          vital_bp: vitalBp,
          vital_hb: parseFloat(vitalHb),
          vital_weight: parseFloat(vitalWeight),
          blood_bags_collected: parseInt(bloodBags),
          status: 'donated',
        }),
      });

      if (res.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setMsg({ type: 'success', text: `Donation recorded successfully! Certificate ID: ${res.certificate_id}` });
        
        // Fetch certificate details
        const certRes = await request(`/donors/certificate/${res.certificate_id}`);
        if (certRes.success) {
          setGeneratedCert(certRes.certificate);
        }
        setTokenInput('');
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to record donation.' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Camp Phlebotomy & Check-In Desk
        </span>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
          Volunteer Camp Portal
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Scan donor QR entry passes, verify vital signs & hemoglobin eligibility, and confirm blood units collected.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '28px' }}>
        
        {/* Active Camp Card */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span className="badge badge-active">Live Active Camp</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeCamp?.date}</span>
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
            {activeCamp?.name || 'Mega Youth Blood Donation Camp 2026'}
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            📍 {activeCamp?.location || 'Pragati Maidan Hall 5'}, {activeCamp?.city || 'New Delhi'}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            backgroundColor: 'var(--bg-card-subtle)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
          }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Collected Today</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                {activeCamp?.collected_blood_bags || 145} Bags
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approved Target</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {activeCamp?.expected_blood_bags || 200} Bags
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            ⚡ Sample Pre-Seeded Tokens for Quick Testing:
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <code
                onClick={() => setTokenInput('QR-PASS-CAMP1-D1-987123')}
                style={{ cursor: 'pointer', backgroundColor: 'var(--bg-card)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--primary)', fontWeight: 700 }}
              >
                QR-PASS-CAMP1-D1-987123 (John Doe - Eligible)
              </code>
              <code
                onClick={() => setTokenInput('QR-PASS-CAMP3-D4-771122')}
                style={{ cursor: 'pointer', backgroundColor: 'var(--bg-card)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--secondary)', fontWeight: 700 }}
              >
                QR-PASS-CAMP3-D4-771122 (Priya Sharma - First Time)
              </code>
            </div>
          </div>
        </div>

        {/* Check-In & Record Donation Form */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={22} color="var(--primary)" />
            Donor QR Verification & Donation
          </h3>

          {msg && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: msg.type === 'error' ? 'var(--danger-light)' : 'var(--success-light)',
              color: msg.type === 'error' ? 'var(--danger)' : 'var(--success)',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleRecordDonation}>
            <div className="form-group">
              <label className="form-label">Scan or Enter Donor QR Token *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. QR-PASS-CAMP1-D1-987123"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '14px' }}>
              <div className="form-group">
                <label className="form-label">Blood Pressure</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="120/80"
                  value={vitalBp}
                  onChange={(e) => setVitalBp(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hemoglobin (g/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="14.2"
                  value={vitalHb}
                  onChange={(e) => setVitalHb(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="68"
                  value={vitalWeight}
                  onChange={(e) => setVitalWeight(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Blood Units Collected</label>
              <select className="form-select" value={bloodBags} onChange={(e) => setBloodBags(e.target.value)}>
                <option value="1">1 Blood Bag (Whole Blood ~450ml)</option>
                <option value="2">2 Blood Bags (Double RBC Apheresis)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '20px', padding: '12px', fontSize: '0.96rem' }}
            >
              <UserCheck size={18} />
              {processing ? 'Processing Donation...' : 'Verify & Confirm Donation'}
            </button>
          </form>
        </div>

      </div>

      {/* Verified Certificate Modal */}
      {generatedCert && (
        <CertificateModal
          certificate={generatedCert}
          onClose={() => setGeneratedCert(null)}
        />
      )}

    </div>
  );
}

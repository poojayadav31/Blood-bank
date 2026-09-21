import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import CertificateModal from '../../components/common/CertificateModal';
import {
  Heart,
  Droplet,
  Calendar,
  Award,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [donorData, setDonorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState(null);

  useEffect(() => {
    if (user?.donor?.id) {
      request(`/donors/${user.donor.id}`)
        .then((res) => {
          if (res.success) setDonorData(res.donor);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const donor = donorData || user?.donor || {};
  const eligibility = donor.eligibility || { isEligible: true, reason: 'Eligible to donate blood.' };

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Life Saver Portal
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
            Welcome, {user?.name || donor.name || 'Donor'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Track your life-saving donations, check eligibility countdown, and access your digital QR entry badge.
          </p>
        </div>

        <Link to="/camps" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
          <Calendar size={18} /> Find Nearby Blood Camps
        </Link>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* Donor Profile & Digital ID Badge */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="blood-pill" style={{ width: '54px', height: '54px', fontSize: '1.25rem' }}>
                {donor.blood_group || 'O+'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{user?.name || donor.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Donor ID: #DONOR-{donor.id || 1} • {donor.city || 'Delhi'}
                </div>
              </div>
            </div>

            <span className="badge badge-approved" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Verified
            </span>
          </div>

          {/* Eligibility Indicator */}
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: eligibility.isEligible ? 'var(--success-light)' : 'var(--danger-light)',
            border: `1px solid ${eligibility.isEligible ? 'var(--success)' : 'var(--danger)'}`,
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {eligibility.isEligible ? (
                <CheckCircle2 size={18} color="#059669" />
              ) : (
                <XCircle size={18} color="#dc2626" />
              )}
              <strong style={{ fontSize: '0.92rem', color: eligibility.isEligible ? '#065f46' : '#991b1b' }}>
                {eligibility.isEligible ? 'Eligible to Donate Blood Today!' : 'Not Eligible for Donation Currently'}
              </strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: eligibility.isEligible ? '#047857' : '#7f1d1d', margin: 0 }}>
              {eligibility.reason}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: 'var(--bg-card-subtle)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Donations</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                {donor.total_donations || 0} Times
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Donated</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                {donor.last_donation_date || 'Never'}
              </div>
            </div>
          </div>
        </div>

        {/* Digital QR Pass Card */}
        <div className="glass-card" style={{ padding: '28px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
            Universal Camp QR Pass
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Present this quick QR code at any affiliated blood camp desk
          </p>

          <div style={{
            display: 'inline-block',
            padding: '14px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #e2e8f0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            marginBottom: '14px',
          }}>
            <QRCodeSVG
              value={`QR-BBMS-DONOR-${donor.id || 1}-${donor.blood_group || 'O+'}`}
              size={150}
              bgColor="#ffffff"
              fgColor="#be123c"
              level="M"
            />
          </div>

          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
            QR-BBMS-DONOR-{donor.id || 1}
          </div>
        </div>

      </div>

      {/* Donation History Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={22} color="var(--primary)" />
          Donation History & Digital Certificates
        </h3>

        {donor.history?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>
            No past donation drives recorded yet. Join an active camp to save lives!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Camp Name</th>
                  <th>Organization</th>
                  <th>Date</th>
                  <th>Blood Group</th>
                  <th>Units Donated</th>
                  <th>Certificate ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {donor.history?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.camp_name}</strong>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.camp_location}</div>
                    </td>
                    <td style={{ fontSize: '0.86rem' }}>{item.organization_name}</td>
                    <td style={{ fontSize: '0.84rem' }}>{item.camp_date}</td>
                    <td>
                      <span className="badge badge-primary">{donor.blood_group}</span>
                    </td>
                    <td><strong>{item.blood_bags_collected || 1} Unit</strong></td>
                    <td>
                      {item.certificate_id ? (
                        <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-card-subtle)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {item.certificate_id}
                        </code>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {item.certificate_id && (
                        <button
                          onClick={async () => {
                            const res = await request(`/donors/certificate/${item.certificate_id}`);
                            if (res.success) setActiveCert(res.certificate);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <Download size={14} /> View Certificate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificate Modal View */}
      {activeCert && (
        <CertificateModal
          certificate={activeCert}
          onClose={() => setActiveCert(null)}
        />
      )}

    </div>
  );
}

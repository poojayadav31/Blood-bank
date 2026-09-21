import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Calendar, MapPin, Clock, Droplet, CheckCircle } from 'lucide-react';

export default function DonorPassModal({ registration, camp, donor, onClose }) {
  if (!registration && !camp) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '460px',
        width: '100%',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        position: 'relative',
      }}>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
          color: '#ffffff',
          padding: '20px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '16px',
              top: '16px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: '8px' }}>
            <Droplet size={22} fill="#ffffff" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Camp Entry Pass
          </h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '2px' }}>
            Show this QR code at the camp check-in desk
          </p>
        </div>

        {/* QR Code Container */}
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            marginBottom: '16px',
          }}>
            <QRCodeSVG
              value={registration?.qr_code_token || `QR-CAMP-${camp?.id || 1}-DONOR`}
              size={180}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
            />
          </div>

          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Token ID
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '16px' }}>
            {registration?.qr_code_token || 'QR-BBMS-ENTRY-TOKEN'}
          </div>

          {/* Details */}
          <div style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '12px',
            padding: '14px',
            textAlign: 'left',
            fontSize: '0.86rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Donor Name</span>
              <strong style={{ color: 'var(--text-main)' }}>{donor?.name || 'Registered Donor'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Blood Group</span>
              <span className="badge badge-primary">{donor?.blood_group || 'O+'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Camp</span>
              <strong style={{ color: 'var(--text-main)', textAlign: 'right' }}>{camp?.name || 'Blood Donation Drive'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date & Time</span>
              <strong style={{ color: 'var(--text-main)' }}>{camp?.date || 'Today'} • {camp?.start_time || '09:00'} - {camp?.end_time || '17:00'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Location</span>
              <span style={{ color: 'var(--text-main)', textAlign: 'right' }}>{camp?.location || camp?.city || 'Venue Desk'}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px', padding: '12px' }}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

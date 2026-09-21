import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Award, Download, X, CheckCircle2, Droplet, ShieldCheck } from 'lucide-react';

export default function CertificateModal({ certificate, onClose }) {
  const certRef = useRef(null);

  if (!certificate) return null;

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    try {
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`BBMS_Certificate_${certificate.certificate_id || 'Donor'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

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
        maxWidth: '940px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        padding: '24px',
        position: 'relative',
      }}>
        
        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Digital Donor Certificate</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleDownloadPDF} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Download size={16} /> Download PDF Certificate
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas */}
        <div
          ref={certRef}
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbfb 100%)',
            color: '#0f172a',
            border: '12px solid #be123c',
            outline: '3px solid #fbbf24',
            outlineOffset: '-7px',
            borderRadius: '12px',
            padding: '48px 40px',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            textAlign: 'center',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {/* Watermark Logo */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.04,
            pointerEvents: 'none',
          }}>
            <Droplet size={380} color="#e11d48" fill="#e11d48" />
          </div>

          {/* Org Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Droplet color="#ffffff" size={24} fill="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#be123c', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                {certificate.organization_name || 'National Blood Transfusion Services'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                Reg. No: {certificate.org_reg_number || 'BBMS-REG-2026-GOV'} • Licensed Voluntary Blood Bank
              </p>
            </div>
          </div>

          <div style={{
            display: 'inline-block',
            padding: '4px 18px',
            backgroundColor: '#ffe4e6',
            color: '#be123c',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '20px',
            border: '1px solid #fecdd3',
          }}>
            Certificate of Appreciation
          </div>

          <p style={{ fontSize: '1rem', color: '#475569', margin: '10px 0' }}>
            This certificate is proudly awarded to
          </p>

          <h1 style={{
            fontSize: '2.3rem',
            fontWeight: 800,
            color: '#0f172a',
            fontFamily: "'Outfit', sans-serif",
            margin: '8px 0 16px',
            textDecoration: 'underline',
            textDecorationColor: '#e11d48',
            textUnderlineOffset: '6px',
          }}>
            {certificate.donor_name || 'Valued Blood Donor'}
          </h1>

          <p style={{ fontSize: '1.02rem', color: '#334155', maxWidth: '720px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            In sincere gratitude for selflessly donating <strong>{certificate.blood_bags_collected || 1} unit(s)</strong> of life-saving 
            {' '}<span style={{ display: 'inline-block', padding: '2px 8px', backgroundColor: '#e11d48', color: '#ffffff', borderRadius: '6px', fontWeight: 800 }}>{certificate.blood_group || 'O+'}</span>{' '}
            blood at the <strong>"{certificate.camp_name || 'Blood Donation Drive'}"</strong> conducted on <strong>{certificate.camp_date || new Date().toLocaleDateString()}</strong>.
          </p>

          {/* Certificate Footer with QR Code, Verification Badge, and Signatures */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: '36px',
            paddingTop: '20px',
            borderTop: '1px dashed #cbd5e1',
          }}>
            {/* QR Code */}
            <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <QRCodeSVG
                value={`https://bbms.org/verify-certificate/${certificate.certificate_id}`}
                size={70}
                bgColor="#ffffff"
                fgColor="#be123c"
                level="Q"
              />
              <div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Certificate ID</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{certificate.certificate_id}</div>
                <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <ShieldCheck size={14} /> Digitally Verified
                </div>
              </div>
            </div>

            {/* Verification Stamp */}
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              border: '3px dashed #be123c',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#be123c',
              fontSize: '0.62rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transform: 'rotate(-12deg)',
            }}>
              <Droplet size={18} fill="#be123c" />
              <span>Official</span>
              <span>Blood Seal</span>
            </div>

            {/* Authorized Signature */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'cursive',
                fontSize: '1.4rem',
                color: '#1e293b',
                marginBottom: '2px',
              }}>
                {certificate.org_officer || 'Dr. Medical Director'}
              </div>
              <div style={{ width: '160px', height: '1.5px', backgroundColor: '#0f172a', marginLeft: 'auto', marginBottom: '4px' }} />
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>Authorized Medical Officer</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Blood Transfusion Officer</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

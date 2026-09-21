import React, { useState } from 'react';
import { request } from '../../services/api';
import {
  Heart,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DonorEligibilityCheck() {
  const [dob, setDob] = useState('2000-06-15');
  const [weight, setWeight] = useState('65');
  const [hasDonatedBefore, setHasDonatedBefore] = useState('no');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await request('/donors/check-eligibility', {
        method: 'POST',
        body: JSON.stringify({
          dob,
          weight: parseFloat(weight),
          lastDonationDate: hasDonatedBefore === 'yes' ? lastDonationDate : null,
        }),
      });

      if (res.success) {
        setResult(res.eligibility);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px 0', minHeight: '80vh' }}>
      <div className="layout-container" style={{ maxWidth: '880px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '12px',
          }}>
            <Heart size={16} />
            Diagnostic Eligibility Engine
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Check Your Blood Donation Eligibility
          </h1>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '8px auto 0' }}>
            Verify your eligibility instantly according to standard clinical safety rules (Age: 18–65, Weight &gt; 45 kg, 90-day whole blood interval).
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
          <form onSubmit={handleCheck}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="var(--primary)" />
                  Date of Birth (DOB) *
                </label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Must be between 18 and 65 years old</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scale size={15} color="var(--primary)" />
                  Body Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  className="form-input"
                  placeholder="e.g. 60"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Must be strictly greater than 45 kg</span>
              </div>

            </div>

            <div style={{ marginTop: '16px' }}>
              <label className="form-label">Have you donated blood previously?</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.92rem' }}>
                  <input
                    type="radio"
                    name="hasDonated"
                    value="no"
                    checked={hasDonatedBefore === 'no'}
                    onChange={() => setHasDonatedBefore('no')}
                  />
                  No, I am a first-time donor
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.92rem' }}>
                  <input
                    type="radio"
                    name="hasDonated"
                    value="yes"
                    checked={hasDonatedBefore === 'yes'}
                    onChange={() => setHasDonatedBefore('yes')}
                  />
                  Yes, I have donated before
                </label>
              </div>
            </div>

            {hasDonatedBefore === 'yes' && (
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Date of Last Donation *</label>
                <input
                  type="date"
                  required={hasDonatedBefore === 'yes'}
                  className="form-input"
                  value={lastDonationDate}
                  onChange={(e) => setLastDonationDate(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required minimum interval: 90 days (3 months)</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '24px', padding: '14px', fontSize: '1rem' }}
            >
              {loading ? 'Evaluating Medical Rules...' : 'Check My Eligibility Now'}
            </button>
          </form>

          {/* Results Display */}
          {result && (
            <div style={{
              marginTop: '30px',
              padding: '24px',
              borderRadius: '14px',
              backgroundColor: result.isEligible ? 'var(--success-light)' : 'var(--danger-light)',
              border: `1.5px solid ${result.isEligible ? 'var(--success)' : 'var(--danger)'}`,
              animation: 'slideDown 0.3s ease-out',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {result.isEligible ? (
                  <CheckCircle2 size={32} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <XCircle size={32} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                
                <div>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: result.isEligible ? '#065f46' : '#991b1b',
                    marginBottom: '4px',
                  }}>
                    {result.isEligible ? 'Congratulations! You are Eligible to Donate Blood.' : 'Currently Not Eligible for Blood Donation'}
                  </h3>
                  
                  <p style={{
                    fontSize: '0.92rem',
                    color: result.isEligible ? '#047857' : '#7f1d1d',
                    lineHeight: 1.5,
                  }}>
                    {result.isEligible
                      ? `You meet all clinical parameters: Age ${result.age} yrs (within 18-65), Weight ${weight} kg (> 45 kg), and healthy donation gap interval.`
                      : result.reason}
                  </p>

                  {result.nextEligibleDate && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255,255,255,0.6)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#991b1b',
                    }}>
                      🗓️ You will be eligible to donate again on: <strong>{result.nextEligibleDate}</strong> (in {result.daysRemaining} days).
                    </div>
                  )}

                  {result.isEligible && (
                    <div style={{ marginTop: '16px' }}>
                      <Link to="/camps" className="btn btn-success" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>
                        Browse Nearby Camps to Donate <ArrowRight size={16} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

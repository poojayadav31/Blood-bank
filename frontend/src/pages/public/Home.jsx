import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../../services/api';
import {
  Droplet,
  Heart,
  Calendar,
  ShieldCheck,
  Building2,
  Users,
  AlertCircle,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  ChevronRight,
  Activity,
} from 'lucide-react';

export default function Home() {
  const [camps, setCamps] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      request('/camps?status=active'),
      request('/blood-requests?status=pending'),
    ])
      .then(([campsRes, requestsRes]) => {
        if (campsRes.success) setCamps(campsRes.camps.slice(0, 3));
        if (requestsRes.success) setEmergencyRequests(requestsRes.requests.slice(0, 3));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'radial-gradient(circle at top right, rgba(225, 29, 72, 0.12) 0%, transparent 60%), var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '70px 0 60px',
      }}>
        <div className="layout-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '40px', alignItems: 'center' }}>
            
            {/* Left Content */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '30px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '18px',
              }}>
                <Sparkles size={16} />
                Multi-Organization Blood Network
              </div>

              <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '18px', letterSpacing: '-0.03em' }}>
                Every Drop Counts. <br />
                <span style={{ color: 'var(--primary)' }}>Save Lives Together.</span>
              </h1>

              <p style={{ fontSize: '1.08rem', color: 'var(--text-muted)', marginBottom: '30px', maxWidth: '540px' }}>
                A unified, state-of-the-art platform connecting licensed blood organizations, donors, volunteers, and hospitals. Organize simultaneous blood camps with digital limit safeguards, real-time inventory, and authenticated certificates.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                <Link to="/camps" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.96rem' }}>
                  <Calendar size={18} />
                  Find Blood Camps
                </Link>
                <Link to="/eligibility" className="btn btn-secondary" style={{ padding: '12px 22px', fontSize: '0.96rem' }}>
                  <Heart size={18} color="var(--primary)" />
                  Check Eligibility
                </Link>
                <Link to="/register-org" className="btn btn-outline" style={{ padding: '12px 22px', fontSize: '0.96rem' }}>
                  <Building2 size={18} />
                  Register Organization
                </Link>
              </div>

              {/* Quick Metrics */}
              <div style={{ display: 'flex', gap: '28px', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                    300 Bags
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Standard Camp Limit</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                    100%
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Simultaneous Drives Allowed</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                    8 Groups
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Real-Time Stock Track</div>
                </div>
              </div>

            </div>

            {/* Right Interactive Card */}
            <div>
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={20} color="var(--danger)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Hospital Urgency Feed</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time blood transfusion requests</p>
                    </div>
                  </div>
                  <span className="badge badge-critical">Live</span>
                </div>

                {emergencyRequests.length === 0 ? (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
                    No critical shortages right now.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {emergencyRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--bg-card-subtle)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="blood-pill" style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}>
                            {req.blood_group}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{req.hospital_name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              Needed: {req.quantity} Units • {req.urgency} Urgency
                            </div>
                          </div>
                        </div>
                        <Link to="/request-blood" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                          Details
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <Link to="/request-blood" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Submit Emergency Hospital Request <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Active Blood Camps Showcase */}
      <section style={{ padding: '60px 0' }}>
        <div className="layout-container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Donation Opportunities
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>
                Active & Upcoming Blood Camps
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Multiple organizations organize authorized blood drives simultaneously across locations.
              </p>
            </div>
            <Link to="/camps" className="btn btn-secondary">
              View All Camps <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid-cols-3">
            {camps.map((camp) => (
              <div key={camp.id} className="glass-card glass-card-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="badge badge-active">{camp.status}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Target: {camp.expected_blood_bags} Bags
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', lineHeight: 1.3 }}>
                    {camp.name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '14px' }}>
                    By {camp.organization_name}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={15} color="var(--primary)" />
                      <span>{camp.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} color="var(--primary)" />
                      <span>{camp.start_time} - {camp.end_time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} color="var(--primary)" />
                      <span>{camp.location}, {camp.city}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Collected: <strong>{camp.collected_blood_bags || 0} Bags</strong>
                  </div>
                  <Link to={`/camps`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                    Register
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blood Compatibility Guide */}
      <section style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', padding: '60px 0' }}>
        <div className="layout-container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 40px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Medical Reference
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>
              Blood Group Compatibility Matrix
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Know who can receive your blood group and who you can receive from in emergencies.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <thead>
                <tr>
                  <th>Blood Type</th>
                  <th>Can Donate To</th>
                  <th>Can Receive From</th>
                  <th>Type Summary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="blood-pill" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>O-</span></td>
                  <td><strong>All Blood Types</strong> (Universal Donor)</td>
                  <td>O- only</td>
                  <td><span className="badge badge-approved">Universal RBC Donor</span></td>
                </tr>
                <tr>
                  <td><span className="blood-pill" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>O+</span></td>
                  <td>O+, A+, B+, AB+</td>
                  <td>O+, O-</td>
                  <td>Most common required type</td>
                </tr>
                <tr>
                  <td><span className="blood-pill" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>A+</span></td>
                  <td>A+, AB+</td>
                  <td>A+, A-, O+, O-</td>
                  <td>Critical for platelet donations</td>
                </tr>
                <tr>
                  <td><span className="blood-pill" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>B+</span></td>
                  <td>B+, AB+</td>
                  <td>B+, B-, O+, O-</td>
                  <td>High demand in trauma surgeries</td>
                </tr>
                <tr>
                  <td><span className="blood-pill" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>AB+</span></td>
                  <td>AB+ only</td>
                  <td><strong>All Blood Types</strong> (Universal Recipient)</td>
                  <td><span className="badge badge-healthy">Universal Recipient</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DonorPassModal from '../../components/common/DonorPassModal';
import {
  Calendar,
  MapPin,
  Clock,
  Search,
  Users,
  Droplet,
  CheckCircle2,
  Building2,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

export default function BrowseCamps() {
  const { user, isAuthenticated } = useAuth();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCampForPass, setSelectedCampForPass] = useState(null);
  const [passRegistration, setPassRegistration] = useState(null);
  const [regModalCamp, setRegModalCamp] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestBloodGroup, setGuestBloodGroup] = useState('O+');
  const [guestMobile, setGuestMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchCamps = () => {
    setLoading(true);
    let url = `/camps?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (cityFilter) url += `city=${encodeURIComponent(cityFilter)}&`;
    if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;

    request(url)
      .then((res) => {
        if (res.success) setCamps(res.camps);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCamps();
  }, [search, cityFilter, statusFilter]);

  const handleOpenRegister = (camp) => {
    setRegModalCamp(camp);
    setMsg(null);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      let donorId = user?.donor?.id;

      // If guest registering
      if (!donorId) {
        // Register donor profile or fetch
        const regDonorRes = await request('/auth/register-donor', {
          method: 'POST',
          body: JSON.stringify({
            name: guestName,
            email: `${guestMobile.replace(/\D/g, '')}@guestdonor.org`,
            password: 'DonorGuest@123',
            phone: guestMobile,
            dob: '1998-01-01',
            gender: 'Male',
            blood_group: guestBloodGroup,
            weight: 65,
          }),
        });
        donorId = regDonorRes.user?.donor_id || 1;
      }

      const res = await request('/camps/register', {
        method: 'POST',
        body: JSON.stringify({
          camp_id: regModalCamp.id,
          donor_id: donorId,
        }),
      });

      if (res.success) {
        setPassRegistration(res.registration);
        setSelectedCampForPass(regModalCamp);
        setRegModalCamp(null);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Registration failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '40px 0', minHeight: '80vh' }}>
      <div className="layout-container">
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Camp Discovery Portal
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>
            Blood Donation Camps & Drives
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Discover verified voluntary blood donation camps. Multiple organizations can conduct concurrent drives without restrictions.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search camp by name, organizer, venue, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <select className="form-select" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="">All Cities</option>
              <option value="Delhi">New Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Raipur">Raipur</option>
            </select>
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active Now</option>
              <option value="scheduled">Upcoming / Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Camps Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading blood donation camps...
          </div>
        ) : camps.length === 0 ? (
          <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
            <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No Camps Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              No blood donation camps matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid-cols-3">
            {camps.map((camp) => {
              const isSimultaneousNote = camp.date === '2026-10-10';

              return (
                <div key={camp.id} className="glass-card glass-card-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span className={`badge badge-${camp.status}`}>{camp.status}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        Target: {camp.expected_blood_bags} Bags
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', lineHeight: 1.3 }}>
                      {camp.name}
                    </h3>
                    
                    <div style={{ fontSize: '0.84rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={16} />
                      {camp.organization_name}
                    </div>

                    {isSimultaneousNote && (
                      <div style={{ padding: '6px 10px', backgroundColor: 'var(--secondary-light)', borderRadius: '6px', fontSize: '0.74rem', color: 'var(--secondary)', fontWeight: 700, marginBottom: '12px' }}>
                        ⚡ Simultaneous Multi-Org Drive Active
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={15} color="var(--primary)" />
                        <strong>{camp.date}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={15} color="var(--primary)" />
                        <span>{camp.start_time} - {camp.end_time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span>{camp.location}, {camp.address}, {camp.city}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {camp.description}
                    </p>
                  </div>

                  <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Collected</span>
                      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {camp.collected_blood_bags || 0} / {camp.expected_blood_bags} Bags
                      </div>
                    </div>

                    {camp.status !== 'completed' && camp.status !== 'cancelled' ? (
                      <button
                        onClick={() => handleOpenRegister(camp)}
                        className="btn btn-primary"
                        style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                      >
                        Register to Donate
                      </button>
                    ) : (
                      <span className="badge badge-secondary">Drive Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Camp Registration Modal */}
        {regModalCamp && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: '20px',
          }}>
            <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '28px', backgroundColor: 'var(--bg-card)' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
                Register for Blood Camp
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                {regModalCamp.name} ({regModalCamp.date})
              </p>

              {msg && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', backgroundColor: msg.type === 'error' ? 'var(--danger-light)' : 'var(--success-light)', color: msg.type === 'error' ? 'var(--danger)' : 'var(--success)', fontSize: '0.85rem' }}>
                  {msg.text}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                {!user && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="John Doe"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        className="form-input"
                        placeholder="+91 98765 43210"
                        value={guestMobile}
                        onChange={(e) => setGuestMobile(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Blood Group *</label>
                      <select className="form-select" value={guestBloodGroup} onChange={(e) => setGuestBloodGroup(e.target.value)}>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </>
                )}

                {user && (
                  <div style={{ padding: '14px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '10px', marginBottom: '20px', fontSize: '0.86rem' }}>
                    <div>Registering as: <strong>{user.name}</strong></div>
                    <div>Blood Group: <strong style={{ color: 'var(--primary)' }}>{user.donor?.blood_group || 'O+'}</strong></div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="button" onClick={() => setRegModalCamp(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                    {submitting ? 'Generating Pass...' : 'Confirm Registration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Pass Modal on successful registration */}
        {passRegistration && selectedCampForPass && (
          <DonorPassModal
            registration={passRegistration}
            camp={selectedCampForPass}
            donor={user?.donor || { name: guestName, blood_group: guestBloodGroup }}
            onClose={() => {
              setPassRegistration(null);
              setSelectedCampForPass(null);
            }}
          />
        )}

      </div>
    </div>
  );
}

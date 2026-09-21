import React, { useEffect, useState } from 'react';
import { request } from '../../services/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  MapPin,
  Users,
  Droplet,
  CheckCircle2,
  AlertCircle,
  Filter,
  Eye,
  X,
  Layers,
  Sparkles,
  Info,
  CalendarDays,
} from 'lucide-react';

const ORG_COLORS = {
  1: { bg: '#fee2e2', border: '#f87171', text: '#991b1b', badge: '#e11d48' }, // Red Cross - Crimson
  2: { bg: '#e0f2fe', border: '#38bdf8', text: '#0369a1', badge: '#0284c7' }, // LifeCare - Blue
  3: { bg: '#d1fae5', border: '#34d399', text: '#065f46', badge: '#10b981' }, // Apex - Green
  4: { bg: '#f3e8ff', border: '#c084fc', text: '#6b21a8', badge: '#9333ea' }, // City Care - Purple
};

const DEFAULT_ORG_COLOR = { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155', badge: '#64748b' };

export default function AdminCampCalendar() {
  const [camps, setCamps] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Default Oct 2026 where simultaneous camps exist
  const [selectedDay, setSelectedDay] = useState('2026-10-10');
  const [selectedCampModal, setSelectedCampModal] = useState(null);

  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'agenda'
  const [filterOrg, setFilterOrg] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    Promise.all([
      request('/camps'),
      request('/organizations'),
    ])
      .then(([campsRes, orgsRes]) => {
        if (campsRes.success) setCamps(campsRes.camps);
        if (orgsRes.success) setOrganizations(orgsRes.organizations);
      })
      .catch((err) => console.error('Fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter camps
  const filteredCamps = camps.filter((c) => {
    if (filterOrg && String(c.organization_id) !== String(filterOrg)) return false;
    if (filterCity && c.city.toLowerCase() !== filterCity.toLowerCase()) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  // Group camps by date (YYYY-MM-DD)
  const campsByDate = {};
  filteredCamps.forEach((camp) => {
    if (!campsByDate[camp.date]) {
      campsByDate[camp.date] = [];
    }
    campsByDate[camp.date].push(camp);
  });

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 1));
    setSelectedDay('2026-10-10');
  };

  // Selected date camps
  const selectedDateCamps = campsByDate[selectedDay] || [];

  return (
    <div style={{ padding: '30px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <CalendarDays size={16} /> Allotment & Timetable Master Schedule
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '2px' }}>
            Camp Scheduling & Organization Allotment Calendar
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Monitor which dates, time slots, and venues are allotted to each organization. View concurrent simultaneous drives across cities.
          </p>
        </div>

        {/* View Mode & Today Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                backgroundColor: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'calendar' ? '#ffffff' : 'var(--text-main)',
                transition: 'all 0.2s',
              }}
            >
              Month Calendar
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                backgroundColor: viewMode === 'agenda' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'agenda' ? '#ffffff' : 'var(--text-main)',
                transition: 'all 0.2s',
              }}
            >
              Detailed Agenda List
            </button>
          </div>

          <button onClick={handleToday} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.84rem' }}>
            Show Demo Month
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            <Filter size={16} /> Filters:
          </div>

          {/* Org Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '220px', padding: '7px 12px', fontSize: '0.84rem' }}
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
          >
            <option value="">All Organizations</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>

          {/* City Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '160px', padding: '7px 12px', fontSize: '0.84rem' }}
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">All Cities</option>
            <option value="New Delhi">New Delhi</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Raipur">Raipur</option>
          </select>

          {/* Status Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '160px', padding: '7px 12px', fontSize: '0.84rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active Now</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#e11d48' }} /> Red Cross
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7' }} /> LifeCare
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#9333ea' }} /> City Care
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          
          {/* Main Calendar Grid */}
          <div className="glass-card" style={{ padding: '24px' }}>
            
            {/* Calendar Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                {monthNames[month]} {year}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Weekday Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <div>SUN</div>
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {/* Previous Month trailing days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => {
                const prevDateNum = daysInPrevMonth - firstDayIndex + i + 1;
                return (
                  <div
                    key={`prev-${i}`}
                    style={{
                      minHeight: '110px',
                      padding: '8px',
                      backgroundColor: 'var(--bg-card-subtle)',
                      opacity: 0.35,
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                    }}
                  >
                    {prevDateNum}
                  </div>
                );
              })}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayCamps = campsByDate[formattedDate] || [];
                const isSelected = selectedDay === formattedDate;
                const isSimultaneous = dayCamps.length > 1;

                return (
                  <div
                    key={formattedDate}
                    onClick={() => setSelectedDay(formattedDate)}
                    style={{
                      minHeight: '115px',
                      padding: '8px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-card)',
                      border: isSelected
                        ? '2px solid var(--primary)'
                        : isSimultaneous
                        ? '1.5px solid #38bdf8'
                        : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px var(--primary-glow)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                        }}>
                          {dayNum}
                        </span>

                        {isSimultaneous && (
                          <span style={{
                            fontSize: '0.62rem',
                            padding: '1px 5px',
                            backgroundColor: 'var(--secondary-light)',
                            color: 'var(--secondary)',
                            borderRadius: '4px',
                            fontWeight: 800,
                          }}>
                            ⚡ {dayCamps.length} Orgs
                          </span>
                        )}
                      </div>

                      {/* Camp mini items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dayCamps.slice(0, 2).map((camp) => {
                          const colors = ORG_COLORS[camp.organization_id] || DEFAULT_ORG_COLOR;

                          return (
                            <div
                              key={camp.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCampModal(camp);
                              }}
                              style={{
                                backgroundColor: colors.bg,
                                border: `1px solid ${colors.border}`,
                                color: colors.text,
                                padding: '4px 6px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={`${camp.name} (${camp.organization_name}) - ${camp.start_time} to ${camp.end_time}`}
                            >
                              <span style={{ color: colors.badge }}>⏰ {camp.start_time}</span> • {camp.organization_name.split(' ')[0]}
                            </div>
                          );
                        })}

                        {dayCamps.length > 2 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            +{dayCamps.length - 2} more drives
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Timeline & Allotment Sidebar */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Daily Timeline Breakdown
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedDay}</h3>
              </div>
              <span className="badge badge-primary">
                {selectedDateCamps.length} Allotment(s)
              </span>
            </div>

            {selectedDateCamps.length === 0 ? (
              <div style={{ padding: '36px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Clock size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: '0.88rem' }}>No blood donation camps scheduled on this date.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedDateCamps.length > 1 && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--secondary-light)',
                    border: '1px solid var(--secondary)',
                    color: 'var(--secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}>
                    ⚡ Simultaneous Drives Active: Multiple organizations conducting authorized blood collection drives at the same time.
                  </div>
                )}

                {selectedDateCamps.map((camp) => {
                  const colors = ORG_COLORS[camp.organization_id] || DEFAULT_ORG_COLOR;

                  return (
                    <div
                      key={camp.id}
                      onClick={() => setSelectedCampModal(camp)}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: colors.bg,
                        border: `1.5px solid ${colors.border}`,
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{
                          backgroundColor: colors.badge,
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}>
                          {camp.start_time} - {camp.end_time}
                        </span>
                        <span className={`badge badge-${camp.status}`}>{camp.status}</span>
                      </div>

                      <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.text, margin: '6px 0 4px' }}>
                        {camp.name}
                      </h4>

                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.badge, marginBottom: '6px' }}>
                        🏢 {camp.organization_name}
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div>📍 {camp.location}, {camp.city}</div>
                        <div>🩸 Target: <strong>{camp.expected_blood_bags} Bags</strong> (Collected: {camp.collected_blood_bags || 0})</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Detailed Agenda List View */
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '18px' }}>
            All Organization Camp Allotments (Chronological Order)
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Organization Allotted</th>
                  <th>Camp Name & Theme</th>
                  <th>Location & City</th>
                  <th>Target Bags</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCamps.map((camp) => {
                  const colors = ORG_COLORS[camp.organization_id] || DEFAULT_ORG_COLOR;

                  return (
                    <tr key={camp.id}>
                      <td>
                        <strong style={{ color: 'var(--primary)' }}>{camp.date}</strong>
                      </td>
                      <td>
                        <span style={{
                          backgroundColor: 'var(--bg-card-subtle)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: 'var(--text-main)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <Clock size={12} color="var(--primary)" />
                          {camp.start_time} - {camp.end_time}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: colors.badge }}>
                          {camp.organization_name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Phone: {camp.organization_phone || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <strong>{camp.name}</strong>
                      </td>
                      <td style={{ fontSize: '0.84rem' }}>
                        <div>{camp.location}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{camp.city}, {camp.state}</div>
                      </td>
                      <td>
                        <strong>{camp.expected_blood_bags} Bags</strong>
                      </td>
                      <td>
                        <span className={`badge badge-${camp.status}`}>{camp.status}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedCampModal(camp)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Camp Allotment Modal */}
      {selectedCampModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div className="glass-card" style={{ maxWidth: '560px', width: '100%', padding: '30px', position: 'relative' }}>
            <button
              onClick={() => setSelectedCampModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className={`badge badge-${selectedCampModal.status}`}>
                {selectedCampModal.status}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                Allotment ID: #{selectedCampModal.id}
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', lineHeight: 1.2 }}>
              {selectedCampModal.name}
            </h2>

            <div style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              margin: '16px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Allotted Organization</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {selectedCampModal.organization_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {selectedCampModal.organization_email} • {selectedCampModal.organization_phone}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px', fontSize: '0.86rem' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Allotted Date</span>
                <div style={{ fontWeight: 800 }}>📅 {selectedCampModal.date}</div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Time Window</span>
                <div style={{ fontWeight: 800 }}>⏰ {selectedCampModal.start_time} - {selectedCampModal.end_time}</div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Collection Target</span>
                <div style={{ fontWeight: 800, color: 'var(--primary)' }}>🩸 {selectedCampModal.expected_blood_bags} Blood Bags</div>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Expected Donors</span>
                <div style={{ fontWeight: 800 }}>👥 {selectedCampModal.expected_donors} People</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '0.86rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Venue & Location:</span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>
                📍 {selectedCampModal.location}, {selectedCampModal.address}, {selectedCampModal.city}, {selectedCampModal.state}
              </div>
            </div>

            {selectedCampModal.description && (
              <div style={{ marginBottom: '20px', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Instructions & Description:</span>
                <p style={{ color: 'var(--text-main)', marginTop: '4px', backgroundColor: 'var(--bg-card-subtle)', padding: '10px', borderRadius: '8px', lineHeight: 1.5 }}>
                  {selectedCampModal.description}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedCampModal(null)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              Close Allotment Inspector
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

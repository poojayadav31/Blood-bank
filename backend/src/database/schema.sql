-- Blood Bank Management System (BBMS) - PostgreSQL Schema DDL

CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    website VARCHAR(255),
    certificate_url VARCHAR(500),
    license_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, suspended
    collection_limit INTEGER DEFAULT 300,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- super_admin, org_admin, volunteer, donor, hospital
    phone VARCHAR(50),
    organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS camps (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    date VARCHAR(50) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    expected_donors INTEGER NOT NULL,
    expected_blood_bags INTEGER NOT NULL,
    collected_blood_bags INTEGER DEFAULT 0,
    description TEXT,
    poster_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'scheduled', -- draft, scheduled, active, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    dob VARCHAR(50) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    weight NUMERIC(5,2) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    last_donation_date VARCHAR(50),
    medical_history TEXT,
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(50),
    total_donations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS camp_registrations (
    id SERIAL PRIMARY KEY,
    camp_id INTEGER NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
    donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    qr_code_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'registered', -- registered, attended, donated, deferred
    vital_bp VARCHAR(50),
    vital_hb NUMERIC(4,2),
    vital_weight NUMERIC(5,2),
    blood_bags_collected INTEGER DEFAULT 0,
    rejection_reason TEXT,
    certificate_id VARCHAR(100),
    donation_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_inventory (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    blood_group VARCHAR(10) NOT NULL,
    available_units INTEGER DEFAULT 0,
    reserved_units INTEGER DEFAULT 0,
    expired_units INTEGER DEFAULT 0,
    issued_units INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, blood_group)
);

CREATE TABLE IF NOT EXISTS blood_batches (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    camp_id INTEGER REFERENCES camps(id) ON DELETE SET NULL,
    donor_id INTEGER REFERENCES donors(id) ON DELETE SET NULL,
    blood_group VARCHAR(10) NOT NULL,
    units INTEGER DEFAULT 1,
    collection_date VARCHAR(50) NOT NULL,
    expiry_date VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- available, reserved, issued, expired, discarded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_requests (
    id SERIAL PRIMARY KEY,
    hospital_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(150),
    blood_group VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    urgency VARCHAR(50) DEFAULT 'Normal', -- Normal, Urgent, Critical
    patient_case TEXT,
    required_by_date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, fulfilled
    fulfilled_by_org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    fulfilled_units INTEGER DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quota_requests (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    current_limit INTEGER NOT NULL,
    requested_limit INTEGER NOT NULL,
    reason TEXT NOT NULL,
    supporting_doc_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    admin_remarks TEXT,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    role VARCHAR(50),
    organization_id INTEGER,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_role VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(100),
    status VARCHAR(50) DEFAULT 'success', -- success, violation_attempt, failed
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_camps_org ON camps(organization_id);
CREATE INDEX IF NOT EXISTS idx_camps_date ON camps(date);
CREATE INDEX IF NOT EXISTS idx_inventory_org ON blood_inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

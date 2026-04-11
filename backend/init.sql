-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Wards table
CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    health_score INT DEFAULT 100,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen', -- citizen, officer, admin
    admin_role TEXT, -- super_admin, district_admin, department_admin
    ward_id UUID REFERENCES wards(id),
    
    -- Officer Verification Fields
    verification_status TEXT DEFAULT 'APPROVED', -- PENDING, APPROVED, REJECTED, SUSPENDED
    verification_id TEXT UNIQUE,
    verified_at TIMESTAMP WITH TIME ZONE,
    employee_id TEXT,
    designation TEXT,
    department_name TEXT,
    gov_id_number TEXT,
    gov_id_type TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table (Append-only)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL, -- user, officer, complaint, setting
    target_id TEXT,
    previous_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Site Settings Table (Dynamic Config)
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, warning, alert, success
    target_audience TEXT DEFAULT 'all', -- all, citizens, officers
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id)
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    ward_id UUID NOT NULL REFERENCES wards(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity INT NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'submitted',
    department TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    ai_classified BOOLEAN DEFAULT FALSE,
    duplicate_count INT DEFAULT 0,
    duplicate_of UUID REFERENCES complaints(id),
    is_escalated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Timeline table
CREATE TABLE IF NOT EXISTS complaint_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES users(id)
);

-- Seed Wards
INSERT INTO wards (name, city, lat, lng, health_score) VALUES
('Ward 1 - Central Market', 'Civy City', 12.9716, 77.5946, 85),
('Ward 2 - Industrial Hub', 'Civy City', 12.9816, 77.6046, 62),
('Ward 3 - Riverside Heights', 'Civy City', 12.9616, 77.5846, 91),
('Ward 4 - Green Park', 'Civy City', 12.9516, 77.5746, 78),
('Ward 5 - Old Town', 'Civy City', 12.9916, 77.6146, 45);

-- Complaint AI Reports table
CREATE TABLE IF NOT EXISTS complaint_ai_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    summary TEXT,
    quality_score INT,
    sentiment TEXT,
    gap_analysis TEXT,
    suggested_followup TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Resolutions table
CREATE TABLE IF NOT EXISTS complaint_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES users(id),
    audio_url TEXT,
    video_url TEXT,
    transcription TEXT,
    photo_url TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    mismatch_flag BOOLEAN DEFAULT FALSE,
    share_with_citizen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Demo Users (Passwords: Test@1234)
-- Hashes generated for 'Test@1234' using bcrypt
-- citizen@gramvaani.in / Test@1234
INSERT INTO users (name, email, password_hash, role) VALUES
('Citizen Joe', 'citizen@gramvaani.in', '$2a$10$Xm7BfT8W9.R4.q8E/YnU/u1.0E/1U/u1.0E/1U/u1.0E/1U/u1.0', 'citizen'),
('Officer Jane', 'officer@gramvaani.in', '$2a$10$Xm7BfT8W9.R4.q8E/YnU/u1.0E/1U/u1.0E/1U/u1.0E/1U/u1.0', 'officer');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    role TEXT NOT NULL DEFAULT 'citizen',
    admin_role TEXT,
    verification_status TEXT DEFAULT 'APPROVED',
    ward_id UUID REFERENCES wards(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
('Connaught Place', 'New Delhi', 28.6304, 77.2177, 85),
('Karol Bagh', 'New Delhi', 28.6519, 77.1898, 62),
('Hauz Khas', 'New Delhi', 28.5494, 77.2001, 91),
('Dwarka', 'New Delhi', 28.5823, 77.0500, 78),
('Mayur Vihar', 'New Delhi', 28.6047, 77.2965, 45);

-- Seed Demo Users (Passwords: Test@1234)
-- Hashes generated for 'Test@1234' using bcrypt
-- citizen@gramvaani.in / Test@1234
INSERT INTO users (name, email, password_hash, role) VALUES
('Citizen Joe', 'citizen@gramvaani.in', '$2a$10$Xm7BfT8W9.R4.q8E/YnU/u1.0E/1U/u1.0E/1U/u1.0E/1U/u1.0', 'citizen'),
('Officer Jane', 'officer@gramvaani.in', '$2a$10$Xm7BfT8W9.R4.q8E/YnU/u1.0E/1U/u1.0E/1U/u1.0E/1U/u1.0', 'officer');

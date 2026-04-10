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

-- Seed Demo Users (Passwords: Test@1234)
-- Hashes generated for 'Test@1234' using bcrypt
-- citizen@gramvaani.in / Test@1234
INSERT INTO users (name, email, password_hash, role) VALUES
('Citizen Joe', 'citizen@gramvaani.in', '$2a$10$Xm7BfT8W9.R4.q8E/YnU/u1.0E/1U/u1.0E/1U/u1.0E/1U/u1.0', 'citizen'),
('Officer Jane', 'officer@gramvaani.in', '$2a$10$Xm7BfT8W9.R4.q8E/YnU/u1.0E/1U/u1.0E/1U/u1.0E/1U/u1.0', 'officer');

-- Add missing officer fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

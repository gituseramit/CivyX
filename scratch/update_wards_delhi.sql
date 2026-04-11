TRUNCATE TABLE complaints, complaint_timeline, users, wards CASCADE;

-- Insert Wards
INSERT INTO wards (id, name, city, lat, lng, health_score) VALUES
('b9a2d8a5-dcf4-4df1-8ac1-9231f8f94cb4', 'Connaught Place', 'New Delhi', 28.6304, 77.2177, 85),
('6e2a22be-4a25-4c07-ba71-bfbd6ebcedfe', 'Karol Bagh', 'New Delhi', 28.6519, 77.1898, 62),
('6c30e9aa-78d1-4db5-b827-31df4a9e5251', 'Hauz Khas', 'New Delhi', 28.5494, 77.2001, 91),
('28d9cda7-df90-48e0-bb1d-84f9bc364177', 'Dwarka', 'New Delhi', 28.5823, 77.0500, 78),
('f6ce6a21-7299-4770-b1d5-bc44d2d480e6', 'Mayur Vihar', 'New Delhi', 28.6047, 77.2965, 45);

-- Insert Users
INSERT INTO users (id, name, email, password_hash, role) VALUES
('a59c0f99-2c70-4f35-acf2-132d7211116c', 'Citizen Joe', 'citizen@civyx.in', '$2a$10$Xm7BfT8W9.R4.q8E/YnU/u1.0E/1U/u1.0E/1U/u1.0E/1U/u1.0', 'citizen'),
('1469e32a-594a-4632-9c17-4fdcc4c85244', 'Officer Jane', 'officer@civyx.in', '$2a$10$Xm7BfT8W9.R4.q8E/YnU/u1.0E/1U/u1.0E/1U/u1.0E/1U/u1.0', 'officer');

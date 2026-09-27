USE onboardflow_db;
-- This manual insert is optional: the app's DataInitializer already seeds the
-- hr@onboardflow.com / candidate@onboardflow.com demo accounts automatically
-- on first boot (see backend/.env.example), with a freshly-generated BCrypt
-- hash, so nothing here needs to match those exact credentials.
-- password below is Admin@123 (BCrypt hash) - only kept as a manual fallback example.
INSERT INTO users (email, password, full_name, role) VALUES
('admin@onboardflow.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5F3Yb0YvKN/8g6q2s8s0YHz6qFm1S', 'HR Admin', 'HR');

INSERT INTO candidates (first_name,last_name,email,phone,department,position,expected_joining_date,status,stage) VALUES
('Rahul','Sharma','rahul.sharma@example.com','9876543210','Engineering','Software Engineer','2026-10-15','SELECTED','SELECTED'),
('Priya','Nair','priya.nair@example.com','9876500001','HR','HR Executive','2026-10-10','ONBOARDING','DOCUMENT_SUBMISSION');

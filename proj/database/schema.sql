CREATE DATABASE IF NOT EXISTS onboardflow_db;
USE onboardflow_db;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'HR'
);

CREATE TABLE candidates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address VARCHAR(255),
  date_of_birth DATE,
  department VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  expected_joining_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'SELECTED',
  stage VARCHAR(40) NOT NULL DEFAULT 'SELECTED',
  joining_confirmed_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_department (department)
);

CREATE TABLE documents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  candidate_id BIGINT NOT NULL,
  doc_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  stored_file_name VARCHAR(255),
  file_path VARCHAR(500),
  content_type VARCHAR(100),
  file_size BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  rejection_reason VARCHAR(255),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  INDEX idx_candidate (candidate_id),
  -- One current record per candidate per document type. Re-uploads update
  -- this row (see DocumentService.upload) instead of inserting a new one, so
  -- this constraint should never legitimately be hit by the app itself - it
  -- exists to make a duplicate row a hard error instead of silent bad data.
  UNIQUE KEY uq_candidate_doctype (candidate_id, doc_type)
);

CREATE TABLE induction_activities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  candidate_id BIGINT NOT NULL,
  activity_name VARCHAR(100) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at DATETIME,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  INDEX idx_candidate (candidate_id)
);

CREATE TABLE activity_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  candidate_id BIGINT NOT NULL,
  description VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  INDEX idx_candidate (candidate_id)
);

-- In-app notifications, shared by HR and Candidate users (both log in
-- through `users`, see users.role). candidate_id is set whenever the
-- notification is about a specific candidate's profile, so the UI can
-- deep-link to it.
CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recipient_user_id BIGINT NOT NULL,
  candidate_id BIGINT,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  INDEX idx_recipient (recipient_user_id),
  INDEX idx_recipient_unread (recipient_user_id, is_read)
);

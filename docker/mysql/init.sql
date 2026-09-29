-- ============================================================
-- AURA++ MySQL initialization script
-- Runs once when the mysql container starts fresh
-- ============================================================

CREATE DATABASE IF NOT EXISTS aura_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aura_db;

-- Grant permissions to root (already done via MYSQL_ROOT_PASSWORD env)
-- Add a restricted app user for production use
CREATE USER IF NOT EXISTS 'aura_user'@'%' IDENTIFIED BY 'aura_secure_password_2026';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP ON aura_db.* TO 'aura_user'@'%';
FLUSH PRIVILEGES;

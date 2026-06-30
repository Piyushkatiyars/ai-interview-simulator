-- AI Interview Simulator - Database Initialization Script

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS interview_simulator
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE interview_simulator;

-- Grant privileges (for development)
-- In production, use more restrictive permissions
GRANT ALL PRIVILEGES ON interview_simulator.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- Note: SQLAlchemy will create tables automatically
-- This script is for initial database setup and custom configurations

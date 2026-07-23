-- =====================================================================
-- RoadSense AI Navigation System - Professional Production Database
-- Database Name: roadsense_db
-- Target Server: XAMPP Localhost MySQL / MariaDB (127.0.0.1:3306)
-- Encoding: UTF-8 Unicode (utf8mb4_unicode_ci)
-- 
-- IMPORT INSTRUCTIONS FOR XAMPP PHPMYADMIN:
-- 1. Open XAMPP Control Panel and click "Start" next to Apache and MySQL.
-- 2. Open http://localhost/phpmyadmin in your web browser.
-- 3. Click "Import" in the top navbar.
-- 4. Select this file (roadsense_db.sql) and click "Go".
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `roadsense_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `roadsense_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. Users Table (Core Identity & Auth)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(40) DEFAULT NULL,
  `avatar` VARCHAR(64) DEFAULT 'account-circle',
  `vehicle_model` VARCHAR(120) DEFAULT 'Electric Vehicle',
  `emergency_contact` VARCHAR(120) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `joined_date` VARCHAR(40) DEFAULT 'July 2024',
  `member_tier` VARCHAR(64) DEFAULT 'Pro Driver',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. User Preferences Table
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `user_preferences`;
CREATE TABLE `user_preferences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL UNIQUE,
  `default_route_type` ENUM('safest', 'fastest', 'eco') DEFAULT 'safest',
  `vehicle_mileage` DECIMAL(6,2) DEFAULT 15.00,
  `fuel_price` DECIMAL(8,2) DEFAULT 100.00,
  `units` ENUM('metric', 'imperial') DEFAULT 'metric',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Trip Statistics Table (Aggregated Driving Analytics)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `trip_stats`;
CREATE TABLE `trip_stats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL UNIQUE,
  `planned_trips` INT DEFAULT 0,
  `total_distance` DECIMAL(10,2) DEFAULT 0.00,
  `total_eta` INT DEFAULT 0,
  `fuel_used` DECIMAL(10,2) DEFAULT 0.00,
  `fuel_cost` DECIMAL(10,2) DEFAULT 0.00,
  `best_safety_score` INT DEFAULT 98,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Trip History Table (Planned & Completed Routes)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `trip_history`;
CREATE TABLE `trip_history` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `source_name` VARCHAR(255) NOT NULL,
  `destination_name` VARCHAR(255) NOT NULL,
  `source_lat` DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
  `source_lng` DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
  `dest_lat` DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
  `dest_lng` DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
  `preferred_route_type` VARCHAR(32) NOT NULL DEFAULT 'safest',
  `distance_km` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `eta_minutes` INT NOT NULL DEFAULT 0,
  `fuel_cost` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `safety_score` INT NOT NULL DEFAULT 95,
  `hazard_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_trips_user` (`user_id`),
  INDEX `idx_trips_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Route Hazards Table (Traffic & Road Risk Telemetry)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `route_hazards`;
CREATE TABLE `route_hazards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `trip_id` VARCHAR(64) DEFAULT NULL,
  `hazard_type` ENUM('pothole', 'accident', 'traffic_jam', 'flooding', 'construction', 'speed_camera') NOT NULL,
  `severity` ENUM('low', 'moderate', 'high', 'critical') DEFAULT 'moderate',
  `latitude` DECIMAL(10,6) NOT NULL,
  `longitude` DECIMAL(10,6) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `reported_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`trip_id`) REFERENCES `trip_history`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Favorite Locations Table (Home, Work & Saved Pins)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `favorite_locations`;
CREATE TABLE `favorite_locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10,6) NOT NULL,
  `longitude` DECIMAL(10,6) NOT NULL,
  `icon_name` VARCHAR(50) DEFAULT 'map-marker',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Recent Searches Table
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `recent_searches`;
CREATE TABLE `recent_searches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `query` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Chat Messages Table (AI Co-Pilot Persistent History)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `role` ENUM('user', 'assistant') NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` BIGINT NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_chat_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- SEED DATA SETUP FOR INSTANT PHPMYADMIN VISUALIZATION
-- =====================================================================

-- Seed Default User Account
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `avatar`, `vehicle_model`, `emergency_contact`, `bio`, `joined_date`, `member_tier`) 
VALUES 
('usr_default_01', 'Alex Morgan', 'alex.morgan@roadsense.ai', 'password123', '+91 98765 43210', 'account-circle', 'Tesla Model 3 / CyberTruck', '+91 98765 00911', 'Safety-first commuter & road trip enthusiast exploring smart AI navigation.', 'July 2024', 'Pro Navigator');

-- Seed Preferences
INSERT INTO `user_preferences` (`user_id`, `default_route_type`, `vehicle_mileage`, `fuel_price`, `units`)
VALUES 
('usr_default_01', 'safest', 15.00, 100.00, 'metric');

-- Seed Trip Stats
INSERT INTO `trip_stats` (`user_id`, `planned_trips`, `total_distance`, `total_eta`, `fuel_used`, `fuel_cost`, `best_safety_score`)
VALUES 
('usr_default_01', 14, 520.40, 680, 34.60, 3460.00, 98);

-- Seed Favorite Locations
INSERT INTO `favorite_locations` (`user_id`, `label`, `address`, `latitude`, `longitude`, `icon_name`)
VALUES 
('usr_default_01', 'Home', '742 Evergreen Terrace, Springfield', 37.774929, -122.419416, 'home'),
('usr_default_01', 'Work HQ', '100 Innovation Way, Cyber District', 37.783333, -122.416667, 'briefcase'),
('usr_default_01', 'Eco Charging Station', 'Supercharger Hub 4', 37.765000, -122.430000, 'ev-station');

-- Seed Trip History
INSERT INTO `trip_history` (`id`, `user_id`, `source_name`, `destination_name`, `source_lat`, `source_lng`, `dest_lat`, `dest_lng`, `preferred_route_type`, `distance_km`, `eta_minutes`, `fuel_cost`, `safety_score`, `hazard_count`)
VALUES 
('trip_1700000001', 'usr_default_01', 'Home (Springfield)', 'Work HQ (Cyber District)', 37.774929, -122.419416, 37.783333, -122.416667, 'safest', 18.50, 24, 123.33, 98, 0),
('trip_1700000002', 'usr_default_01', 'Work HQ', 'Airport Terminal 2', 37.783333, -122.416667, 37.621313, -122.378955, 'fastest', 28.40, 32, 189.33, 95, 1);

-- Seed Route Hazards
INSERT INTO `route_hazards` (`trip_id`, `hazard_type`, `severity`, `latitude`, `longitude`, `description`)
VALUES 
('trip_1700000002', 'construction', 'moderate', 37.700000, -122.400000, 'Right lane closed due to road resurfacing');

-- Seed AI Co-Pilot Chat History
INSERT INTO `chat_messages` (`id`, `user_id`, `role`, `content`, `created_at`)
VALUES 
('msg_1001', 'usr_default_01', 'assistant', 'Hello Alex! I am RoadSense AI. How can I optimize your navigation today?', 1700000000000),
('msg_1002', 'usr_default_01', 'user', 'What is the safest route to Springfield with minimum hazard risk?', 1700000015000),
('msg_1003', 'usr_default_01', 'assistant', 'The safest route is Expressway 101 via North Exit. Safety Score: 98/100 with zero active hazards reported!', 1700000030000);

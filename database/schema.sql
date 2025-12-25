-- TxMonitor Database Schema
-- สร้าง database ก่อนใช้งาน

CREATE DATABASE IF NOT EXISTS `tx_monitor` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `tx_monitor`;

-- ตาราง users สำหรับเก็บข้อมูลผู้ใช้
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `email` varchar(100) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `status` enum('active','inactive','banned') NOT NULL DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง user_databases สำหรับเก็บการเชื่อมต่อ database ของแต่ละ user
CREATE TABLE IF NOT EXISTS `user_databases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'ชื่อเว็บ/ชื่อที่แสดง',
  `note` text DEFAULT NULL COMMENT 'หมายเหตุเพิ่มเติม',
  `host` varchar(255) NOT NULL,
  `port` int(11) NOT NULL DEFAULT 3306,
  `db_user` varchar(100) NOT NULL,
  `db_password` varchar(255) NOT NULL,
  `db_name` varchar(100) NOT NULL COMMENT 'ชื่อ database',
  `table_name` varchar(100) NOT NULL DEFAULT 'transactions' COMMENT 'ชื่อ table',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_connected` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_user_databases_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง login_logs สำหรับเก็บประวัติการเข้าสู่ระบบ
CREATE TABLE IF NOT EXISTS `login_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `login_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_login_at` (`login_at`),
  CONSTRAINT `fk_login_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้าง admin user เริ่มต้น (password: admin123)
-- bcrypt hash ของ 'admin123'
INSERT INTO `users` (`username`, `email`, `password`, `full_name`, `role`, `status`) VALUES
('admin', 'admin@txmonitor.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4UqWqg8RqK0W3S4m', 'Administrator', 'admin', 'active')
ON DUPLICATE KEY UPDATE `username` = `username`;


CREATE DATABASE IF NOT EXISTS `systeam_support` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `systeam_support`;  

CREATE TABLE `REGION` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `region_name` VARCHAR(150) NOT NULL,
  `created_by` INT UNSIGNED,
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `user_group` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group_name` VARCHAR(150) NOT NULL,
  `created_by` INT UNSIGNED,
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `USERS` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone_number` VARCHAR(20),
  `password` VARCHAR(100),
  `location` INT UNSIGNED,           -- district_id
  `role_id` INT UNSIGNED,
  `created_by` INT UNSIGNED,
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `user_group`(`id`)
);

CREATE TABLE `DISTRICT` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `region_id` INT UNSIGNED NOT NULL,
  `district_name` VARCHAR(150) NOT NULL,
  `created_by` INT UNSIGNED,
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`region_id`) REFERENCES `REGION`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `USERS`(`id`)
);

ALTER TABLE `USERS`
  ADD FOREIGN KEY (`location`) REFERENCES `DISTRICT`(`id`),
  ADD FOREIGN KEY (`created_by`) REFERENCES `USERS`(`id`);

CREATE TABLE `STATION` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `station_code` VARCHAR(50) NOT NULL,
  `station_name` VARCHAR(150) NOT NULL,
  `group_id` INT UNSIGNED,
  `location` INT UNSIGNED,           -- district_id
  `contact_name` VARCHAR(150),
  `contact_number` VARCHAR(20),
  `connect_IP_Address` VARCHAR(45),
  `created_by` INT UNSIGNED,
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`group_id`) REFERENCES `user_group`(`id`),
  FOREIGN KEY (`location`) REFERENCES `DISTRICT`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `USERS`(`id`)
);

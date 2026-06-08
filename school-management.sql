-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: school_management
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_years`
--

DROP TABLE IF EXISTS `academic_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `academic_years_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_years`
--

LOCK TABLES `academic_years` WRITE;
/*!40000 ALTER TABLE `academic_years` DISABLE KEYS */;
INSERT INTO `academic_years` VALUES (1,1,'2025-2026','2025-04-01','2026-03-31',1);
/*!40000 ALTER TABLE `academic_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alumni`
--

DROP TABLE IF EXISTS `alumni`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumni` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `graduation_year` int DEFAULT NULL,
  `current_occupation` varchar(150) DEFAULT NULL,
  `company` varchar(150) DEFAULT NULL,
  `higher_education` varchar(150) DEFAULT NULL,
  `university` varchar(150) DEFAULT NULL,
  `current_city` varchar(100) DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumni`
--

LOCK TABLES `alumni` WRITE;
/*!40000 ALTER TABLE `alumni` DISABLE KEYS */;
INSERT INTO `alumni` VALUES (1,NULL,2018,'Software Engineer','Google',NULL,'IIT Delhi','Bangalore',NULL,1,'2026-06-07 09:09:23'),(2,NULL,2019,'Doctor','AIIMS',NULL,'AIIMS Delhi','Delhi',NULL,0,'2026-06-07 09:09:23');
/*!40000 ALTER TABLE `alumni` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `content` text,
  `target_role` varchar(50) DEFAULT 'all',
  `posted_by` int DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '1',
  `publish_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (1,1,'Annual Day 2025','Annual day celebrations on 20th December.','all',2,1,'2026-06-07',NULL,NULL),(2,1,'Holiday Notice','School closed for Diwali.','all',2,1,'2026-06-07',NULL,NULL),(3,1,'Exam Schedule Released','Final exam timetable is now available.','all',2,1,'2026-06-07',NULL,NULL);
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignment_submissions`
--

DROP TABLE IF EXISTS `assignment_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `student_id` int NOT NULL,
  `file_url` varchar(255) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `marks_obtained` decimal(6,2) DEFAULT NULL,
  `feedback` text,
  `status` enum('pending','submitted','graded','late') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_submission` (`assignment_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `assignment_submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_submissions`
--

LOCK TABLES `assignment_submissions` WRITE;
/*!40000 ALTER TABLE `assignment_submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignment_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `file_url` varchar(255) DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `total_marks` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `subject_id` (`subject_id`),
  KEY `section_id` (`section_id`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `assignments_ibfk_3` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,1,1,1,'English Assignment 1','Complete chapter 1 exercises.',NULL,'2026-06-14 09:09:23',20,'2026-06-07 09:09:23'),(2,1,1,1,'English Assignment 2','Complete chapter 2 exercises.',NULL,'2026-06-21 09:09:23',20,'2026-06-07 09:09:23'),(3,1,2,1,'Mathematics Assignment 1','Complete chapter 1 exercises.',NULL,'2026-06-14 09:09:23',20,'2026-06-07 09:09:23'),(4,1,2,1,'Mathematics Assignment 2','Complete chapter 2 exercises.',NULL,'2026-06-21 09:09:23',20,'2026-06-07 09:09:23'),(5,1,3,1,'Science Assignment 1','Complete chapter 1 exercises.',NULL,'2026-06-14 09:09:23',20,'2026-06-07 09:09:23'),(6,1,3,1,'Science Assignment 2','Complete chapter 2 exercises.',NULL,'2026-06-21 09:09:23',20,'2026-06-07 09:09:23'),(7,1,4,1,'Social Studies Assignment 1','Complete chapter 1 exercises.',NULL,'2026-06-14 09:09:23',20,'2026-06-07 09:09:23'),(8,1,4,1,'Social Studies Assignment 2','Complete chapter 2 exercises.',NULL,'2026-06-21 09:09:23',20,'2026-06-07 09:09:23'),(9,1,5,1,'Computer Science Assignment 1','Complete chapter 1 exercises.',NULL,'2026-06-14 09:09:23',20,'2026-06-07 09:09:23'),(10,1,5,1,'Computer Science Assignment 2','Complete chapter 2 exercises.',NULL,'2026-06-21 09:09:23',20,'2026-06-07 09:09:23');
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `period_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late','excused') NOT NULL,
  `marked_by` int DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `qr_scanned` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_att_student_date` (`student_id`,`date`),
  KEY `period_id` (`period_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`period_id`) REFERENCES `periods` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,1,NULL,'2026-06-07','present',3,NULL,0),(2,2,NULL,'2026-06-07','present',3,NULL,0),(3,3,NULL,'2026-06-07','present',3,NULL,0),(4,4,NULL,'2026-06-07','present',3,NULL,0),(5,5,NULL,'2026-06-07','present',3,NULL,0),(6,6,NULL,'2026-06-07','present',3,NULL,0),(7,7,NULL,'2026-06-07','present',3,NULL,0),(8,8,NULL,'2026-06-07','present',3,NULL,0),(9,9,NULL,'2026-06-07','present',3,NULL,0),(10,10,NULL,'2026-06-07','present',3,NULL,0),(11,1,NULL,'2026-06-06','present',3,NULL,0),(12,2,NULL,'2026-06-06','present',3,NULL,0),(13,3,NULL,'2026-06-06','present',3,NULL,0),(14,4,NULL,'2026-06-06','present',3,NULL,0),(15,5,NULL,'2026-06-06','present',3,NULL,0),(16,6,NULL,'2026-06-06','present',3,NULL,0),(17,7,NULL,'2026-06-06','present',3,NULL,0),(18,8,NULL,'2026-06-06','present',3,NULL,0),(19,9,NULL,'2026-06-06','absent',3,NULL,0),(20,10,NULL,'2026-06-06','present',3,NULL,0),(21,1,NULL,'2026-06-05','present',3,NULL,0),(22,2,NULL,'2026-06-05','present',3,NULL,0),(23,3,NULL,'2026-06-05','present',3,NULL,0),(24,4,NULL,'2026-06-05','present',3,NULL,0),(25,5,NULL,'2026-06-05','present',3,NULL,0),(26,6,NULL,'2026-06-05','present',3,NULL,0),(27,7,NULL,'2026-06-05','present',3,NULL,0),(28,8,NULL,'2026-06-05','present',3,NULL,0),(29,9,NULL,'2026-06-05','present',3,NULL,0),(30,10,NULL,'2026-06-05','present',3,NULL,0),(31,1,NULL,'2026-06-04','present',3,NULL,0),(32,2,NULL,'2026-06-04','present',3,NULL,0),(33,3,NULL,'2026-06-04','present',3,NULL,0),(34,4,NULL,'2026-06-04','present',3,NULL,0),(35,5,NULL,'2026-06-04','present',3,NULL,0),(36,6,NULL,'2026-06-04','present',3,NULL,0),(37,7,NULL,'2026-06-04','present',3,NULL,0),(38,8,NULL,'2026-06-04','present',3,NULL,0),(39,9,NULL,'2026-06-04','present',3,NULL,0),(40,10,NULL,'2026-06-04','present',3,NULL,0),(41,1,NULL,'2026-06-03','present',3,NULL,0),(42,2,NULL,'2026-06-03','present',3,NULL,0),(43,3,NULL,'2026-06-03','present',3,NULL,0),(44,4,NULL,'2026-06-03','present',3,NULL,0),(45,5,NULL,'2026-06-03','present',3,NULL,0),(46,6,NULL,'2026-06-03','present',3,NULL,0),(47,7,NULL,'2026-06-03','present',3,NULL,0),(48,8,NULL,'2026-06-03','present',3,NULL,0),(49,9,NULL,'2026-06-03','present',3,NULL,0),(50,10,NULL,'2026-06-03','present',3,NULL,0),(51,1,NULL,'2026-06-02','present',3,NULL,0),(52,2,NULL,'2026-06-02','present',3,NULL,0),(53,3,NULL,'2026-06-02','present',3,NULL,0),(54,4,NULL,'2026-06-02','present',3,NULL,0),(55,5,NULL,'2026-06-02','present',3,NULL,0),(56,6,NULL,'2026-06-02','present',3,NULL,0),(57,7,NULL,'2026-06-02','present',3,NULL,0),(58,8,NULL,'2026-06-02','present',3,NULL,0),(59,9,NULL,'2026-06-02','present',3,NULL,0),(60,10,NULL,'2026-06-02','present',3,NULL,0),(61,1,NULL,'2026-06-01','present',3,NULL,0),(62,2,NULL,'2026-06-01','present',3,NULL,0),(63,3,NULL,'2026-06-01','present',3,NULL,0),(64,4,NULL,'2026-06-01','present',3,NULL,0),(65,5,NULL,'2026-06-01','present',3,NULL,0),(66,6,NULL,'2026-06-01','present',3,NULL,0),(67,7,NULL,'2026-06-01','present',3,NULL,0),(68,8,NULL,'2026-06-01','present',3,NULL,0),(69,9,NULL,'2026-06-01','present',3,NULL,0),(70,10,NULL,'2026-06-01','present',3,NULL,0),(71,1,NULL,'2026-05-31','present',3,NULL,0),(72,2,NULL,'2026-05-31','present',3,NULL,0),(73,3,NULL,'2026-05-31','absent',3,NULL,0),(74,4,NULL,'2026-05-31','present',3,NULL,0),(75,5,NULL,'2026-05-31','present',3,NULL,0),(76,6,NULL,'2026-05-31','present',3,NULL,0),(77,7,NULL,'2026-05-31','present',3,NULL,0),(78,8,NULL,'2026-05-31','present',3,NULL,0),(79,9,NULL,'2026-05-31','present',3,NULL,0),(80,10,NULL,'2026-05-31','present',3,NULL,0),(81,1,NULL,'2026-05-30','present',3,NULL,0),(82,2,NULL,'2026-05-30','present',3,NULL,0),(83,3,NULL,'2026-05-30','present',3,NULL,0),(84,4,NULL,'2026-05-30','present',3,NULL,0),(85,5,NULL,'2026-05-30','present',3,NULL,0),(86,6,NULL,'2026-05-30','present',3,NULL,0),(87,7,NULL,'2026-05-30','present',3,NULL,0),(88,8,NULL,'2026-05-30','late',3,NULL,0),(89,9,NULL,'2026-05-30','absent',3,NULL,0),(90,10,NULL,'2026-05-30','present',3,NULL,0),(91,1,NULL,'2026-05-29','present',3,NULL,0),(92,2,NULL,'2026-05-29','present',3,NULL,0),(93,3,NULL,'2026-05-29','present',3,NULL,0),(94,4,NULL,'2026-05-29','absent',3,NULL,0),(95,5,NULL,'2026-05-29','present',3,NULL,0),(96,6,NULL,'2026-05-29','present',3,NULL,0),(97,7,NULL,'2026-05-29','present',3,NULL,0),(98,8,NULL,'2026-05-29','present',3,NULL,0),(99,9,NULL,'2026-05-29','present',3,NULL,0),(100,10,NULL,'2026-05-29','late',3,NULL,0),(101,1,NULL,'2026-05-28','present',3,NULL,0),(102,2,NULL,'2026-05-28','present',3,NULL,0),(103,3,NULL,'2026-05-28','present',3,NULL,0),(104,4,NULL,'2026-05-28','present',3,NULL,0),(105,5,NULL,'2026-05-28','present',3,NULL,0),(106,6,NULL,'2026-05-28','present',3,NULL,0),(107,7,NULL,'2026-05-28','present',3,NULL,0),(108,8,NULL,'2026-05-28','present',3,NULL,0),(109,9,NULL,'2026-05-28','present',3,NULL,0),(110,10,NULL,'2026-05-28','present',3,NULL,0),(111,1,NULL,'2026-05-27','present',3,NULL,0),(112,2,NULL,'2026-05-27','present',3,NULL,0),(113,3,NULL,'2026-05-27','present',3,NULL,0),(114,4,NULL,'2026-05-27','present',3,NULL,0),(115,5,NULL,'2026-05-27','present',3,NULL,0),(116,6,NULL,'2026-05-27','present',3,NULL,0),(117,7,NULL,'2026-05-27','present',3,NULL,0),(118,8,NULL,'2026-05-27','present',3,NULL,0),(119,9,NULL,'2026-05-27','present',3,NULL,0),(120,10,NULL,'2026-05-27','present',3,NULL,0),(121,1,NULL,'2026-05-26','present',3,NULL,0),(122,2,NULL,'2026-05-26','present',3,NULL,0),(123,3,NULL,'2026-05-26','present',3,NULL,0),(124,4,NULL,'2026-05-26','present',3,NULL,0),(125,5,NULL,'2026-05-26','present',3,NULL,0),(126,6,NULL,'2026-05-26','present',3,NULL,0),(127,7,NULL,'2026-05-26','late',3,NULL,0),(128,8,NULL,'2026-05-26','present',3,NULL,0),(129,9,NULL,'2026-05-26','present',3,NULL,0),(130,10,NULL,'2026-05-26','present',3,NULL,0),(131,1,NULL,'2026-05-25','present',3,NULL,0),(132,2,NULL,'2026-05-25','present',3,NULL,0),(133,3,NULL,'2026-05-25','present',3,NULL,0),(134,4,NULL,'2026-05-25','absent',3,NULL,0),(135,5,NULL,'2026-05-25','present',3,NULL,0),(136,6,NULL,'2026-05-25','present',3,NULL,0),(137,7,NULL,'2026-05-25','present',3,NULL,0),(138,8,NULL,'2026-05-25','present',3,NULL,0),(139,9,NULL,'2026-05-25','present',3,NULL,0),(140,10,NULL,'2026-05-25','late',3,NULL,0),(141,1,NULL,'2026-05-24','late',3,NULL,0),(142,2,NULL,'2026-05-24','present',3,NULL,0),(143,3,NULL,'2026-05-24','present',3,NULL,0),(144,4,NULL,'2026-05-24','present',3,NULL,0),(145,5,NULL,'2026-05-24','present',3,NULL,0),(146,6,NULL,'2026-05-24','absent',3,NULL,0),(147,7,NULL,'2026-05-24','present',3,NULL,0),(148,8,NULL,'2026-05-24','present',3,NULL,0),(149,9,NULL,'2026-05-24','present',3,NULL,0),(150,10,NULL,'2026-05-24','late',3,NULL,0),(151,1,NULL,'2026-05-23','present',3,NULL,0),(152,2,NULL,'2026-05-23','present',3,NULL,0),(153,3,NULL,'2026-05-23','present',3,NULL,0),(154,4,NULL,'2026-05-23','present',3,NULL,0),(155,5,NULL,'2026-05-23','present',3,NULL,0),(156,6,NULL,'2026-05-23','present',3,NULL,0),(157,7,NULL,'2026-05-23','present',3,NULL,0),(158,8,NULL,'2026-05-23','present',3,NULL,0),(159,9,NULL,'2026-05-23','present',3,NULL,0),(160,10,NULL,'2026-05-23','present',3,NULL,0),(161,1,NULL,'2026-05-22','absent',3,NULL,0),(162,2,NULL,'2026-05-22','late',3,NULL,0),(163,3,NULL,'2026-05-22','present',3,NULL,0),(164,4,NULL,'2026-05-22','present',3,NULL,0),(165,5,NULL,'2026-05-22','present',3,NULL,0),(166,6,NULL,'2026-05-22','present',3,NULL,0),(167,7,NULL,'2026-05-22','absent',3,NULL,0),(168,8,NULL,'2026-05-22','present',3,NULL,0),(169,9,NULL,'2026-05-22','present',3,NULL,0),(170,10,NULL,'2026-05-22','present',3,NULL,0),(171,1,NULL,'2026-05-21','present',3,NULL,0),(172,2,NULL,'2026-05-21','present',3,NULL,0),(173,3,NULL,'2026-05-21','late',3,NULL,0),(174,4,NULL,'2026-05-21','present',3,NULL,0),(175,5,NULL,'2026-05-21','present',3,NULL,0),(176,6,NULL,'2026-05-21','present',3,NULL,0),(177,7,NULL,'2026-05-21','present',3,NULL,0),(178,8,NULL,'2026-05-21','present',3,NULL,0),(179,9,NULL,'2026-05-21','present',3,NULL,0),(180,10,NULL,'2026-05-21','late',3,NULL,0),(181,1,NULL,'2026-05-20','present',3,NULL,0),(182,2,NULL,'2026-05-20','present',3,NULL,0),(183,3,NULL,'2026-05-20','present',3,NULL,0),(184,4,NULL,'2026-05-20','present',3,NULL,0),(185,5,NULL,'2026-05-20','present',3,NULL,0),(186,6,NULL,'2026-05-20','present',3,NULL,0),(187,7,NULL,'2026-05-20','present',3,NULL,0),(188,8,NULL,'2026-05-20','present',3,NULL,0),(189,9,NULL,'2026-05-20','present',3,NULL,0),(190,10,NULL,'2026-05-20','present',3,NULL,0),(191,1,NULL,'2026-05-19','present',3,NULL,0),(192,2,NULL,'2026-05-19','present',3,NULL,0),(193,3,NULL,'2026-05-19','present',3,NULL,0),(194,4,NULL,'2026-05-19','present',3,NULL,0),(195,5,NULL,'2026-05-19','present',3,NULL,0),(196,6,NULL,'2026-05-19','present',3,NULL,0),(197,7,NULL,'2026-05-19','present',3,NULL,0),(198,8,NULL,'2026-05-19','present',3,NULL,0),(199,9,NULL,'2026-05-19','present',3,NULL,0),(200,10,NULL,'2026-05-19','present',3,NULL,0);
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `module` varchar(80) DEFAULT NULL,
  `record_id` int DEFAULT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `ip_address` varchar(60) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_school` (`school_id`),
  KEY `idx_audit_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,2,'login','auth',2,NULL,NULL,'127.0.0.1','curl/8.17.0','2026-06-07 09:11:08'),(2,1,5,'login','auth',5,NULL,NULL,'127.0.0.1','curl/8.17.0','2026-06-07 09:11:09'),(3,1,2,'login','auth',2,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-07 09:13:46'),(4,1,1,'login','auth',1,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-07 09:14:09'),(5,1,1,'create','classes',4,NULL,'{\"name\": \"class 1\", \"school_id\": 1}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-07 09:45:21'),(6,1,3,'login','auth',3,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-07 09:48:02'),(7,1,2,'login','auth',2,NULL,NULL,'127.0.0.1','curl/8.17.0','2026-06-07 10:05:19'),(8,1,2,'update','classes',1,'{\"id\": 1, \"name\": \"Class 10\", \"school_id\": 1}','{\"name\": \"Class 10 (Updated)\"}','127.0.0.1','curl/8.17.0','2026-06-07 10:05:20'),(9,1,2,'update','subjects',1,'{\"id\": 1, \"code\": \"ENG1\", \"name\": \"English\", \"class_id\": 1, \"teacher_id\": 3}','{\"code\": \"ENG10\", \"name\": \"English Literature\"}','127.0.0.1','curl/8.17.0','2026-06-07 10:05:21'),(10,1,1,'update','subjects',10,'{\"id\": 10, \"code\": \"COM2\", \"name\": \"Computer Science\", \"class_id\": 2, \"teacher_id\": null}','{\"code\": \"COM2\", \"name\": \"Computer Science\", \"class_id\": 2, \"teacher_id\": \"4\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-07 10:09:41'),(11,1,5,'login','auth',5,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-07 12:41:54'),(12,1,6,'login','auth',6,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-07 12:46:10'),(13,1,13,'login','auth',13,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-07 12:46:50'),(14,1,9,'login','auth',9,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-07 12:48:04'),(15,1,2,'login','auth',2,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-07 12:49:36');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_issues`
--

DROP TABLE IF EXISTS `book_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_issues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `issued_to_id` int NOT NULL,
  `issued_to_type` enum('student','teacher') NOT NULL,
  `issue_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `status` enum('issued','returned','overdue') DEFAULT 'issued',
  `fine_amount` decimal(10,2) DEFAULT '0.00',
  `fine_paid` tinyint(1) DEFAULT '0',
  `issued_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`),
  CONSTRAINT `book_issues_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_issues`
--

LOCK TABLES `book_issues` WRITE;
/*!40000 ALTER TABLE `book_issues` DISABLE KEYS */;
INSERT INTO `book_issues` VALUES (1,1,1,'student','2026-06-07','2026-06-21',NULL,'issued',0.00,0,8),(2,2,2,'student','2026-06-07','2026-06-21',NULL,'issued',0.00,0,8),(3,3,3,'student','2026-06-07','2026-06-21',NULL,'issued',0.00,0,8);
/*!40000 ALTER TABLE `book_issues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(150) DEFAULT NULL,
  `isbn` varchar(30) DEFAULT NULL,
  `publisher` varchar(150) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `total_copies` int DEFAULT '1',
  `available_copies` int DEFAULT '1',
  `location` varchar(100) DEFAULT NULL,
  `publication_year` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `books_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES (1,1,'The Alchemist','Paulo Coelho','9781939275501',NULL,'Textbook',5,4,NULL,2018,350.00),(2,1,'Wings of Fire','A.P.J Abdul Kalam','9787175362717',NULL,'Fiction',5,4,NULL,2018,350.00),(3,1,'NCERT Mathematics 10','NCERT','9785775996157',NULL,'Biography',5,4,NULL,2018,350.00),(4,1,'Physics Fundamentals','H.C Verma','9788668705557',NULL,'Textbook',5,5,NULL,2018,350.00),(5,1,'A Brief History of Time','Stephen Hawking','9782842514918',NULL,'Reference',5,5,NULL,2018,350.00),(6,1,'To Kill a Mockingbird','Harper Lee','9782274343592',NULL,'Reference',5,5,NULL,2018,350.00),(7,1,'The Diary of a Young Girl','Anne Frank','9782709522466',NULL,'Textbook',5,5,NULL,2018,350.00),(8,1,'Chemistry Class 10','NCERT','9786460422005',NULL,'Fiction',5,5,NULL,2018,350.00),(9,1,'English Grammar','Wren & Martin','9789730977070',NULL,'Fiction',5,5,NULL,2018,350.00),(10,1,'Indian History','Bipan Chandra','9787179707925',NULL,'Reference',5,5,NULL,2018,350.00);
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `canteen_menu`
--

DROP TABLE IF EXISTS `canteen_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canteen_menu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `item_name` varchar(150) DEFAULT NULL,
  `category` varchar(80) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `description` text,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `canteen_menu_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canteen_menu`
--

LOCK TABLES `canteen_menu` WRITE;
/*!40000 ALTER TABLE `canteen_menu` DISABLE KEYS */;
INSERT INTO `canteen_menu` VALUES (1,1,'Veg Sandwich','Snacks',40.00,1,NULL,NULL),(2,1,'Samosa','Snacks',15.00,1,NULL,NULL),(3,1,'Cold Coffee','Beverages',50.00,1,NULL,NULL),(4,1,'Thali','Meals',80.00,1,NULL,NULL);
/*!40000 ALTER TABLE `canteen_menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `canteen_order_items`
--

DROP TABLE IF EXISTS `canteen_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canteen_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `menu_item_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `canteen_order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `canteen_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `canteen_order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `canteen_menu` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canteen_order_items`
--

LOCK TABLES `canteen_order_items` WRITE;
/*!40000 ALTER TABLE `canteen_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `canteen_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `canteen_orders`
--

DROP TABLE IF EXISTS `canteen_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canteen_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `payment_mode` varchar(50) DEFAULT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `canteen_orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canteen_orders`
--

LOCK TABLES `canteen_orders` WRITE;
/*!40000 ALTER TABLE `canteen_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `canteen_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `certificates`
--

DROP TABLE IF EXISTS `certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `type` enum('TC','LC','migration','participation','merit','sports','cultural') NOT NULL,
  `certificate_number` varchar(80) DEFAULT NULL,
  `issued_date` date DEFAULT NULL,
  `issued_by` int DEFAULT NULL,
  `file_url` varchar(255) DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_number` (`certificate_number`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificates`
--

LOCK TABLES `certificates` WRITE;
/*!40000 ALTER TABLE `certificates` DISABLE KEYS */;
/*!40000 ALTER TABLE `certificates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,1,'Class 10 (Updated)'),(2,1,'Class 11'),(3,1,'Class 12'),(4,1,'class 1');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discipline_records`
--

DROP TABLE IF EXISTS `discipline_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discipline_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `incident_date` date DEFAULT NULL,
  `type` enum('positive','negative') NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text,
  `action_taken` text,
  `reported_by` int DEFAULT NULL,
  `parent_notified` tinyint(1) DEFAULT '0',
  `parent_notified_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `discipline_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discipline_records`
--

LOCK TABLES `discipline_records` WRITE;
/*!40000 ALTER TABLE `discipline_records` DISABLE KEYS */;
INSERT INTO `discipline_records` VALUES (1,1,'2025-09-10','negative','Sports','Sample discipline incident description.','Counseling provided',3,0,NULL,'2026-06-07 09:09:23'),(2,2,'2025-09-11','positive','Sports','Sample discipline incident description.','Counseling provided',3,0,NULL,'2026-06-07 09:09:23'),(3,3,'2025-09-12','negative','Behavior','Sample discipline incident description.','Counseling provided',3,0,NULL,'2026-06-07 09:09:23');
/*!40000 ALTER TABLE `discipline_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `file_url` varchar(255) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `category` varchar(80) DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `related_to_id` int DEFAULT NULL,
  `related_to_type` varchar(50) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `description` text,
  `event_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `type` enum('academic','sports','cultural','exam','holiday','other') DEFAULT 'other',
  `target_audience` varchar(80) DEFAULT 'all',
  `venue` varchar(150) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,1,'Sports Day','Sports Day event','2025-12-05',NULL,'sports','all','School Ground',2,1),(2,1,'Science Exhibition','Science Exhibition event','2025-11-20',NULL,'academic','all','School Ground',2,1),(3,1,'Cultural Fest','Cultural Fest event','2026-01-15',NULL,'cultural','all','School Ground',2,1);
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_marks`
--

DROP TABLE IF EXISTS `exam_marks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_marks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exam_id` int NOT NULL,
  `student_id` int NOT NULL,
  `marks_obtained` decimal(6,2) DEFAULT NULL,
  `grade` varchar(5) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `is_absent` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_exam_student` (`exam_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `exam_marks_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_marks_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_marks`
--

LOCK TABLES `exam_marks` WRITE;
/*!40000 ALTER TABLE `exam_marks` DISABLE KEYS */;
INSERT INTO `exam_marks` VALUES (1,1,1,36.00,'B+',NULL,0),(2,1,2,43.00,'A',NULL,0),(3,1,3,30.00,'B',NULL,0),(4,1,4,28.00,'C',NULL,0),(5,1,5,49.00,'A+',NULL,0),(6,1,6,35.00,'B+',NULL,0),(7,1,7,37.00,'B+',NULL,0),(8,1,8,41.00,'A',NULL,0),(9,1,9,43.00,'A',NULL,0),(10,1,10,31.00,'B',NULL,0),(11,2,1,29.00,'C',NULL,0),(12,2,2,34.00,'B',NULL,0),(13,2,3,32.00,'B',NULL,0),(14,2,4,46.00,'A+',NULL,0),(15,2,5,22.00,'D',NULL,0),(16,2,6,25.00,'C',NULL,0),(17,2,7,30.00,'B',NULL,0),(18,2,8,23.00,'D',NULL,0),(19,2,9,33.00,'B',NULL,0),(20,2,10,28.00,'C',NULL,0),(21,3,1,45.00,'A+',NULL,0),(22,3,2,28.00,'C',NULL,0),(23,3,3,44.00,'A',NULL,0),(24,3,4,21.00,'D',NULL,0),(25,3,5,23.00,'D',NULL,0),(26,3,6,31.00,'B',NULL,0),(27,3,7,27.00,'C',NULL,0),(28,3,8,30.00,'B',NULL,0),(29,3,9,35.00,'B+',NULL,0),(30,3,10,20.00,'D',NULL,0),(31,4,1,34.00,'B',NULL,0),(32,4,2,36.00,'B+',NULL,0),(33,4,3,32.00,'B',NULL,0),(34,4,4,48.00,'A+',NULL,0),(35,4,5,31.00,'B',NULL,0),(36,4,6,38.00,'B+',NULL,0),(37,4,7,27.00,'C',NULL,0),(38,4,8,40.00,'A',NULL,0),(39,4,9,34.00,'B',NULL,0),(40,4,10,44.00,'A',NULL,0),(41,5,1,25.00,'C',NULL,0),(42,5,2,40.00,'A',NULL,0),(43,5,3,22.00,'D',NULL,0),(44,5,4,25.00,'C',NULL,0),(45,5,5,49.00,'A+',NULL,0),(46,5,6,35.00,'B+',NULL,0),(47,5,7,33.00,'B',NULL,0),(48,5,8,24.00,'D',NULL,0),(49,5,9,37.00,'B+',NULL,0),(50,5,10,31.00,'B',NULL,0);
/*!40000 ALTER TABLE `exam_marks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_schedule`
--

DROP TABLE IF EXISTS `exam_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_schedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `academic_year_id` int DEFAULT NULL,
  `exam_type` enum('unit_test','midterm','final','assignment') DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `exam_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `room_number` varchar(30) DEFAULT NULL,
  `invigilator_id` int DEFAULT NULL,
  `hall_ticket_generated` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `subject_id` (`subject_id`),
  KEY `section_id` (`section_id`),
  CONSTRAINT `exam_schedule_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `exam_schedule_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_schedule`
--

LOCK TABLES `exam_schedule` WRITE;
/*!40000 ALTER TABLE `exam_schedule` DISABLE KEYS */;
INSERT INTO `exam_schedule` VALUES (1,1,'final',1,1,'2026-03-10','10:00:00','13:00:00','Room 101',3,0),(2,1,'final',2,1,'2026-03-10','10:00:00','13:00:00','Room 101',3,0),(3,1,'final',3,1,'2026-03-10','10:00:00','13:00:00','Room 101',3,0),(4,1,'final',4,1,'2026-03-10','10:00:00','13:00:00','Room 101',3,0),(5,1,'final',5,1,'2026-03-10','10:00:00','13:00:00','Room 101',3,0);
/*!40000 ALTER TABLE `exam_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `type` enum('unit_test','midterm','final','assignment') NOT NULL,
  `section_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `total_marks` int DEFAULT '100',
  `passing_marks` int DEFAULT '35',
  `exam_date` date DEFAULT NULL,
  `academic_year_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `subject_id` (`subject_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exams_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `exams_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`
--

LOCK TABLES `exams` WRITE;
/*!40000 ALTER TABLE `exams` DISABLE KEYS */;
INSERT INTO `exams` VALUES (1,'Unit Test 1 - English','unit_test',1,1,1,50,18,'2025-08-15',1),(2,'Unit Test 1 - Mathematics','unit_test',1,2,1,50,18,'2025-08-15',1),(3,'Unit Test 1 - Science','unit_test',1,3,1,50,18,'2025-08-15',1),(4,'Unit Test 1 - Social Studies','unit_test',1,4,1,50,18,'2025-08-15',1),(5,'Unit Test 1 - Computer Science','unit_test',1,5,1,50,18,'2025-08-15',1);
/*!40000 ALTER TABLE `exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `expense_date` date DEFAULT NULL,
  `paid_to` varchar(150) DEFAULT NULL,
  `payment_mode` varchar(50) DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `description` text,
  `receipt_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,1,'Electricity Bill','Utilities',25000.00,'2025-09-01','Vendor','cheque',7,NULL,NULL),(2,1,'Stationery Purchase','Supplies',12000.00,'2025-09-01','Vendor','cheque',7,NULL,NULL),(3,1,'Building Maintenance','Maintenance',50000.00,'2025-09-01','Vendor','cheque',7,NULL,NULL);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_categories`
--

DROP TABLE IF EXISTS `fee_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `is_recurring` tinyint(1) DEFAULT '0',
  `frequency` enum('monthly','quarterly','yearly','one_time') DEFAULT 'one_time',
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `fee_categories_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_categories`
--

LOCK TABLES `fee_categories` WRITE;
/*!40000 ALTER TABLE `fee_categories` DISABLE KEYS */;
INSERT INTO `fee_categories` VALUES (1,1,'Tuition Fee','Quarterly tuition fee',1,'quarterly'),(2,1,'Transport Fee','Monthly bus fee',1,'monthly');
/*!40000 ALTER TABLE `fee_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_invoices`
--

DROP TABLE IF EXISTS `fee_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `fee_category_id` int DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `due_date` date DEFAULT NULL,
  `paid_amount` decimal(12,2) DEFAULT '0.00',
  `balance` decimal(12,2) DEFAULT NULL,
  `status` enum('pending','partial','paid','overdue') DEFAULT 'pending',
  `academic_year_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inv_student` (`student_id`),
  KEY `fee_category_id` (`fee_category_id`),
  CONSTRAINT `fee_invoices_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fee_invoices_ibfk_2` FOREIGN KEY (`fee_category_id`) REFERENCES `fee_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_invoices`
--

LOCK TABLES `fee_invoices` WRITE;
/*!40000 ALTER TABLE `fee_invoices` DISABLE KEYS */;
INSERT INTO `fee_invoices` VALUES (1,1,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(2,1,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(3,2,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(4,2,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(5,3,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(6,3,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(7,4,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(8,4,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(9,5,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(10,5,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(11,6,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(12,6,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(13,7,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(14,7,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(15,8,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(16,8,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(17,9,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(18,9,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(19,10,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(20,10,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(21,11,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(22,11,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(23,12,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(24,12,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(25,13,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(26,13,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(27,14,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(28,14,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(29,15,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(30,15,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(31,16,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(32,16,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(33,17,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(34,17,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(35,18,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(36,18,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(37,19,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(38,19,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(39,20,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(40,20,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(41,21,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(42,21,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(43,22,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(44,22,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(45,23,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(46,23,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(47,24,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(48,24,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(49,25,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(50,25,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(51,26,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(52,26,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(53,27,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(54,27,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(55,28,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(56,28,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(57,29,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(58,29,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(59,30,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(60,30,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(61,31,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(62,31,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(63,32,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(64,32,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(65,33,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(66,33,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(67,34,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(68,34,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(69,35,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(70,35,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(71,36,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(72,36,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(73,37,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(74,37,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(75,38,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(76,38,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(77,39,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(78,39,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(79,40,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(80,40,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(81,41,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(82,41,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(83,42,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(84,42,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(85,43,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(86,43,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(87,44,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(88,44,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(89,45,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(90,45,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(91,46,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(92,46,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(93,47,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(94,47,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(95,48,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(96,48,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(97,49,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(98,49,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(99,50,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(100,50,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(101,51,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(102,51,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(103,52,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(104,52,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(105,53,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(106,53,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(107,54,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(108,54,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(109,55,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(110,55,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(111,56,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(112,56,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(113,57,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(114,57,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(115,58,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(116,58,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(117,59,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(118,59,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1),(119,60,1,15000.00,'2025-07-15',15000.00,0.00,'paid',1),(120,60,1,15000.00,'2025-10-15',0.00,15000.00,'pending',1);
/*!40000 ALTER TABLE `fee_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_payments`
--

DROP TABLE IF EXISTS `fee_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `student_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `payment_mode` enum('cash','online','cheque','upi') DEFAULT 'cash',
  `transaction_id` varchar(120) DEFAULT NULL,
  `received_by` int DEFAULT NULL,
  `receipt_number` varchar(80) DEFAULT NULL,
  `gateway_order_id` varchar(120) DEFAULT NULL,
  `gateway_payment_id` varchar(120) DEFAULT NULL,
  `gateway_signature` varchar(255) DEFAULT NULL,
  `is_online` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `invoice_id` (`invoice_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `fee_payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `fee_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fee_payments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_payments`
--

LOCK TABLES `fee_payments` WRITE;
/*!40000 ALTER TABLE `fee_payments` DISABLE KEYS */;
INSERT INTO `fee_payments` VALUES (1,1,1,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-1-6528',NULL,NULL,NULL,0),(2,3,2,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-2-5519',NULL,NULL,NULL,0),(3,5,3,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-3-7690',NULL,NULL,NULL,0),(4,7,4,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-4-4367',NULL,NULL,NULL,0),(5,9,5,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-5-5813',NULL,NULL,NULL,0),(6,11,6,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-6-9392',NULL,NULL,NULL,0),(7,13,7,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-7-2820',NULL,NULL,NULL,0),(8,15,8,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-8-6543',NULL,NULL,NULL,0),(9,17,9,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-9-9335',NULL,NULL,NULL,0),(10,19,10,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-10-3563',NULL,NULL,NULL,0),(11,21,11,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-11-5179',NULL,NULL,NULL,0),(12,23,12,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-12-9134',NULL,NULL,NULL,0),(13,25,13,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-13-6848',NULL,NULL,NULL,0),(14,27,14,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-14-5572',NULL,NULL,NULL,0),(15,29,15,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-15-8227',NULL,NULL,NULL,0),(16,31,16,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-16-7182',NULL,NULL,NULL,0),(17,33,17,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-17-857',NULL,NULL,NULL,0),(18,35,18,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-18-7552',NULL,NULL,NULL,0),(19,37,19,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-19-2660',NULL,NULL,NULL,0),(20,39,20,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-20-272',NULL,NULL,NULL,0),(21,41,21,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-21-8562',NULL,NULL,NULL,0),(22,43,22,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-22-6434',NULL,NULL,NULL,0),(23,45,23,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-23-3043',NULL,NULL,NULL,0),(24,47,24,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-24-5953',NULL,NULL,NULL,0),(25,49,25,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-25-4842',NULL,NULL,NULL,0),(26,51,26,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-26-8561',NULL,NULL,NULL,0),(27,53,27,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-27-1433',NULL,NULL,NULL,0),(28,55,28,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-28-7229',NULL,NULL,NULL,0),(29,57,29,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-29-1129',NULL,NULL,NULL,0),(30,59,30,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-30-6751',NULL,NULL,NULL,0),(31,61,31,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-31-9494',NULL,NULL,NULL,0),(32,63,32,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-32-8189',NULL,NULL,NULL,0),(33,65,33,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-33-6327',NULL,NULL,NULL,0),(34,67,34,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-34-7130',NULL,NULL,NULL,0),(35,69,35,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-35-7516',NULL,NULL,NULL,0),(36,71,36,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-36-670',NULL,NULL,NULL,0),(37,73,37,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-37-4171',NULL,NULL,NULL,0),(38,75,38,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-38-9473',NULL,NULL,NULL,0),(39,77,39,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-39-1046',NULL,NULL,NULL,0),(40,79,40,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-40-7415',NULL,NULL,NULL,0),(41,81,41,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-41-6916',NULL,NULL,NULL,0),(42,83,42,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-42-8062',NULL,NULL,NULL,0),(43,85,43,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-43-9982',NULL,NULL,NULL,0),(44,87,44,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-44-819',NULL,NULL,NULL,0),(45,89,45,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-45-4451',NULL,NULL,NULL,0),(46,91,46,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-46-8887',NULL,NULL,NULL,0),(47,93,47,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-47-4139',NULL,NULL,NULL,0),(48,95,48,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-48-3514',NULL,NULL,NULL,0),(49,97,49,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-49-6619',NULL,NULL,NULL,0),(50,99,50,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-50-9754',NULL,NULL,NULL,0),(51,101,51,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-51-3033',NULL,NULL,NULL,0),(52,103,52,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-52-5909',NULL,NULL,NULL,0),(53,105,53,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-53-9355',NULL,NULL,NULL,0),(54,107,54,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-54-808',NULL,NULL,NULL,0),(55,109,55,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-55-6692',NULL,NULL,NULL,0),(56,111,56,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-56-754',NULL,NULL,NULL,0),(57,113,57,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-57-5118',NULL,NULL,NULL,0),(58,115,58,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-58-5869',NULL,NULL,NULL,0),(59,117,59,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-59-3771',NULL,NULL,NULL,0),(60,119,60,15000.00,'2026-06-07 14:39:23','cash',NULL,7,'RCPT-60-2590',NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `fee_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_structures`
--

DROP TABLE IF EXISTS `fee_structures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_structures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_id` int NOT NULL,
  `fee_category_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `due_date` date DEFAULT NULL,
  `academic_year_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  KEY `fee_category_id` (`fee_category_id`),
  CONSTRAINT `fee_structures_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fee_structures_ibfk_2` FOREIGN KEY (`fee_category_id`) REFERENCES `fee_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_structures`
--

LOCK TABLES `fee_structures` WRITE;
/*!40000 ALTER TABLE `fee_structures` DISABLE KEYS */;
INSERT INTO `fee_structures` VALUES (1,1,1,15000.00,'2025-07-15',1),(2,2,1,15000.00,'2025-07-15',1),(3,3,1,15000.00,'2025-07-15',1);
/*!40000 ALTER TABLE `fee_structures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grade_config`
--

DROP TABLE IF EXISTS `grade_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grade_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `grade_name` varchar(5) DEFAULT NULL,
  `min_percentage` decimal(5,2) DEFAULT NULL,
  `max_percentage` decimal(5,2) DEFAULT NULL,
  `grade_point` decimal(4,2) DEFAULT NULL,
  `remark` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `grade_config_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grade_config`
--

LOCK TABLES `grade_config` WRITE;
/*!40000 ALTER TABLE `grade_config` DISABLE KEYS */;
INSERT INTO `grade_config` VALUES (1,1,'A+',90.00,100.00,10.00,'Outstanding'),(2,1,'A',80.00,89.99,9.00,'Excellent'),(3,1,'B+',70.00,79.99,8.00,'Very Good'),(4,1,'B',60.00,69.99,7.00,'Good'),(5,1,'C',50.00,59.99,6.00,'Average'),(6,1,'D',40.00,49.99,5.00,'Pass'),(7,1,'F',0.00,39.99,0.00,'Fail');
/*!40000 ALTER TABLE `grade_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `health_records`
--

DROP TABLE IF EXISTS `health_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `health_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `height` decimal(5,2) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `allergies` text,
  `medical_conditions` text,
  `doctor_name` varchar(120) DEFAULT NULL,
  `doctor_phone` varchar(30) DEFAULT NULL,
  `emergency_contact` varchar(30) DEFAULT NULL,
  `last_checkup_date` date DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `health_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `health_records`
--

LOCK TABLES `health_records` WRITE;
/*!40000 ALTER TABLE `health_records` DISABLE KEYS */;
INSERT INTO `health_records` VALUES (1,1,'A+',150.00,45.00,NULL,NULL,NULL,NULL,NULL,'2025-07-01',NULL),(2,2,'O+',151.00,46.00,NULL,NULL,NULL,NULL,NULL,'2025-07-01',NULL),(3,3,'O+',152.00,47.00,NULL,NULL,NULL,NULL,NULL,'2025-07-01',NULL),(4,4,'B+',153.00,48.00,NULL,NULL,NULL,NULL,NULL,'2025-07-01',NULL),(5,5,'A+',154.00,49.00,NULL,NULL,NULL,NULL,NULL,'2025-07-01',NULL);
/*!40000 ALTER TABLE `health_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `type` enum('national','school','exam') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `holidays_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
INSERT INTO `holidays` VALUES (1,1,'Diwali','2025-10-20','national'),(2,1,'Republic Day','2026-01-26','national');
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostel_allocations`
--

DROP TABLE IF EXISTS `hostel_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_allocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `room_id` int NOT NULL,
  `check_in_date` date DEFAULT NULL,
  `check_out_date` date DEFAULT NULL,
  `monthly_fee` decimal(10,2) DEFAULT NULL,
  `status` enum('active','vacated') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `hostel_allocations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hostel_allocations_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `hostel_rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_allocations`
--

LOCK TABLES `hostel_allocations` WRITE;
/*!40000 ALTER TABLE `hostel_allocations` DISABLE KEYS */;
INSERT INTO `hostel_allocations` VALUES (1,1,1,'2026-06-07',NULL,5000.00,'active'),(2,2,2,'2026-06-07',NULL,5000.00,'active'),(3,3,3,'2026-06-07',NULL,5000.00,'active');
/*!40000 ALTER TABLE `hostel_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostel_fees`
--

DROP TABLE IF EXISTS `hostel_fees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_fees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `allocation_id` int NOT NULL,
  `month` varchar(20) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `paid_date` date DEFAULT NULL,
  `status` enum('pending','paid') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `allocation_id` (`allocation_id`),
  CONSTRAINT `hostel_fees_ibfk_1` FOREIGN KEY (`allocation_id`) REFERENCES `hostel_allocations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_fees`
--

LOCK TABLES `hostel_fees` WRITE;
/*!40000 ALTER TABLE `hostel_fees` DISABLE KEYS */;
INSERT INTO `hostel_fees` VALUES (1,1,'2025-09',5000.00,'2025-09-10',NULL,'pending'),(2,2,'2025-09',5000.00,'2025-09-10',NULL,'pending'),(3,3,'2025-09',5000.00,'2025-09-10',NULL,'pending');
/*!40000 ALTER TABLE `hostel_fees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostel_rooms`
--

DROP TABLE IF EXISTS `hostel_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hostel_id` int NOT NULL,
  `room_number` varchar(30) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `type` enum('single','double','triple','dormitory') DEFAULT NULL,
  `monthly_fee` decimal(10,2) DEFAULT NULL,
  `floor` varchar(20) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `hostel_id` (`hostel_id`),
  CONSTRAINT `hostel_rooms_ibfk_1` FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_rooms`
--

LOCK TABLES `hostel_rooms` WRITE;
/*!40000 ALTER TABLE `hostel_rooms` DISABLE KEYS */;
INSERT INTO `hostel_rooms` VALUES (1,1,'R101',3,'triple',5000.00,'Floor 1',1),(2,1,'R102',3,'triple',5000.00,'Floor 1',1),(3,1,'R103',3,'triple',5000.00,'Floor 1',1),(4,1,'R104',3,'triple',5000.00,'Floor 1',1),(5,1,'R105',3,'triple',5000.00,'Floor 1',1);
/*!40000 ALTER TABLE `hostel_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostels`
--

DROP TABLE IF EXISTS `hostels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `type` enum('boys','girls','co-ed') DEFAULT NULL,
  `total_rooms` int DEFAULT NULL,
  `warden_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `hostels_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostels`
--

LOCK TABLES `hostels` WRITE;
/*!40000 ALTER TABLE `hostels` DISABLE KEYS */;
INSERT INTO `hostels` VALUES (1,1,'Boys Hostel','boys',5,10);
/*!40000 ALTER TABLE `hostels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `category` varchar(80) DEFAULT NULL,
  `quantity` int DEFAULT '0',
  `unit` varchar(30) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `minimum_stock` int DEFAULT '0',
  `supplier` varchar(150) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `inventory_items_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
INSERT INTO `inventory_items` VALUES (1,1,'Whiteboard Marker','Stationery',200,'pcs',25.00,10,NULL,NULL,'2026-06-07 09:09:23'),(2,1,'A4 Paper Ream','Stationery',50,'ream',25.00,10,NULL,NULL,'2026-06-07 09:09:23'),(3,1,'Football','Sports',15,'pcs',25.00,10,NULL,NULL,'2026-06-07 09:09:23');
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `transaction_type` enum('in','out') NOT NULL,
  `quantity` int DEFAULT NULL,
  `reason` varchar(150) DEFAULT NULL,
  `done_by` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_applications`
--

DROP TABLE IF EXISTS `leave_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `leave_type_id` int DEFAULT NULL,
  `from_date` date DEFAULT NULL,
  `to_date` date DEFAULT NULL,
  `total_days` int DEFAULT NULL,
  `reason` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `staff_id` (`staff_id`),
  KEY `leave_type_id` (`leave_type_id`),
  CONSTRAINT `leave_applications_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_applications_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_applications`
--

LOCK TABLES `leave_applications` WRITE;
/*!40000 ALTER TABLE `leave_applications` DISABLE KEYS */;
INSERT INTO `leave_applications` VALUES (1,1,1,'2025-10-01','2025-10-02',2,'Personal work','pending',NULL,'2026-06-07 09:09:23');
/*!40000 ALTER TABLE `leave_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_balances`
--

DROP TABLE IF EXISTS `leave_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `leave_type_id` int DEFAULT NULL,
  `academic_year_id` int DEFAULT NULL,
  `total_days` int DEFAULT NULL,
  `used_days` int DEFAULT '0',
  `remaining_days` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `staff_id` (`staff_id`),
  KEY `leave_type_id` (`leave_type_id`),
  CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_balances_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_balances`
--

LOCK TABLES `leave_balances` WRITE;
/*!40000 ALTER TABLE `leave_balances` DISABLE KEYS */;
INSERT INTO `leave_balances` VALUES (1,1,1,1,12,2,10),(2,1,2,1,12,2,10),(3,1,3,1,12,2,10),(4,1,4,1,12,2,10),(5,2,1,1,12,2,10),(6,2,2,1,12,2,10),(7,2,3,1,12,2,10),(8,2,4,1,12,2,10),(9,3,1,1,12,2,10),(10,3,2,1,12,2,10),(11,3,3,1,12,2,10),(12,3,4,1,12,2,10);
/*!40000 ALTER TABLE `leave_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_types`
--

DROP TABLE IF EXISTS `leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `name` varchar(80) DEFAULT NULL,
  `days_allowed` int DEFAULT NULL,
  `is_paid` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `leave_types_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_types`
--

LOCK TABLES `leave_types` WRITE;
/*!40000 ALTER TABLE `leave_types` DISABLE KEYS */;
INSERT INTO `leave_types` VALUES (1,1,'Casual Leave',12,1),(2,1,'Sick Leave',10,1),(3,1,'Earned Leave',15,1),(4,1,'Unpaid Leave',0,0);
/*!40000 ALTER TABLE `leave_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `library_members`
--

DROP TABLE IF EXISTS `library_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `library_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_type` enum('student','teacher') DEFAULT 'student',
  `membership_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `max_books_allowed` int DEFAULT '3',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `library_members_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `library_members`
--

LOCK TABLES `library_members` WRITE;
/*!40000 ALTER TABLE `library_members` DISABLE KEYS */;
INSERT INTO `library_members` VALUES (1,5,'student','2026-06-07',1,3);
/*!40000 ALTER TABLE `library_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_visits`
--

DROP TABLE IF EXISTS `medical_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_visits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `visit_date` date DEFAULT NULL,
  `symptoms` text,
  `diagnosis` text,
  `treatment` text,
  `doctor` varchar(120) DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `notes` text,
  `medicine_given` text,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `medical_visits_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_visits`
--

LOCK TABLES `medical_visits` WRITE;
/*!40000 ALTER TABLE `medical_visits` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `body` text,
  `is_read` tinyint(1) DEFAULT '0',
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `parent_message_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notice_board`
--

DROP TABLE IF EXISTS `notice_board`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notice_board` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `content` text,
  `category` varchar(80) DEFAULT NULL,
  `posted_by` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `notice_board_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notice_board`
--

LOCK TABLES `notice_board` WRITE;
/*!40000 ALTER TABLE `notice_board` DISABLE KEYS */;
INSERT INTO `notice_board` VALUES (1,1,'Fee Reminder','Q2 fees due by 15th October.','General',2,1,'2026-06-07 09:09:23'),(2,1,'PTM Announcement','Parent teacher meeting this Saturday.','General',2,1,'2026-06-07 09:09:23');
/*!40000 ALTER TABLE `notice_board` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_logs`
--

DROP TABLE IF EXISTS `notification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `type` enum('sms','email') NOT NULL,
  `recipient` varchar(150) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text,
  `status` enum('sent','failed','pending') DEFAULT 'pending',
  `sent_at` datetime DEFAULT NULL,
  `error_message` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_logs`
--

LOCK TABLES `notification_logs` WRITE;
/*!40000 ALTER TABLE `notification_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `message` text,
  `type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,5,'Welcome!','Welcome to the School Management System.','info',1,NULL,'2026-06-07 09:09:23'),(2,6,'Fee Reminder','Q2 fees are due soon.','fee',0,NULL,'2026-06-07 09:09:23');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_classes`
--

DROP TABLE IF EXISTS `online_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `meeting_link` varchar(255) DEFAULT NULL,
  `platform` enum('google_meet','zoom','teams') DEFAULT 'google_meet',
  `scheduled_at` datetime DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `recording_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `section_id` (`section_id`),
  CONSTRAINT `online_classes_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `online_classes_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_classes`
--

LOCK TABLES `online_classes` WRITE;
/*!40000 ALTER TABLE `online_classes` DISABLE KEYS */;
/*!40000 ALTER TABLE `online_classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_codes`
--

DROP TABLE IF EXISTS `otp_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `purpose` enum('login','reset') NOT NULL,
  `code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otp_user` (`user_id`,`purpose`),
  CONSTRAINT `otp_codes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_codes`
--

LOCK TABLES `otp_codes` WRITE;
/*!40000 ALTER TABLE `otp_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `otp_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parents`
--

DROP TABLE IF EXISTS `parents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `relation` varchar(50) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `annual_income` decimal(12,2) DEFAULT NULL,
  `address` text,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `parents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `parents_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parents`
--

LOCK TABLES `parents` WRITE;
/*!40000 ALTER TABLE `parents` DISABLE KEYS */;
INSERT INTO `parents` VALUES (1,6,1,'Father','Engineer',501000.00,NULL),(2,19,2,'Father','Business',502000.00,NULL),(3,21,3,'Father','Doctor',503000.00,NULL),(4,23,4,'Father','Teacher',504000.00,NULL),(5,25,5,'Father','Doctor',505000.00,NULL),(6,27,6,'Father','Doctor',506000.00,NULL),(7,29,7,'Father','Engineer',507000.00,NULL),(8,31,8,'Father','Engineer',508000.00,NULL),(9,33,9,'Father','Doctor',509000.00,NULL),(10,35,10,'Father','Doctor',510000.00,NULL),(11,37,11,'Father','Teacher',511000.00,NULL),(12,39,12,'Father','Engineer',512000.00,NULL),(13,41,13,'Father','Engineer',513000.00,NULL),(14,43,14,'Father','Business',514000.00,NULL),(15,45,15,'Father','Doctor',515000.00,NULL),(16,47,16,'Father','Engineer',516000.00,NULL),(17,49,17,'Father','Engineer',517000.00,NULL),(18,51,18,'Father','Engineer',518000.00,NULL),(19,53,19,'Father','Business',519000.00,NULL),(20,55,20,'Father','Engineer',520000.00,NULL),(21,57,21,'Father','Doctor',521000.00,NULL),(22,59,22,'Father','Engineer',522000.00,NULL),(23,61,23,'Father','Doctor',523000.00,NULL),(24,63,24,'Father','Engineer',524000.00,NULL),(25,65,25,'Father','Teacher',525000.00,NULL),(26,67,26,'Father','Engineer',526000.00,NULL),(27,69,27,'Father','Engineer',527000.00,NULL),(28,71,28,'Father','Teacher',528000.00,NULL),(29,73,29,'Father','Doctor',529000.00,NULL),(30,75,30,'Father','Engineer',530000.00,NULL),(31,77,31,'Father','Doctor',531000.00,NULL),(32,79,32,'Father','Engineer',532000.00,NULL),(33,81,33,'Father','Engineer',533000.00,NULL),(34,83,34,'Father','Doctor',534000.00,NULL),(35,85,35,'Father','Engineer',535000.00,NULL),(36,87,36,'Father','Doctor',536000.00,NULL),(37,89,37,'Father','Doctor',537000.00,NULL),(38,91,38,'Father','Engineer',538000.00,NULL),(39,93,39,'Father','Business',539000.00,NULL),(40,95,40,'Father','Teacher',540000.00,NULL),(41,97,41,'Father','Doctor',541000.00,NULL),(42,99,42,'Father','Engineer',542000.00,NULL),(43,101,43,'Father','Engineer',543000.00,NULL),(44,103,44,'Father','Business',544000.00,NULL),(45,105,45,'Father','Engineer',545000.00,NULL),(46,107,46,'Father','Doctor',546000.00,NULL),(47,109,47,'Father','Business',547000.00,NULL),(48,111,48,'Father','Engineer',548000.00,NULL),(49,113,49,'Father','Engineer',549000.00,NULL),(50,115,50,'Father','Engineer',550000.00,NULL),(51,117,51,'Father','Doctor',551000.00,NULL),(52,119,52,'Father','Business',552000.00,NULL),(53,121,53,'Father','Business',553000.00,NULL),(54,123,54,'Father','Engineer',554000.00,NULL),(55,125,55,'Father','Teacher',555000.00,NULL),(56,127,56,'Father','Business',556000.00,NULL),(57,129,57,'Father','Business',557000.00,NULL),(58,131,58,'Father','Teacher',558000.00,NULL),(59,133,59,'Father','Business',559000.00,NULL),(60,135,60,'Father','Teacher',560000.00,NULL);
/*!40000 ALTER TABLE `parents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_gateway_logs`
--

DROP TABLE IF EXISTS `payment_gateway_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_gateway_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int DEFAULT NULL,
  `gateway` varchar(50) DEFAULT 'razorpay',
  `order_id` varchar(120) DEFAULT NULL,
  `payment_id` varchar(120) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `response_json` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_gateway_logs`
--

LOCK TABLES `payment_gateway_logs` WRITE;
/*!40000 ALTER TABLE `payment_gateway_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_gateway_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll`
--

DROP TABLE IF EXISTS `payroll`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `month` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `basic_salary` decimal(12,2) DEFAULT NULL,
  `hra` decimal(12,2) DEFAULT '0.00',
  `da` decimal(12,2) DEFAULT '0.00',
  `other_allowances` decimal(12,2) DEFAULT '0.00',
  `tds` decimal(12,2) DEFAULT '0.00',
  `pf` decimal(12,2) DEFAULT '0.00',
  `esi` decimal(12,2) DEFAULT '0.00',
  `lop_days` int DEFAULT '0',
  `lop_deduction` decimal(12,2) DEFAULT '0.00',
  `net_salary` decimal(12,2) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `payment_mode` varchar(50) DEFAULT NULL,
  `status` enum('pending','paid') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll`
--

LOCK TABLES `payroll` WRITE;
/*!40000 ALTER TABLE `payroll` DISABLE KEYS */;
INSERT INTO `payroll` VALUES (1,1,6,2026,40000.00,8000.00,4000.00,0.00,0.00,4800.00,300.00,0,0.00,46900.00,NULL,NULL,'pending'),(2,1,5,2026,40000.00,8000.00,4000.00,0.00,0.00,4800.00,300.00,0,0.00,46900.00,'2026-04-30',NULL,'paid'),(3,1,4,2026,40000.00,8000.00,4000.00,0.00,0.00,4800.00,300.00,0,0.00,46900.00,'2026-03-31',NULL,'paid'),(4,2,6,2026,40000.00,8000.00,4000.00,0.00,0.00,4800.00,300.00,0,0.00,46900.00,NULL,NULL,'pending'),(5,2,5,2026,40000.00,8000.00,4000.00,0.00,0.00,4800.00,300.00,0,0.00,46900.00,'2026-04-30',NULL,'paid'),(6,2,4,2026,40000.00,8000.00,4000.00,0.00,0.00,4800.00,300.00,0,0.00,46900.00,'2026-03-31',NULL,'paid'),(7,3,6,2026,40000.00,8000.00,4000.00,0.00,0.00,4800.00,300.00,0,0.00,46900.00,NULL,NULL,'pending'),(8,3,5,2026,40000.00,8000.00,4000.00,0.00,0.00,4800.00,300.00,0,0.00,46900.00,'2026-04-30',NULL,'paid'),(9,3,4,2026,40000.00,8000.00,4000.00,0.00,0.00,4800.00,300.00,0,0.00,46900.00,'2026-03-31',NULL,'paid');
/*!40000 ALTER TABLE `payroll` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `period_settings`
--

DROP TABLE IF EXISTS `period_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `period_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `before_lunch_duration` int DEFAULT '45',
  `after_lunch_duration` int DEFAULT '30',
  `lunch_break_start` time DEFAULT NULL,
  `lunch_break_end` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `period_settings_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `period_settings`
--

LOCK TABLES `period_settings` WRITE;
/*!40000 ALTER TABLE `period_settings` DISABLE KEYS */;
INSERT INTO `period_settings` VALUES (1,1,45,30,'12:00:00','12:30:00');
/*!40000 ALTER TABLE `period_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periods`
--

DROP TABLE IF EXISTS `periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `periods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `subject_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `period_number` int DEFAULT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `is_before_lunch` tinyint(1) DEFAULT '1',
  `academic_year_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `subject_id` (`subject_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `periods_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `periods_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `periods_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periods`
--

LOCK TABLES `periods` WRITE;
/*!40000 ALTER TABLE `periods` DISABLE KEYS */;
INSERT INTO `periods` VALUES (1,1,1,1,1,'Monday','08:00:00','08:45:00',45,1,1),(2,1,2,2,2,'Monday','09:00:00','09:45:00',45,1,1),(3,1,3,3,3,'Monday','10:00:00','10:45:00',45,1,1),(4,1,4,4,4,'Monday','11:00:00','11:45:00',45,1,1),(5,1,5,5,5,'Monday','12:00:00','12:45:00',30,0,1),(6,1,1,1,6,'Monday','13:00:00','13:45:00',30,0,1),(7,1,2,2,7,'Monday','14:00:00','14:45:00',30,0,1),(8,1,3,3,8,'Monday','15:00:00','15:45:00',30,0,1),(9,1,1,1,1,'Tuesday','08:00:00','08:45:00',45,1,1),(10,1,2,2,2,'Tuesday','09:00:00','09:45:00',45,1,1),(11,1,3,3,3,'Tuesday','10:00:00','10:45:00',45,1,1),(12,1,4,4,4,'Tuesday','11:00:00','11:45:00',45,1,1),(13,1,5,5,5,'Tuesday','12:00:00','12:45:00',30,0,1),(14,1,1,1,6,'Tuesday','13:00:00','13:45:00',30,0,1),(15,1,2,2,7,'Tuesday','14:00:00','14:45:00',30,0,1),(16,1,3,3,8,'Tuesday','15:00:00','15:45:00',30,0,1),(17,1,1,1,1,'Wednesday','08:00:00','08:45:00',45,1,1),(18,1,2,2,2,'Wednesday','09:00:00','09:45:00',45,1,1),(19,1,3,3,3,'Wednesday','10:00:00','10:45:00',45,1,1),(20,1,4,4,4,'Wednesday','11:00:00','11:45:00',45,1,1),(21,1,5,5,5,'Wednesday','12:00:00','12:45:00',30,0,1),(22,1,1,1,6,'Wednesday','13:00:00','13:45:00',30,0,1),(23,1,2,2,7,'Wednesday','14:00:00','14:45:00',30,0,1),(24,1,3,3,8,'Wednesday','15:00:00','15:45:00',30,0,1),(25,1,1,1,1,'Thursday','08:00:00','08:45:00',45,1,1),(26,1,2,2,2,'Thursday','09:00:00','09:45:00',45,1,1),(27,1,3,3,3,'Thursday','10:00:00','10:45:00',45,1,1),(28,1,4,4,4,'Thursday','11:00:00','11:45:00',45,1,1),(29,1,5,5,5,'Thursday','12:00:00','12:45:00',30,0,1),(30,1,1,1,6,'Thursday','13:00:00','13:45:00',30,0,1),(31,1,2,2,7,'Thursday','14:00:00','14:45:00',30,0,1),(32,1,3,3,8,'Thursday','15:00:00','15:45:00',30,0,1),(33,1,1,1,1,'Friday','08:00:00','08:45:00',45,1,1),(34,1,2,2,2,'Friday','09:00:00','09:45:00',45,1,1),(35,1,3,3,3,'Friday','10:00:00','10:45:00',45,1,1),(36,1,4,4,4,'Friday','11:00:00','11:45:00',45,1,1),(37,1,5,5,5,'Friday','12:00:00','12:45:00',30,0,1),(38,1,1,1,6,'Friday','13:00:00','13:45:00',30,0,1),(39,1,2,2,7,'Friday','14:00:00','14:45:00',30,0,1),(40,1,3,3,8,'Friday','15:00:00','15:45:00',30,0,1),(41,1,1,1,1,'Saturday','08:00:00','08:45:00',45,1,1),(42,1,2,2,2,'Saturday','09:00:00','09:45:00',45,1,1),(43,1,3,3,3,'Saturday','10:00:00','10:45:00',45,1,1),(44,1,4,4,4,'Saturday','11:00:00','11:45:00',45,1,1),(45,1,5,5,5,'Saturday','12:00:00','12:45:00',30,0,1),(46,1,1,1,6,'Saturday','13:00:00','13:45:00',30,0,1),(47,1,2,2,7,'Saturday','14:00:00','14:45:00',30,0,1),(48,1,3,3,8,'Saturday','15:00:00','15:45:00',30,0,1);
/*!40000 ALTER TABLE `periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `from_section_id` int DEFAULT NULL,
  `to_section_id` int DEFAULT NULL,
  `academic_year_id` int DEFAULT NULL,
  `status` enum('promoted','failed','detained') NOT NULL,
  `promoted_by` int DEFAULT NULL,
  `remarks` text,
  `promoted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `promotions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ptm_sessions`
--

DROP TABLE IF EXISTS `ptm_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ptm_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `academic_year_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `ptm_sessions_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ptm_sessions`
--

LOCK TABLES `ptm_sessions` WRITE;
/*!40000 ALTER TABLE `ptm_sessions` DISABLE KEYS */;
INSERT INTO `ptm_sessions` VALUES (1,1,'PTM Session 1','2025-11-05',1,2),(2,1,'PTM Session 2','2025-12-05',1,2);
/*!40000 ALTER TABLE `ptm_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ptm_slots`
--

DROP TABLE IF EXISTS `ptm_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ptm_slots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ptm_session_id` int NOT NULL,
  `teacher_id` int DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_booked` tinyint(1) DEFAULT '0',
  `booked_by_parent_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `remarks` text,
  `status` enum('available','booked','completed') DEFAULT 'available',
  PRIMARY KEY (`id`),
  KEY `ptm_session_id` (`ptm_session_id`),
  CONSTRAINT `ptm_slots_ibfk_1` FOREIGN KEY (`ptm_session_id`) REFERENCES `ptm_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ptm_slots`
--

LOCK TABLES `ptm_slots` WRITE;
/*!40000 ALTER TABLE `ptm_slots` DISABLE KEYS */;
INSERT INTO `ptm_slots` VALUES (1,1,1,'10:00:00','10:30:00',0,NULL,NULL,NULL,'available'),(2,1,1,'11:00:00','11:30:00',0,NULL,NULL,NULL,'available'),(3,1,1,'12:00:00','12:30:00',0,NULL,NULL,NULL,'available'),(4,1,1,'13:00:00','13:30:00',0,NULL,NULL,NULL,'available'),(5,2,1,'10:00:00','10:30:00',0,NULL,NULL,NULL,'available'),(6,2,1,'11:00:00','11:30:00',0,NULL,NULL,NULL,'available'),(7,2,1,'12:00:00','12:30:00',0,NULL,NULL,NULL,'available'),(8,2,1,'13:00:00','13:30:00',0,NULL,NULL,NULL,'available');
/*!40000 ALTER TABLE `ptm_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_cards`
--

DROP TABLE IF EXISTS `report_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `academic_year_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `total_marks` decimal(8,2) DEFAULT NULL,
  `obtained_marks` decimal(8,2) DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `grade` varchar(5) DEFAULT NULL,
  `rank` int DEFAULT NULL,
  `attendance_percent` decimal(5,2) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `report_cards_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_cards`
--

LOCK TABLES `report_cards` WRITE;
/*!40000 ALTER TABLE `report_cards` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schools`
--

DROP TABLE IF EXISTS `schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `address` text,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `website` varchar(150) DEFAULT NULL,
  `established_year` int DEFAULT NULL,
  `principal_name` varchar(150) DEFAULT NULL,
  `affiliation_board` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schools`
--

LOCK TABLES `schools` WRITE;
/*!40000 ALTER TABLE `schools` DISABLE KEYS */;
INSERT INTO `schools` VALUES (1,'Delhi Public School','DPS001','Sector 24, Rohini, New Delhi','011-27654321','info@dps.edu',NULL,'https://dps.edu',1985,'Dr. Anil Kumar','CBSE','2026-06-07 09:09:12');
/*!40000 ALTER TABLE `schools` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sections`
--

DROP TABLE IF EXISTS `sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `class_teacher_id` int DEFAULT NULL,
  `capacity` int DEFAULT '40',
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  KEY `class_teacher_id` (`class_teacher_id`),
  CONSTRAINT `sections_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sections_ibfk_2` FOREIGN KEY (`class_teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sections`
--

LOCK TABLES `sections` WRITE;
/*!40000 ALTER TABLE `sections` DISABLE KEYS */;
INSERT INTO `sections` VALUES (1,1,'A',3,40),(2,1,'B',4,40),(3,2,'A',NULL,40),(4,2,'B',NULL,40),(5,3,'A',NULL,40),(6,3,'B',NULL,40);
/*!40000 ALTER TABLE `sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `school_id` int DEFAULT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `employment_type` enum('full_time','part_time','contract') DEFAULT 'full_time',
  `joining_date` date DEFAULT NULL,
  `basic_salary` decimal(12,2) DEFAULT NULL,
  `bank_account` varchar(40) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `address` text,
  `emergency_contact` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `user_id` (`user_id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `staff_ibfk_2` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,9,1,'STF100','Finance','Officer','full_time','2021-01-01',40000.00,'12345678900','HDFC0001234','ABCDE1234F',NULL,NULL),(2,7,1,'STF101','Finance','Officer','full_time','2021-01-01',45000.00,'12345678901','HDFC0001234','ABCDE1234F',NULL,NULL),(3,8,1,'STF102','Finance','Officer','full_time','2021-01-01',50000.00,'12345678902','HDFC0001234','ABCDE1234F',NULL,NULL);
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_qr_codes`
--

DROP TABLE IF EXISTS `student_qr_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_qr_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `qr_token` varchar(120) DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `qr_token` (`qr_token`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `student_qr_codes_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_qr_codes`
--

LOCK TABLES `student_qr_codes` WRITE;
/*!40000 ALTER TABLE `student_qr_codes` DISABLE KEYS */;
INSERT INTO `student_qr_codes` VALUES (1,1,'STU-1-0595b5c9c4fa','2026-06-07 09:09:14',1),(2,2,'STU-2-ef7a3dbe4aaf','2026-06-07 09:09:14',1),(3,3,'STU-3-62825a53a9ab','2026-06-07 09:09:14',1),(4,4,'STU-4-23442e4fea2d','2026-06-07 09:09:14',1),(5,5,'STU-5-f9e7e0e3293b','2026-06-07 09:09:14',1),(6,6,'STU-6-d5dc6eb18750','2026-06-07 09:09:14',1),(7,7,'STU-7-ce7efe9fa42e','2026-06-07 09:09:15',1),(8,8,'STU-8-a1a7e28e0900','2026-06-07 09:09:15',1),(9,9,'STU-9-ed0966a3561c','2026-06-07 09:09:15',1),(10,10,'STU-10-52d1e2ac9aac','2026-06-07 09:09:15',1),(11,11,'STU-11-2984a83788c9','2026-06-07 09:09:15',1),(12,12,'STU-12-4dacbf7a8b6f','2026-06-07 09:09:15',1),(13,13,'STU-13-76f31d30fff6','2026-06-07 09:09:15',1),(14,14,'STU-14-fbd87a22857d','2026-06-07 09:09:16',1),(15,15,'STU-15-fb3a5a65dc49','2026-06-07 09:09:16',1),(16,16,'STU-16-47c3e12d4c65','2026-06-07 09:09:16',1),(17,17,'STU-17-faf050ff0289','2026-06-07 09:09:16',1),(18,18,'STU-18-468d95a89623','2026-06-07 09:09:16',1),(19,19,'STU-19-8b7fd5ab6b4f','2026-06-07 09:09:16',1),(20,20,'STU-20-bc20ec7205d0','2026-06-07 09:09:16',1),(21,21,'STU-21-1454bc53116f','2026-06-07 09:09:17',1),(22,22,'STU-22-fee498c42a7d','2026-06-07 09:09:17',1),(23,23,'STU-23-33162fd6895e','2026-06-07 09:09:17',1),(24,24,'STU-24-ee81dbcc1670','2026-06-07 09:09:17',1),(25,25,'STU-25-afd9f33165e6','2026-06-07 09:09:17',1),(26,26,'STU-26-835a8e858432','2026-06-07 09:09:17',1),(27,27,'STU-27-a373cc1d7922','2026-06-07 09:09:17',1),(28,28,'STU-28-c7d16c309232','2026-06-07 09:09:18',1),(29,29,'STU-29-51a0d95b34c1','2026-06-07 09:09:18',1),(30,30,'STU-30-f71a080ce084','2026-06-07 09:09:18',1),(31,31,'STU-31-1895bccbf969','2026-06-07 09:09:18',1),(32,32,'STU-32-7d72761f0f84','2026-06-07 09:09:18',1),(33,33,'STU-33-eb1876bdcf42','2026-06-07 09:09:18',1),(34,34,'STU-34-0a5c8c69d1da','2026-06-07 09:09:18',1),(35,35,'STU-35-e190be747663','2026-06-07 09:09:19',1),(36,36,'STU-36-7ade02086076','2026-06-07 09:09:19',1),(37,37,'STU-37-5739dae87b4b','2026-06-07 09:09:19',1),(38,38,'STU-38-5aae02487b49','2026-06-07 09:09:19',1),(39,39,'STU-39-f1019d39ba0d','2026-06-07 09:09:19',1),(40,40,'STU-40-7ac6b5b23014','2026-06-07 09:09:19',1),(41,41,'STU-41-31464d9e8dcb','2026-06-07 09:09:19',1),(42,42,'STU-42-885cd4e446ee','2026-06-07 09:09:20',1),(43,43,'STU-43-9b728c634cb9','2026-06-07 09:09:20',1),(44,44,'STU-44-ce52444a7ace','2026-06-07 09:09:20',1),(45,45,'STU-45-84d7f0489cfc','2026-06-07 09:09:20',1),(46,46,'STU-46-a01eedab3dbf','2026-06-07 09:09:20',1),(47,47,'STU-47-c26cbea68427','2026-06-07 09:09:20',1),(48,48,'STU-48-a82b1aa8c236','2026-06-07 09:09:20',1),(49,49,'STU-49-4575f9f7568a','2026-06-07 09:09:21',1),(50,50,'STU-50-a988ffc936fa','2026-06-07 09:09:21',1),(51,51,'STU-51-bf6fb170b353','2026-06-07 09:09:21',1),(52,52,'STU-52-c6f5e6209f77','2026-06-07 09:09:21',1),(53,53,'STU-53-203fa28dc06a','2026-06-07 09:09:21',1),(54,54,'STU-54-c5e08da52aec','2026-06-07 09:09:21',1),(55,55,'STU-55-727699f09fa5','2026-06-07 09:09:21',1),(56,56,'STU-56-efe5ec89e4eb','2026-06-07 09:09:22',1),(57,57,'STU-57-37a90c08044d','2026-06-07 09:09:22',1),(58,58,'STU-58-b535920564e7','2026-06-07 09:09:22',1),(59,59,'STU-59-be20679c2ad4','2026-06-07 09:09:22',1),(60,60,'STU-60-7b9184024e31','2026-06-07 09:09:22',1);
/*!40000 ALTER TABLE `student_qr_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_transport`
--

DROP TABLE IF EXISTS `student_transport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_transport` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `route_id` int DEFAULT NULL,
  `vehicle_id` int DEFAULT NULL,
  `pickup_stop` varchar(150) DEFAULT NULL,
  `drop_stop` varchar(150) DEFAULT NULL,
  `pickup_time` time DEFAULT NULL,
  `drop_time` time DEFAULT NULL,
  `monthly_fee` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `route_id` (`route_id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `student_transport_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_transport_ibfk_2` FOREIGN KEY (`route_id`) REFERENCES `transport_routes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_transport_ibfk_3` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_transport`
--

LOCK TABLES `student_transport` WRITE;
/*!40000 ALTER TABLE `student_transport` DISABLE KEYS */;
INSERT INTO `student_transport` VALUES (1,1,1,1,'Stop1','School',NULL,NULL,1500.00),(2,2,1,1,'Stop1','School',NULL,NULL,1500.00),(3,3,1,1,'Stop1','School',NULL,NULL,1500.00),(4,4,1,1,'Stop1','School',NULL,NULL,1500.00),(5,5,1,1,'Stop1','School',NULL,NULL,1500.00),(6,6,2,2,'Stop1','School',NULL,NULL,1500.00),(7,7,2,2,'Stop1','School',NULL,NULL,1500.00),(8,8,2,2,'Stop1','School',NULL,NULL,1500.00),(9,9,2,2,'Stop1','School',NULL,NULL,1500.00),(10,10,2,2,'Stop1','School',NULL,NULL,1500.00);
/*!40000 ALTER TABLE `student_transport` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `admission_number` varchar(50) DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `roll_number` varchar(20) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `address` text,
  `father_name` varchar(150) DEFAULT NULL,
  `mother_name` varchar(150) DEFAULT NULL,
  `guardian_phone` varchar(30) DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  `academic_year_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `school_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admission_number` (`admission_number`),
  KEY `user_id` (`user_id`),
  KEY `section_id` (`section_id`),
  KEY `academic_year_id` (`academic_year_id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_3` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_4` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,5,'ADM2001',1,'1','2008-01-15','female','A+',NULL,'Singh (Father)','Iyer (Mother)','9847874151','2025-04-01',1,1,1),(2,18,'ADM2002',1,'2','2008-02-15','female','B+',NULL,'Patel (Father)','Sharma (Mother)','9157987592','2025-04-01',1,1,1),(3,20,'ADM2003',1,'3','2008-03-15','male','O+',NULL,'Nair (Father)','Reddy (Mother)','9882369323','2025-04-01',1,1,1),(4,22,'ADM2004',1,'4','2008-04-15','female','AB+',NULL,'Gupta (Father)','Kumar (Mother)','9608554084','2025-04-01',1,1,1),(5,24,'ADM2005',1,'5','2008-05-15','female','A+',NULL,'Gupta (Father)','Iyer (Mother)','9144277540','2025-04-01',1,1,1),(6,26,'ADM2006',1,'6','2008-06-15','male','AB+',NULL,'Iyer (Father)','Patel (Mother)','9782936067','2025-04-01',1,1,1),(7,28,'ADM2007',1,'7','2008-07-15','female','A+',NULL,'Iyer (Father)','Das (Mother)','9641832580','2025-04-01',1,1,1),(8,30,'ADM2008',1,'8','2008-08-15','male','A+',NULL,'Das (Father)','Iyer (Mother)','9580732267','2025-04-01',1,1,1),(9,32,'ADM2009',1,'9','2008-09-15','female','B+',NULL,'Verma (Father)','Verma (Mother)','9433700315','2025-04-01',1,1,1),(10,34,'ADM2010',1,'10','2008-01-15','male','O+',NULL,'Sharma (Father)','Das (Mother)','9599892560','2025-04-01',1,1,1),(11,36,'ADM2011',2,'1','2008-01-15','female','B+',NULL,'Reddy (Father)','Nair (Mother)','9188976712','2025-04-01',1,1,1),(12,38,'ADM2012',2,'2','2008-02-15','female','AB+',NULL,'Reddy (Father)','Patel (Mother)','9618131827','2025-04-01',1,1,1),(13,40,'ADM2013',2,'3','2008-03-15','female','B+',NULL,'Kumar (Father)','Kumar (Mother)','9440937030','2025-04-01',1,1,1),(14,42,'ADM2014',2,'4','2008-04-15','female','AB+',NULL,'Patel (Father)','Kumar (Mother)','9701148843','2025-04-01',1,1,1),(15,44,'ADM2015',2,'5','2008-05-15','male','AB+',NULL,'Verma (Father)','Singh (Mother)','9875172531','2025-04-01',1,1,1),(16,46,'ADM2016',2,'6','2008-06-15','female','B+',NULL,'Singh (Father)','Das (Mother)','9848020822','2025-04-01',1,1,1),(17,48,'ADM2017',2,'7','2008-07-15','female','B+',NULL,'Kumar (Father)','Iyer (Mother)','9878077227','2025-04-01',1,1,1),(18,50,'ADM2018',2,'8','2008-08-15','female','O+',NULL,'Nair (Father)','Das (Mother)','9813025411','2025-04-01',1,1,1),(19,52,'ADM2019',2,'9','2008-09-15','female','A+',NULL,'Iyer (Father)','Singh (Mother)','9281561164','2025-04-01',1,1,1),(20,54,'ADM2020',2,'10','2008-01-15','female','A+',NULL,'Iyer (Father)','Singh (Mother)','9568725484','2025-04-01',1,1,1),(21,56,'ADM2021',3,'1','2008-01-15','male','AB+',NULL,'Das (Father)','Verma (Mother)','9533206973','2025-04-01',1,1,1),(22,58,'ADM2022',3,'2','2008-02-15','female','AB+',NULL,'Verma (Father)','Sharma (Mother)','9659589878','2025-04-01',1,1,1),(23,60,'ADM2023',3,'3','2008-03-15','female','AB+',NULL,'Gupta (Father)','Iyer (Mother)','9328212515','2025-04-01',1,1,1),(24,62,'ADM2024',3,'4','2008-04-15','female','A+',NULL,'Kumar (Father)','Sharma (Mother)','9176507372','2025-04-01',1,1,1),(25,64,'ADM2025',3,'5','2008-05-15','female','B+',NULL,'Nair (Father)','Das (Mother)','9330536555','2025-04-01',1,1,1),(26,66,'ADM2026',3,'6','2008-06-15','male','B+',NULL,'Reddy (Father)','Sharma (Mother)','9227084628','2025-04-01',1,1,1),(27,68,'ADM2027',3,'7','2008-07-15','male','A+',NULL,'Nair (Father)','Reddy (Mother)','9647114268','2025-04-01',1,1,1),(28,70,'ADM2028',3,'8','2008-08-15','male','B+',NULL,'Sharma (Father)','Singh (Mother)','9884712062','2025-04-01',1,1,1),(29,72,'ADM2029',3,'9','2008-09-15','male','B+',NULL,'Sharma (Father)','Patel (Mother)','9122480617','2025-04-01',1,1,1),(30,74,'ADM2030',3,'10','2008-01-15','male','O+',NULL,'Verma (Father)','Singh (Mother)','9552418935','2025-04-01',1,1,1),(31,76,'ADM2031',4,'1','2008-01-15','female','A+',NULL,'Gupta (Father)','Singh (Mother)','9937625097','2025-04-01',1,1,1),(32,78,'ADM2032',4,'2','2008-02-15','male','AB+',NULL,'Gupta (Father)','Kumar (Mother)','9579078118','2025-04-01',1,1,1),(33,80,'ADM2033',4,'3','2008-03-15','female','A+',NULL,'Kumar (Father)','Das (Mother)','9469145237','2025-04-01',1,1,1),(34,82,'ADM2034',4,'4','2008-04-15','female','AB+',NULL,'Patel (Father)','Gupta (Mother)','9965642323','2025-04-01',1,1,1),(35,84,'ADM2035',4,'5','2008-05-15','male','A+',NULL,'Sharma (Father)','Patel (Mother)','9590858413','2025-04-01',1,1,1),(36,86,'ADM2036',4,'6','2008-06-15','female','B+',NULL,'Verma (Father)','Verma (Mother)','9311082034','2025-04-01',1,1,1),(37,88,'ADM2037',4,'7','2008-07-15','female','AB+',NULL,'Gupta (Father)','Reddy (Mother)','9220000095','2025-04-01',1,1,1),(38,90,'ADM2038',4,'8','2008-08-15','male','B+',NULL,'Iyer (Father)','Nair (Mother)','9975328388','2025-04-01',1,1,1),(39,92,'ADM2039',4,'9','2008-09-15','male','AB+',NULL,'Verma (Father)','Singh (Mother)','9733024910','2025-04-01',1,1,1),(40,94,'ADM2040',4,'10','2008-01-15','male','AB+',NULL,'Nair (Father)','Singh (Mother)','9559748878','2025-04-01',1,1,1),(41,96,'ADM2041',5,'1','2008-01-15','male','B+',NULL,'Kumar (Father)','Das (Mother)','9423622226','2025-04-01',1,1,1),(42,98,'ADM2042',5,'2','2008-02-15','male','O+',NULL,'Kumar (Father)','Singh (Mother)','9980167845','2025-04-01',1,1,1),(43,100,'ADM2043',5,'3','2008-03-15','male','O+',NULL,'Reddy (Father)','Gupta (Mother)','9805698135','2025-04-01',1,1,1),(44,102,'ADM2044',5,'4','2008-04-15','male','B+',NULL,'Das (Father)','Singh (Mother)','9346960629','2025-04-01',1,1,1),(45,104,'ADM2045',5,'5','2008-05-15','female','B+',NULL,'Kumar (Father)','Kumar (Mother)','9264967035','2025-04-01',1,1,1),(46,106,'ADM2046',5,'6','2008-06-15','male','A+',NULL,'Reddy (Father)','Sharma (Mother)','9695932239','2025-04-01',1,1,1),(47,108,'ADM2047',5,'7','2008-07-15','female','AB+',NULL,'Sharma (Father)','Singh (Mother)','9489126743','2025-04-01',1,1,1),(48,110,'ADM2048',5,'8','2008-08-15','female','A+',NULL,'Reddy (Father)','Nair (Mother)','9576455688','2025-04-01',1,1,1),(49,112,'ADM2049',5,'9','2008-09-15','male','A+',NULL,'Das (Father)','Iyer (Mother)','9982089275','2025-04-01',1,1,1),(50,114,'ADM2050',5,'10','2008-01-15','male','O+',NULL,'Iyer (Father)','Nair (Mother)','9944715872','2025-04-01',1,1,1),(51,116,'ADM2051',6,'1','2008-01-15','male','B+',NULL,'Nair (Father)','Iyer (Mother)','9596650117','2025-04-01',1,1,1),(52,118,'ADM2052',6,'2','2008-02-15','female','A+',NULL,'Das (Father)','Reddy (Mother)','9532737639','2025-04-01',1,1,1),(53,120,'ADM2053',6,'3','2008-03-15','female','A+',NULL,'Reddy (Father)','Verma (Mother)','9473337727','2025-04-01',1,1,1),(54,122,'ADM2054',6,'4','2008-04-15','male','AB+',NULL,'Nair (Father)','Sharma (Mother)','9712430615','2025-04-01',1,1,1),(55,124,'ADM2055',6,'5','2008-05-15','male','AB+',NULL,'Verma (Father)','Reddy (Mother)','9781765634','2025-04-01',1,1,1),(56,126,'ADM2056',6,'6','2008-06-15','male','A+',NULL,'Singh (Father)','Iyer (Mother)','9913512951','2025-04-01',1,1,1),(57,128,'ADM2057',6,'7','2008-07-15','male','AB+',NULL,'Patel (Father)','Nair (Mother)','9156109145','2025-04-01',1,1,1),(58,130,'ADM2058',6,'8','2008-08-15','female','B+',NULL,'Sharma (Father)','Nair (Mother)','9854648529','2025-04-01',1,1,1),(59,132,'ADM2059',6,'9','2008-09-15','female','B+',NULL,'Sharma (Father)','Das (Mother)','9783823849','2025-04-01',1,1,1),(60,134,'ADM2060',6,'10','2008-01-15','male','A+',NULL,'Das (Father)','Iyer (Mother)','9798142521','2025-04-01',1,1,1);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(30) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subjects_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,'English Literature','ENG10',1,3),(2,'Mathematics','MAT1',1,4),(3,'Science','SCI1',1,15),(4,'Social Studies','SOC1',1,16),(5,'Computer Science','COM1',1,17),(6,'English','ENG2',2,NULL),(7,'Mathematics','MAT2',2,NULL),(8,'Science','SCI2',2,NULL),(9,'Social Studies','SOC2',2,NULL),(10,'Computer Science','COM2',2,4),(11,'English','ENG3',3,NULL),(12,'Mathematics','MAT3',3,NULL),(13,'Science','SCI3',3,NULL),(14,'Social Studies','SOC3',3,NULL),(15,'Computer Science','COM3',3,NULL);
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_assignments`
--

DROP TABLE IF EXISTS `teacher_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `section_id` int NOT NULL,
  `subject_id` int DEFAULT NULL,
  `role` enum('class_teacher','subject_teacher') NOT NULL,
  `academic_year_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `section_id` (`section_id`),
  KEY `subject_id` (`subject_id`),
  KEY `academic_year_id` (`academic_year_id`),
  CONSTRAINT `teacher_assignments_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_assignments_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_assignments_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `teacher_assignments_ibfk_4` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_assignments`
--

LOCK TABLES `teacher_assignments` WRITE;
/*!40000 ALTER TABLE `teacher_assignments` DISABLE KEYS */;
INSERT INTO `teacher_assignments` VALUES (1,1,1,NULL,'class_teacher',1),(2,1,1,1,'subject_teacher',1),(3,2,1,2,'subject_teacher',1),(4,3,1,3,'subject_teacher',1),(5,4,1,4,'subject_teacher',1),(6,5,1,5,'subject_teacher',1),(7,2,2,NULL,'class_teacher',1),(8,1,2,1,'subject_teacher',1),(9,2,2,2,'subject_teacher',1),(10,3,2,3,'subject_teacher',1),(11,4,2,4,'subject_teacher',1),(12,5,2,5,'subject_teacher',1),(13,1,1,1,'subject_teacher',NULL);
/*!40000 ALTER TABLE `teacher_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_attendance`
--

DROP TABLE IF EXISTS `teacher_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late','half_day') NOT NULL,
  `marked_by` int DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `teacher_attendance_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_attendance`
--

LOCK TABLES `teacher_attendance` WRITE;
/*!40000 ALTER TABLE `teacher_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacher_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `qualification` varchar(200) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `salary` decimal(12,2) DEFAULT NULL,
  `address` text,
  `emergency_contact` varchar(30) DEFAULT NULL,
  `school_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `user_id` (`user_id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teachers_ibfk_2` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,3,'EMP1000','M.A B.Ed','2020-06-01','Computer','Senior Teacher',45000.00,NULL,NULL,1),(2,4,'EMP1001','M.Tech','2020-06-01','Computer','Senior Teacher',48000.00,NULL,NULL,1),(3,15,'EMP1002','M.Tech','2020-06-01','Science','Senior Teacher',51000.00,NULL,NULL,1),(4,16,'EMP1003','Ph.D','2020-06-01','Mathematics','Senior Teacher',54000.00,NULL,NULL,1),(5,17,'EMP1004','M.Sc B.Ed','2020-06-01','Mathematics','Senior Teacher',57000.00,NULL,NULL,1);
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transport_routes`
--

DROP TABLE IF EXISTS `transport_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_routes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `route_name` varchar(150) DEFAULT NULL,
  `start_point` varchar(150) DEFAULT NULL,
  `end_point` varchar(150) DEFAULT NULL,
  `stops` text,
  `distance_km` decimal(8,2) DEFAULT NULL,
  `monthly_charge` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `transport_routes_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transport_routes`
--

LOCK TABLES `transport_routes` WRITE;
/*!40000 ALTER TABLE `transport_routes` DISABLE KEYS */;
INSERT INTO `transport_routes` VALUES (1,1,'Route A - North','Rohini','School','Stop1, Stop2, Stop3',12.00,1500.00),(2,1,'Route B - South','Dwarka','School','Stop1, Stop2, Stop3',12.00,1800.00);
/*!40000 ALTER TABLE `transport_routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','teacher','student','parent','accountant','librarian','transport_manager','hostel_warden','hr_manager','security_guard','canteen_manager','health_officer') NOT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `two_factor_enabled` tinyint(1) DEFAULT '0',
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_school` (`school_id`),
  KEY `idx_users_role` (`role`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'Super Admin','superadmin@school.com','9155316797','$2a$10$dD8mZmjv.v9odCJ3tozg4OPllxYRbS9v25T9vSeuprkEs2RG5yiu2','super_admin',NULL,1,0,NULL,'2026-06-07 14:44:09','2026-06-07 09:09:12','2026-06-07 09:14:09'),(2,1,'School Admin','admin@school.com','9558603655','$2a$10$6lB1y2.YxNdxh/aeu4QdnOzGsXGkXfVI8G8LFR/wx.8vBCjZkcwN.','admin',NULL,1,0,NULL,'2026-06-07 18:19:36','2026-06-07 09:09:13','2026-06-07 12:49:36'),(3,1,'Rajesh Sharma','teacher@school.com','9870690417','$2a$10$0pLdp6HnEb1yhzhdF5MmOeVSqGmNmFH4Yp6tu4tK.QOmk6pSVrHXa','teacher',NULL,1,0,NULL,'2026-06-07 15:18:02','2026-06-07 09:09:13','2026-06-07 09:48:02'),(4,1,'Priya Verma','teacher2@school.com','9689581941','$2a$10$Eq/LEeUhuq5j5hFquvf88uksKdlyo7FU2fOfwOIBR1QItDAMFfAEe','teacher',NULL,1,0,NULL,NULL,'2026-06-07 09:09:13','2026-06-07 09:09:13'),(5,1,'Aarav Student','student@school.com','9439057302','$2a$10$bErtnXj1HPEstfJ6isBhoOmkCNOY7X.2iUlXrXSQuoYce/xdn.eF2','student',NULL,1,0,NULL,'2026-06-07 18:11:54','2026-06-07 09:09:13','2026-06-07 12:41:54'),(6,1,'Parent Kumar','parent@school.com','9937743906','$2a$10$BvhFogkaNdNZydV7Tvq0s.Mvsi6.VyIWAEb0dYBb6AP9llMmHCINK','parent',NULL,1,0,NULL,'2026-06-07 18:16:10','2026-06-07 09:09:13','2026-06-07 12:46:10'),(7,1,'Sunil Accountant','accountant@school.com','9486729786','$2a$10$3gO4KQfXJKQvlbpCYHiOHeD5gw9iXxlJnkES/LJT.j/A6yiSdL57a','accountant',NULL,1,0,NULL,NULL,'2026-06-07 09:09:13','2026-06-07 09:09:13'),(8,1,'Meera Librarian','librarian@school.com','9344675587','$2a$10$XmhzVDkyuKsy5kFOAPgA1urMtae9LdeTRWokmiug56XloiB4MY73e','librarian',NULL,1,0,NULL,NULL,'2026-06-07 09:09:13','2026-06-07 09:09:13'),(9,1,'Vikram HR','hr@school.com','9879264325','$2a$10$Gzqdc.4gw.O4QXDI0cIHtOz7cYQU6w6p4USTn8lGta3Imu0xNWFCy','hr_manager',NULL,1,0,NULL,'2026-06-07 18:18:04','2026-06-07 09:09:13','2026-06-07 12:48:04'),(10,1,'Warden Singh','warden@school.com','9279192125','$2a$10$Rz9lw2.efj1UKxvmPO1PjuuSPYqxnXxEd74AzZ/rTBxOqWZCEiqyK','hostel_warden',NULL,1,0,NULL,NULL,'2026-06-07 09:09:13','2026-06-07 09:09:13'),(11,1,'Transport Head','transport@school.com','9580622930','$2a$10$i8/OjrDjBMo2SjsH4M4TG.nmgdlpDjaNvFYwUiKMcOun5FM5lp/eq','transport_manager',NULL,1,0,NULL,NULL,'2026-06-07 09:09:13','2026-06-07 09:09:13'),(12,1,'Dr. Health','health@school.com','9151060323','$2a$10$HpkkC3sLXXD0H9zzENHz6ulCKc/3L0Xyitx4XtXcAG37gFCCeG3VO','health_officer',NULL,1,0,NULL,NULL,'2026-06-07 09:09:13','2026-06-07 09:09:13'),(13,1,'Guard Ram','security@school.com','9860005572','$2a$10$Uvl6w342w.PVtx4bXbSZ1eMvBOdFYoIHr2y/MOGXxlcYhNv3yc1dK','security_guard',NULL,1,0,NULL,'2026-06-07 18:16:50','2026-06-07 09:09:13','2026-06-07 12:46:50'),(14,1,'Canteen Boss','canteen@school.com','9157436370','$2a$10$WSrDUEItAcpLX3a3PhTUI.Y4BVazKE0zFDetTEI8o8HH41mQWgER2','canteen_manager',NULL,1,0,NULL,NULL,'2026-06-07 09:09:13','2026-06-07 09:09:13'),(15,1,'Anita Desai','anita.t@school.com','9936643877','$2a$10$c4GESDWJlJEmHQ4.1UtUceYvIDNc1nhEEesZfP/n2Lovl8Jj6Zpqm','teacher',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(16,1,'Mohan Lal','mohan.t@school.com','9920071895','$2a$10$W4.V5UQ4tyHxjKPuMlj2U.nG9kxBZ3.AtHGtzAnyjLImVxUGsdTKe','teacher',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(17,1,'Geeta Rao','geeta.t@school.com','9665466591','$2a$10$E2AnocVPl.F0rbDF3/QjMuN0zpIC6kLy07DVbi5DghFNHLksFKYJG','teacher',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(18,1,'Aarav Kumar','student2@school.com','9949517457','$2a$10$Aj341O8PY2Hb6A3UzE8bqerDirX0lZuD7RS.9PmbeMSaSO4wavelK','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(19,1,'Parent of 2','parent2@school.com','9780555374','$2a$10$AroFSKZhglS/pNw2OdJDRubGWyHhuJNNQC1TJdU0VKutyKm/0vvmS','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(20,1,'Ayaan Iyer','student3@school.com','9187978133','$2a$10$aJp9GFakV624KceGP2u2vOZBAwkCLOHYQhCY39b3lW.sRav/u0c0i','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(21,1,'Parent of 3','parent3@school.com','9709029434','$2a$10$n4cGSeAXfj0Vo.QpKHV2wumX98Yrnq9R8vRqvfhANgzZuzLPmW0G6','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(22,1,'Pari Kumar','student4@school.com','9854955479','$2a$10$yYpbCKd0jWu7WMVRiB6jfu2WiwbxLwoz6I5BK0suCRh8esvojNPaC','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(23,1,'Parent of 4','parent4@school.com','9312410018','$2a$10$N7wDeCOwYqBRuS1v.CigxO9V/XtDgm5NoZWXewdVsq.TMTLJmNZEi','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(24,1,'Myra Gupta','student5@school.com','9730149578','$2a$10$l36plo/GOgZ69UAaKTKux./SozeSDNzZvRfOQ.6Ft3CXppOIqetuy','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(25,1,'Parent of 5','parent5@school.com','9873147717','$2a$10$pCBn1sCHOBf.GC5UWY814OcIUsF8NA2Flz2Fiv3jAHWqndbXIw3aK','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(26,1,'Saanvi Kumar','student6@school.com','9843585713','$2a$10$vg2spxm9NBjjqSzBahmM8OHtNw4.0byuhYjaqZAfK7byEiMjufvYu','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(27,1,'Parent of 6','parent6@school.com','9417062854','$2a$10$UvoSSLLc9IAK9qrG2Uopnefrr.zUblv1Ybr5/LWacT6MPsdFgD8FS','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:14','2026-06-07 09:09:14'),(28,1,'Aadhya Kumar','student7@school.com','9891244171','$2a$10$0wvdGySphXw8iwlm47X.Pe9dWqeaQOHs3XBtEYMEOdtqLEWFqs1uy','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(29,1,'Parent of 7','parent7@school.com','9401207055','$2a$10$s6QkIjPFc4rqaGdi4MgPSeM7LTeW/52DFOMRgrE0afh2WtrqaevKG','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(30,1,'Riya Verma','student8@school.com','9367607934','$2a$10$7zYzv2wsSYckYQKIS1nvP.xbNMrzPJkADDabJvCocQYPIwBZrtDda','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(31,1,'Parent of 8','parent8@school.com','9124001953','$2a$10$CZh8zoUVZfeCIh607UKx.urnNJWqSL4c.QoR4j.fP9pmtXrW4FUtS','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(32,1,'Arjun Patel','student9@school.com','9503606984','$2a$10$US8akmuhbeCi5eGi/61KOOXyv9hlcX.C0iPKlZq3/IUshW1ptOPVG','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(33,1,'Parent of 9','parent9@school.com','9776190419','$2a$10$MTZCRntbfHpF24ctgMNc0OdLlCBb6.q7Tv/0rdH2ySYblveMJ.gbu','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(34,1,'Anika Patel','student10@school.com','9573951134','$2a$10$25tK8.zuqi7yTLeGwO5lKekL.WBl0BDFjdVxn8uwSouerJAmpg2ca','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(35,1,'Parent of 10','parent10@school.com','9614138374','$2a$10$2yu4zdZIFiutBQqpbYuUUORHaIvEcn4kPMWiZBmmKHY4k5PBYxMae','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(36,1,'Aditya Gupta','student11@school.com','9202819909','$2a$10$GwSGMm2VUvZA88P08AHDSeCaOkAKfpICYZXCUx1jj3VJLZvCHbHbm','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(37,1,'Parent of 11','parent11@school.com','9268922150','$2a$10$TfNhcnoLCei.fDAnGiYtsOcYzwR6Bue9VayGcmcykmtrCa.GHB7YC','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(38,1,'Vihaan Patel','student12@school.com','9199237518','$2a$10$lViay1sFTKMKzolVxQ4hLuFpadU9JBT4BePr2MnOH3i5S1iYiQ3By','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(39,1,'Parent of 12','parent12@school.com','9726195136','$2a$10$GqHwfyOIhzgIkQW8bdz9H.tP3EZrhx.zSNh.Mcw2XKbIJUsZQI3s.','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(40,1,'Aarav Nair','student13@school.com','9359973382','$2a$10$EFb4wdPUSj9mnsGquc1H4ObLUHiHWFbGs.KY16dqxcI0zB8A4Piyy','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(41,1,'Parent of 13','parent13@school.com','9851804609','$2a$10$Kwu6TdZl/WfkzNU1aMKjo.rlTOUxVDJfGDUMVusJY48C7FZOw5V1G','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:15','2026-06-07 09:09:15'),(42,1,'Ayaan Patel','student14@school.com','9109069403','$2a$10$46bFhVOZs/cWEwTgNPPf.OYXKXPePPjBA11yUTOoE12rfXoPTxgb6','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(43,1,'Parent of 14','parent14@school.com','9346856841','$2a$10$Vdn6P1qFq/WOdvW8T8MOa.SugVukmnCB46JNq8JYa/RCRem/Qam42','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(44,1,'Pari Kumar','student15@school.com','9245057397','$2a$10$w7l/WXlFeUU.uI3Vicf3ZuaXDj5mdVuICrG7lpM0qhcLxMCbcG.Q2','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(45,1,'Parent of 15','parent15@school.com','9904607813','$2a$10$YKx968uJ6ejDqCM3j8lfqOTqQzLFbvYFL2I45hcsx2Lb.5EF7mUD.','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(46,1,'Riya Patel','student16@school.com','9317227536','$2a$10$zCSLzCv75qhm0nISeCGGWOCO0oU2RgwxnTmS7I4uoGovGBwmQdrBe','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(47,1,'Parent of 16','parent16@school.com','9479692040','$2a$10$Kfj.qJPfbKsXBYhjwf1/Ee.SF8RJGs1s1JjC3Fn98Qz5lSBLveFeO','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(48,1,'Ishaan Kumar','student17@school.com','9886577301','$2a$10$nEimDPz/6CDrELI4nmvSauMVHSqIyhmZrLQzBk48xwvZ9KfgclVMy','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(49,1,'Parent of 17','parent17@school.com','9279564579','$2a$10$dhN2PXDXkjIImSNCyZ1QYuMhoxQUZ7njLMf3R61RCU.rvE8AgakYq','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(50,1,'Reyansh Iyer','student18@school.com','9460738216','$2a$10$Uo60F0kOL9zlMyTwI8UA2e9wU5GnGQs9LG2gj0hn3cWAF/7dTbY06','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(51,1,'Parent of 18','parent18@school.com','9633190819','$2a$10$DY2rRuMDeBBCXRaK82oiG.Bpc18FktQiznsdv6Sfd80whGAwuGl3S','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(52,1,'Myra Gupta','student19@school.com','9844888114','$2a$10$I2OXSBN1HOUJFTggSd1Tz.DPwe0C3c2LosDqRjU/RNxliaTdmXZUW','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(53,1,'Parent of 19','parent19@school.com','9568263901','$2a$10$.AYJhl.baF93GBlN1HbS4uax3jgZxPyPDxsJVpknNG7dhYn1NpJg6','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(54,1,'Pari Verma','student20@school.com','9743639628','$2a$10$wQ8Txe5Cz94QliJJ67DHqOYfzbSl9laqxV0sg3GtUr0mxb9eumlfW','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(55,1,'Parent of 20','parent20@school.com','9771509841','$2a$10$vtXinv7nfTM3lRwiwgbV1.8/cLaWfiuW3jtmkHEkRWHkaEu9o4ikK','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:16','2026-06-07 09:09:16'),(56,1,'Ananya Reddy','student21@school.com','9402315570','$2a$10$Bzvt3KY5lt/8vr3/SPe5he1p7vNx4aiLbBDcq.7nbK5.BAUzHm5Yi','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(57,1,'Parent of 21','parent21@school.com','9819421522','$2a$10$sD5n9sTLdMAw/TrlOSZM4ukGF4vh1U6KowTfv2Ity7A7Ndoi.l4s6','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(58,1,'Sai Gupta','student22@school.com','9141556266','$2a$10$HlTij9cgBGBLDkJDqrbK5uoHjnfnrJomGkZVErlmzXFzoSBZKpO4i','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(59,1,'Parent of 22','parent22@school.com','9674992356','$2a$10$vWeiCr.ycF9CqIFUkymLDeCEwPyxmXhHNv6H3Vb5L9v3x5KwCiI7q','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(60,1,'Arjun Patel','student23@school.com','9709871892','$2a$10$RWZpgTNZKFEspj0tUnPOXOBOEKyTOAmE.43A3XGB/oEgmpQ6gCT7q','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(61,1,'Parent of 23','parent23@school.com','9216107863','$2a$10$faIoH4hWdlEZUoL5KByy5u/gmqkKNTH./AHdN7nTm2ySphu3Kkn66','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(62,1,'Ayaan Reddy','student24@school.com','9997197974','$2a$10$LfCl.WILmI4V/Um6tvWUhu8qkBb16OcwOBE.A1KgN1UbnjZ2Boga6','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(63,1,'Parent of 24','parent24@school.com','9648689788','$2a$10$B3Tn6lz3i.JAd8ndsXKhh.dBWFtZ31e1jMShiFDOK6fJ.W/NJKNKO','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(64,1,'Aditya Kumar','student25@school.com','9238416625','$2a$10$aj69oEm6k0LnoQANCweBuu5awMie0lHIst.faFfaGV/OV/x/8.8HC','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(65,1,'Parent of 25','parent25@school.com','9543873492','$2a$10$OSiRzjkb3Hx9ccKg3/KlGuTo7DYo//Hu61xj9Ugn4JHo1QUZqESd6','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(66,1,'Arjun Verma','student26@school.com','9743129948','$2a$10$0Nafr1QTl/3n.yh8KG701uPsWk3wrdcEBfh5aMVTdxF0iz5D7zEgW','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(67,1,'Parent of 26','parent26@school.com','9519774538','$2a$10$PX3d80RfGaeOUJDot3gAvupX1ZgWR8QQS9RP5NH3Z2.5MxjTd0vne','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(68,1,'Anika Nair','student27@school.com','9436843645','$2a$10$mbSzPC15sbGiF3mHObV3ZONlsXdbFqbLBFbXhcvL5vSXCI5Z2weB2','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(69,1,'Parent of 27','parent27@school.com','9697345811','$2a$10$B11AxsNi/z10VSrx/tpIMOLEQMYorB4ST79BTOixzZc.l3PlmhiSm','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:17','2026-06-07 09:09:17'),(70,1,'Anika Nair','student28@school.com','9286241892','$2a$10$LOA1p6Go91rHQ/k.w1QoROHRLN0OaVnte2r9apmcaVpfi/0se6tiq','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(71,1,'Parent of 28','parent28@school.com','9678971674','$2a$10$Gx3dJoTQnL8NGtDCZglsGuGX0wSRcl6Tr3sY6w4aN1EDjQK29dFyS','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(72,1,'Ananya Verma','student29@school.com','9403466289','$2a$10$FOqf.YOzfIXy5FCNLp9OqerjxEQ7kLH3fDqR4v7T3nkZmFnuqgfxW','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(73,1,'Parent of 29','parent29@school.com','9911844739','$2a$10$khrcgDy3lvEnR.tEVg5MmOj8nzOB0ZkCIpTioZoC2HmTo08SfTUvG','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(74,1,'Aadhya Kumar','student30@school.com','9698414504','$2a$10$z7rBfaLujzGHHniMMF8EweaKv6JGjJsxTebLqaX0Mho8lGNxu4aiG','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(75,1,'Parent of 30','parent30@school.com','9982791565','$2a$10$2.mBjpMYm1IPQUhdG4B7/.sw1zpyf3dSip7dM8hpkOtEZ85XHRdl6','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(76,1,'Aarav Nair','student31@school.com','9373852357','$2a$10$V8vTTSB8VEePaJL9jdXKVus3KPomJsiS8OU/124.2KiWiku6QPdFi','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(77,1,'Parent of 31','parent31@school.com','9698865510','$2a$10$1Jx462TGalVpTCqHmTMIg.RLfSaDiku52MgS.5T7RCaGdIT0Kdri.','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(78,1,'Aadhya Reddy','student32@school.com','9140922164','$2a$10$3X43kjtVkmNFmvlValu.IOg7Qkq/PBujWTHEqyPdthN10HkjmyXwy','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(79,1,'Parent of 32','parent32@school.com','9406319818','$2a$10$OU2u5isisos2Rbr/.VlIsu39Ykx9UlcKXJjJPBrQBcZiOI6Fd5r5i','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(80,1,'Diya Patel','student33@school.com','9803949811','$2a$10$fBCTXLrWrvI88.9XkYW9fu93r/CP0YDa8meLEQgVt9f9rF9lW/gwe','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(81,1,'Parent of 33','parent33@school.com','9394149793','$2a$10$uf/V/T0tQ0lNs8pNdF86Zu875fD6IuKTn9F7OdfE0pRU8EvGU15EG','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(82,1,'Pari Iyer','student34@school.com','9424671875','$2a$10$wxo8ZTdZdgMW7Dtp6Z91IOGHgbXSFHqmvkisGe3LxxX90yziXED02','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(83,1,'Parent of 34','parent34@school.com','9436151446','$2a$10$mLkwoTR0EdT75hGqzreYDuZBS2skq9e09DWdqSe2kzcCcbLUgqO/K','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:18','2026-06-07 09:09:18'),(84,1,'Sara Nair','student35@school.com','9835854013','$2a$10$u3CcU/BkoPmuN3a25TuyDeLoZ/YT7/kt8khsAZVohUUTFSH29QkWG','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(85,1,'Parent of 35','parent35@school.com','9342577085','$2a$10$YZd0iwHAYmXdXBvb4XXghu0p78GaVOCedLDmWr5w.v7czJrG3fXJy','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(86,1,'Anika Nair','student36@school.com','9845473091','$2a$10$6Xx/ysde6FB.5lK5VUc0N.oVb/Q/g6ort7esHUAne0M64IvVPa9Ka','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(87,1,'Parent of 36','parent36@school.com','9859413712','$2a$10$JJ73XbmBtlHayJfpGBaxv.X8xTS03ErNAzM.BUl3DSDT8XBAzdzMW','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(88,1,'Pari Verma','student37@school.com','9421735318','$2a$10$EHk8DEB614Yg5n1sE0xsy.H0ussCa4cBpjKUv4rrrZvdW/MxEkMzC','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(89,1,'Parent of 37','parent37@school.com','9700619133','$2a$10$TDdzO4PROrZ.fKBmgFLvZ.aSl79YmQf1lj/Y6i3jbVgKyzVJauGti','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(90,1,'Vihaan Patel','student38@school.com','9212382487','$2a$10$FaVeqoqZ0O1Nc7shTNiW5es1WVM1XDm9tQc7AmRUUifbKyyBiuI1.','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(91,1,'Parent of 38','parent38@school.com','9787266271','$2a$10$nifstlzUNrpcL5M9Y5FwmumXFSTDGcSNwgL6Z1f2bQZiSjdUSMgrm','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(92,1,'Ishaan Sharma','student39@school.com','9115124704','$2a$10$wPhq7gcuyFpn33BzLYiJpeLAr4h9ypfy7QtE1FkIDWJJkEvgXuixe','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(93,1,'Parent of 39','parent39@school.com','9270192580','$2a$10$M815YQbobnIkwbq6AO5XueGijLvjS0vaeykdiFPSgw9UoLqTnO5lm','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(94,1,'Vihaan Das','student40@school.com','9781641588','$2a$10$iseoS4j.JQVn.fGYFhHYBOBiHo87pxm8jLEgvUxw4ux6ftaUeY9fe','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(95,1,'Parent of 40','parent40@school.com','9856126329','$2a$10$n/bkh6NOWVdGzOe2/ewFjOzc2QxdGVzq4AG2LJyPPlwZLh2I4bsIy','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(96,1,'Arjun Patel','student41@school.com','9876435395','$2a$10$RDjnesE1ZC3IDZuFRppntu01zBKj9MzMrivGayvPhzf7UaE/ReDim','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(97,1,'Parent of 41','parent41@school.com','9358913625','$2a$10$1YBakjbNnZh8YKFHNpGWj.IkE1M7D8N16qvx/vfXbV31Sm0rd2cLW','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:19','2026-06-07 09:09:19'),(98,1,'Kiara Reddy','student42@school.com','9470992442','$2a$10$sep2UwwMiQxNtkQltdGt6eItvooJggI/N2tG6UXk9.2kS1Z7/OO9i','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(99,1,'Parent of 42','parent42@school.com','9474328227','$2a$10$I9.ZjlYqXXRBqN5qYpdwVeiCRAyy00KBfdlxrHY76oi3nUjxAnK86','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(100,1,'Aditya Iyer','student43@school.com','9441484650','$2a$10$o/uJ121reZZgEcllCY0jDecWPxaeI44qMjiraONRiWqzXCINobof.','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(101,1,'Parent of 43','parent43@school.com','9708977356','$2a$10$/Nai5COWE9P8921rECvHYeEET6h0bFshZiWFc1lxrfj1ArDsM81OO','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(102,1,'Krishna Iyer','student44@school.com','9774173986','$2a$10$JQQ9OU4MwiYfTzipub4bmuSgGkkX2dkHcU3tKiycWGVX3osJ8zsN.','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(103,1,'Parent of 44','parent44@school.com','9197517502','$2a$10$bTdLlTPCgpkWb7thTKm6t.P3QeDjSQ3l/645Egj.6rv1tnQ9fj/eu','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(104,1,'Arjun Singh','student45@school.com','9750376015','$2a$10$bYmVr/Mu9MNKAq75tClLreXeDdxEtSaPC1xiJ4NP2a4nd5/nbAIRe','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(105,1,'Parent of 45','parent45@school.com','9444216811','$2a$10$7wIBFKUs3y7LsuwP/TkP..BjiXijCe.Qsq6Ce9wJDPSgjN2B/xLqC','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(106,1,'Vivaan Verma','student46@school.com','9475452753','$2a$10$RzmzI9d4UJiWbqwaK536auvQhmQAtIOSP5XXeDvQwrLV97JWY4/oS','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(107,1,'Parent of 46','parent46@school.com','9167748491','$2a$10$lOXY4ac9qpcJL5YitMqtxOkzEemkboD56quN6poq0bH6vDGlak1ym','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(108,1,'Vivaan Kumar','student47@school.com','9370581057','$2a$10$sZf49cNXQibPMOgofwu1deof39EKy7MUHNVm.aGpktREs50oO3JXi','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(109,1,'Parent of 47','parent47@school.com','9392574542','$2a$10$zZwrI3OfJN2qHn13RNQNLetDfQxphSiJcC98VksHpJQFOSIoKqRNG','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(110,1,'Sai Reddy','student48@school.com','9445636380','$2a$10$5j9Zx63MODdxUu7Hq2i81uWMqAtfGMos7VOBR6gdJb0VzEJwPapCe','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(111,1,'Parent of 48','parent48@school.com','9941961355','$2a$10$D8yigewYRRDQESXqB1qFp.UpalDdM0LmcFvbgN/I8CDLMqVnC9k/q','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:20','2026-06-07 09:09:20'),(112,1,'Ishaan Kumar','student49@school.com','9730340225','$2a$10$NwzSizBtFrbWVFLMlKo3BOdTm7NxSoKYko1zuTMf./X0jPVpYiTxC','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(113,1,'Parent of 49','parent49@school.com','9988325726','$2a$10$2IFSuhIf6Tk967zCMwWfYON6M1sIULjDfpmcmKTlqNOhRlhhbAmne','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(114,1,'Aadhya Patel','student50@school.com','9633459049','$2a$10$Yo3gWYutF8qorrTf/VPOeO5inOeXOKn08VAwigHgYwD5Jq9.qPS1S','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(115,1,'Parent of 50','parent50@school.com','9493383627','$2a$10$KNeZrQIcyKU9wK8OnN8jwu3OUxlILmE26gIsZzksbAiZI7LpZS3MC','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(116,1,'Diya Reddy','student51@school.com','9630534472','$2a$10$WcuB0dVENXYX9p70jCPYGuzJ7PagbsJYQuXkqbcpM9m.s4Bpy2YsK','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(117,1,'Parent of 51','parent51@school.com','9940979780','$2a$10$I2EnVkrV8GVSCHsFE1iDTecMNR8ChOmVcWj2NGpk8pQj63DasxkGa','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(118,1,'Aadhya Gupta','student52@school.com','9445863122','$2a$10$KJa8QlBzTNm349HO6crnA.usmeKCH83JP0ZpT9Y6a0cYukSosbQw6','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(119,1,'Parent of 52','parent52@school.com','9529933498','$2a$10$QcjU9c2O4MgoKCrz6OIVIeCqeiwHzOoHoBUHf25z6ubMhg74rT.7S','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(120,1,'Saanvi Verma','student53@school.com','9445982091','$2a$10$eRgo/Do5arViCcWkQ6FvuewOuF3bMvNPZGomzFhJOdmZc3M4RVJw.','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(121,1,'Parent of 53','parent53@school.com','9657048335','$2a$10$kO4a1WUwtqZ7A3EexCMsBe5dlfSE216s9SxVYp7oJJIJ3JZUYUoOi','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(122,1,'Kiara Patel','student54@school.com','9690147334','$2a$10$ALtnL8MX4574U44RZaX9s.nJkUXmL6fGTOpM5506U2eAcnpysW79e','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(123,1,'Parent of 54','parent54@school.com','9242280086','$2a$10$fvhztW/Z06Jx96dCEKP.UOO/t2O/aLgxxb9UPWR7YcKLiSM08dHqK','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(124,1,'Ananya Iyer','student55@school.com','9595910080','$2a$10$1SCgOcXA7BlSvW3R0XfssuJGY/8xWIKLRVzfWP.Ns5P82Wne58gSy','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:21','2026-06-07 09:09:21'),(125,1,'Parent of 55','parent55@school.com','9253912478','$2a$10$LUmZ67MHdrEurNA95qiDgOiIDSso20HRha9PjXaH7p.lDhrjLA3ZC','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22'),(126,1,'Sai Verma','student56@school.com','9976018973','$2a$10$eQMGiUO1gce5MoLdCXKTE.KynV/fcaqAmU6iFHxkLIiC5Gm7.YNE2','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22'),(127,1,'Parent of 56','parent56@school.com','9814741741','$2a$10$s7phgugyIe.c4xazvLxw9uypCCuYanvdZj86Dli2D6M4H/2JdaxwS','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22'),(128,1,'Ananya Iyer','student57@school.com','9381896099','$2a$10$T6Z7BN/8bKfJoQBCV6wxOuAHaaepd8lHa5oUElFc1942T.BnkZxWy','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22'),(129,1,'Parent of 57','parent57@school.com','9477262873','$2a$10$hI2BhAwmUznjs55pevaGBeDAX684PcxCeLfxTE2F4M7u3VsYM3J9u','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22'),(130,1,'Myra Gupta','student58@school.com','9927440476','$2a$10$6GaQXUj3HB68zujoGp6FLeLMZYX5/DyV5iuI9O2dXPx0BZhUoN5s6','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22'),(131,1,'Parent of 58','parent58@school.com','9631929847','$2a$10$QmFYsJsvw3A9j0iR6pFHXevy1JD1jH8vwCiyGK5S2ON0gWJcaHSAq','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22'),(132,1,'Aarav Sharma','student59@school.com','9275295900','$2a$10$5iKdpxkV2n3C/83BMqsdHuNryrB/CUxRDzXBBYguw//7gjj2bYgjq','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22'),(133,1,'Parent of 59','parent59@school.com','9252639805','$2a$10$2lk/5inzjEb6MF7suaIAKee0DHAo8UZj/wFbhvMzv.SdTAwRo.xgG','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22'),(134,1,'Myra Gupta','student60@school.com','9414940750','$2a$10$3haG9lVcS/WZbJK90zZ4kuqXUjW8g21hgAVSuovFiyD.O/AwvBMVm','student',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22'),(135,1,'Parent of 60','parent60@school.com','9684748031','$2a$10$g.pSC1vHzfubWlEDXi.jr.GkfvjoFTf4D4ouJUuQtr6D304V9zKxa','parent',NULL,1,0,NULL,NULL,'2026-06-07 09:09:22','2026-06-07 09:09:22');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `vehicle_number` varchar(30) DEFAULT NULL,
  `vehicle_type` varchar(50) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `driver_name` varchar(120) DEFAULT NULL,
  `driver_phone` varchar(30) DEFAULT NULL,
  `driver_license` varchar(60) DEFAULT NULL,
  `route_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `insurance_expiry` date DEFAULT NULL,
  `fitness_expiry` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  KEY `route_id` (`route_id`),
  CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vehicles_ibfk_2` FOREIGN KEY (`route_id`) REFERENCES `transport_routes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES (1,1,'DL01AB1001','Bus',40,'Driver 1','9316524106',NULL,1,1,'2026-08-01','2026-06-15'),(2,1,'DL01AB1002','Bus',40,'Driver 2','9155874632',NULL,2,1,'2026-08-01','2026-06-15');
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visitors`
--

DROP TABLE IF EXISTS `visitors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `purpose` varchar(200) DEFAULT NULL,
  `whom_to_meet` varchar(150) DEFAULT NULL,
  `id_proof_type` varchar(50) DEFAULT NULL,
  `id_proof_url` varchar(255) DEFAULT NULL,
  `in_time` datetime DEFAULT NULL,
  `out_time` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `pass_number` varchar(50) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `vehicle_number` varchar(30) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `visitors_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visitors`
--

LOCK TABLES `visitors` WRITE;
/*!40000 ALTER TABLE `visitors` DISABLE KEYS */;
INSERT INTO `visitors` VALUES (1,1,'Visitor 1','987654321',NULL,'Meet Teacher','Admin Office','Aadhar',NULL,'2026-06-07 14:39:23',NULL,13,'VP-2025-101',NULL,NULL,'2026-06-07 09:09:23'),(2,1,'Visitor 2','987654322',NULL,'Meet Teacher','Admin Office','Aadhar',NULL,'2026-06-07 14:39:23',NULL,13,'VP-2025-102',NULL,NULL,'2026-06-07 09:09:23'),(3,1,'Visitor 3','987654323',NULL,'Fee Payment','Admin Office','Aadhar',NULL,'2026-06-07 14:39:23',NULL,13,'VP-2025-103',NULL,NULL,'2026-06-07 09:09:23'),(4,1,'Visitor 4','987654324',NULL,'Admission Enquiry','Admin Office','Aadhar',NULL,'2026-06-07 14:39:23',NULL,13,'VP-2025-104',NULL,NULL,'2026-06-07 09:09:23'),(5,1,'Visitor 5','987654325',NULL,'Fee Payment','Admin Office','Aadhar',NULL,'2026-06-07 14:39:23',NULL,13,'VP-2025-105',NULL,NULL,'2026-06-07 09:09:23');
/*!40000 ALTER TABLE `visitors` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-07 19:46:31

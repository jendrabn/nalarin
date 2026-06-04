DROP TABLE IF EXISTS `email_change_tokens`;
DROP TABLE IF EXISTS `email_verification_tokens`;
DROP TABLE IF EXISTS `password_reset_tokens`;
ALTER TABLE `users` DROP COLUMN `password_hash`;

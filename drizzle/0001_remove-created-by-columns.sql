ALTER TABLE `email_campaigns` DROP FOREIGN KEY `email_campaigns_created_by_admin_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `grammar_questions` DROP FOREIGN KEY `grammar_questions_created_by_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `materials` DROP FOREIGN KEY `materials_created_by_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `practices` DROP FOREIGN KEY `practices_created_by_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `questions` DROP FOREIGN KEY `questions_created_by_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `tryouts` DROP FOREIGN KEY `tryouts_created_by_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `vocabularies` DROP FOREIGN KEY `vocabularies_created_by_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `vouchers` DROP FOREIGN KEY `vouchers_created_by_users_id_fk`;
--> statement-breakpoint
DROP INDEX `email_campaigns_created_by_idx` ON `email_campaigns`;--> statement-breakpoint
DROP INDEX `grammar_questions_created_by_idx` ON `grammar_questions`;--> statement-breakpoint
DROP INDEX `materials_created_by_idx` ON `materials`;--> statement-breakpoint
DROP INDEX `practices_created_by_idx` ON `practices`;--> statement-breakpoint
DROP INDEX `questions_created_by_idx` ON `questions`;--> statement-breakpoint
DROP INDEX `tryouts_created_by_idx` ON `tryouts`;--> statement-breakpoint
DROP INDEX `vocabularies_created_by_idx` ON `vocabularies`;--> statement-breakpoint
ALTER TABLE `email_campaigns` DROP COLUMN `created_by_admin_id`;--> statement-breakpoint
ALTER TABLE `grammar_questions` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `materials` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `practices` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `questions` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `tryouts` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `vocabularies` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `vouchers` DROP COLUMN `created_by`;
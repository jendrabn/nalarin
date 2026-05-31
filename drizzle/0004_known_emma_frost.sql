CREATE TABLE `grammar_questions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`language` enum('id','en') NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`category` varchar(191),
	`sentence_template` longtext NOT NULL,
	`answers` json NOT NULL,
	`distractors` json NOT NULL,
	`status` enum('draft','published','archived') NOT NULL,
	`created_by` int unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grammar_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vocabularies` MODIFY COLUMN `type` enum('synonym','antonym','definition','baku','tidak_baku') NOT NULL;--> statement-breakpoint
ALTER TABLE `grammar_questions` ADD CONSTRAINT `grammar_questions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `grammar_questions_filter_idx` ON `grammar_questions` (`language`,`difficulty`,`category`,`status`);--> statement-breakpoint
CREATE INDEX `grammar_questions_status_created_at_idx` ON `grammar_questions` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `grammar_questions_created_by_idx` ON `grammar_questions` (`created_by`);
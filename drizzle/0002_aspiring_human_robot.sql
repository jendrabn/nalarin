CREATE TABLE `vocabularies` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`word` varchar(255) NOT NULL,
	`language` enum('id','en') NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`type` enum('synonym','antonym','definition') NOT NULL,
	`correct_meaning` text NOT NULL,
	`wrong_options` json NOT NULL,
	`example_sentence` text,
	`status` enum('draft','published','archived') NOT NULL,
	`created_by` int unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vocabularies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vocabularies` ADD CONSTRAINT `vocabularies_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `vocabularies_filter_idx` ON `vocabularies` (`language`,`difficulty`,`type`,`status`);--> statement-breakpoint
CREATE INDEX `vocabularies_status_created_at_idx` ON `vocabularies` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `vocabularies_created_by_idx` ON `vocabularies` (`created_by`);
CREATE TABLE `materials` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`exam_type_id` int unsigned NOT NULL,
	`subject_id` int unsigned NOT NULL,
	`topic_id` int unsigned,
	`title` varchar(255) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`excerpt` text,
	`youtube_url` varchar(2048),
	`content` longtext,
	`thumbnail_url` varchar(2048),
	`is_free` boolean NOT NULL DEFAULT true,
	`status` enum('draft','published','archived') NOT NULL,
	`published_at` timestamp,
	`created_by` int unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `materials_exam_type_slug_uq` UNIQUE(`exam_type_id`,`slug`)
);
--> statement-breakpoint
ALTER TABLE `materials` ADD CONSTRAINT `materials_exam_type_id_exam_types_id_fk` FOREIGN KEY (`exam_type_id`) REFERENCES `exam_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materials` ADD CONSTRAINT `materials_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materials` ADD CONSTRAINT `materials_topic_id_topics_id_fk` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materials` ADD CONSTRAINT `materials_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `materials_bank_filter_idx` ON `materials` (`exam_type_id`,`subject_id`,`topic_id`,`status`,`is_free`);--> statement-breakpoint
CREATE INDEX `materials_status_publish_idx` ON `materials` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `materials_created_by_idx` ON `materials` (`created_by`);
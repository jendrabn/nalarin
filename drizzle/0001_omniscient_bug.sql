ALTER TABLE `exam_types` ADD `countdown_title` varchar(255);--> statement-breakpoint
ALTER TABLE `exam_types` ADD `countdown_target_at` timestamp;--> statement-breakpoint
ALTER TABLE `exam_types` ADD `registration_start_at` timestamp;--> statement-breakpoint
ALTER TABLE `exam_types` ADD `registration_end_at` timestamp;--> statement-breakpoint
ALTER TABLE `exam_types` ADD `exam_start_at` timestamp;--> statement-breakpoint
ALTER TABLE `exam_types` ADD `exam_end_at` timestamp;--> statement-breakpoint
ALTER TABLE `exam_types` ADD `announcement_at` timestamp;--> statement-breakpoint
ALTER TABLE `exam_types` ADD `information_content` longtext;
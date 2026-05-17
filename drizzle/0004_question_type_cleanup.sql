UPDATE `questions` SET `type` = 'short_answer' WHERE `type` = 'essay';--> statement-breakpoint
UPDATE `practice_answers` SET `question_type` = 'short_answer' WHERE `question_type` = 'essay';--> statement-breakpoint
UPDATE `tryout_answers` SET `question_type` = 'short_answer' WHERE `question_type` = 'essay';--> statement-breakpoint
ALTER TABLE `questions` MODIFY COLUMN `type` enum('multiple_choice','multiple_answer','short_answer','true_false') NOT NULL;--> statement-breakpoint
ALTER TABLE `practice_answers` MODIFY COLUMN `question_type` enum('multiple_choice','multiple_answer','short_answer','true_false') NOT NULL;--> statement-breakpoint
ALTER TABLE `tryout_answers` MODIFY COLUMN `question_type` enum('multiple_choice','multiple_answer','short_answer','true_false') NOT NULL;

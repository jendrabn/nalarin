UPDATE `practices` SET `has_practice_mode` = true, `has_quiz_mode` = true;--> statement-breakpoint
ALTER TABLE `practices` MODIFY COLUMN `has_practice_mode` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `practices` MODIFY COLUMN `has_quiz_mode` boolean NOT NULL DEFAULT true;

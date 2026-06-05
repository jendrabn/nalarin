ALTER TABLE `tryouts` ADD `scoring_method` enum('raw_score','irt_3pl') NOT NULL DEFAULT 'raw_score' AFTER `wrong_answer_penalty`;--> statement-breakpoint

CREATE TABLE `blog_categories` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_categories_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`category_id` int unsigned,
	`author_id` int unsigned,
	`title` varchar(255) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`excerpt` text,
	`content` longtext NOT NULL,
	`thumbnail_url` varchar(2048),
	`tags` json,
	`status` enum('draft','published','archived') NOT NULL,
	`seo_title` varchar(255),
	`meta_description` text,
	`read_time_minutes` int unsigned,
	`view_count` int unsigned NOT NULL DEFAULT 0,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `email_change_tokens` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`new_email` varchar(191) NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`invalidated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_change_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_change_tokens_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `email_verification_tokens` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`invalidated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_verification_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_verification_tokens_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `exam_types` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exam_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `exam_types_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `monthly_usage` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`period` date NOT NULL,
	`practice_sessions_count` int unsigned NOT NULL DEFAULT 0,
	`quiz_sessions_count` int unsigned NOT NULL DEFAULT 0,
	`tryout_sessions_count` int unsigned NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthly_usage_id` PRIMARY KEY(`id`),
	CONSTRAINT `monthly_usage_user_period_uq` UNIQUE(`user_id`,`period`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`invalidated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`subscription_id` int unsigned,
	`plan_code` enum('free','pro','max') NOT NULL,
	`amount` bigint unsigned NOT NULL,
	`status` enum('pending','paid','failed','expired','cancelled','refunded') NOT NULL,
	`gateway` enum('midtrans','manual') NOT NULL,
	`payment_method` enum('bank_transfer','e_wallet','qris','credit_card','convenience_store','manual_transfer','other'),
	`transaction_source` enum('midtrans_webhook','user_checkout','admin_manual') NOT NULL,
	`gateway_order_id` varchar(191),
	`gateway_transaction_id` varchar(191),
	`payment_url` varchar(2048),
	`paid_at` timestamp,
	`expired_at` timestamp,
	`proof_url` varchar(2048),
	`notes` text,
	`raw_payload` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_subscription_id_uq` UNIQUE(`subscription_id`),
	CONSTRAINT `payments_gateway_order_id_uq` UNIQUE(`gateway_order_id`),
	CONSTRAINT `payments_gateway_transaction_id_uq` UNIQUE(`gateway_transaction_id`)
);
--> statement-breakpoint
CREATE TABLE `practice_answers` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`practice_session_id` int unsigned NOT NULL,
	`practice_session_question_id` int unsigned NOT NULL,
	`question_type` enum('multiple_choice','multiple_answer','short_answer','essay','true_false') NOT NULL,
	`selected_option_keys` json,
	`answer_text` longtext,
	`is_marked_for_review` boolean NOT NULL DEFAULT false,
	`is_correct` boolean,
	`score` decimal(10,2),
	`max_score` decimal(10,2),
	`grading_status` enum('not_required','pending','graded','needs_review') NOT NULL,
	`grading_source` enum('manual','ai','auto'),
	`grading_feedback` text,
	`graded_at` timestamp,
	`answered_at` timestamp,
	`last_saved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `practice_answers_id` PRIMARY KEY(`id`),
	CONSTRAINT `practice_answers_session_question_uq` UNIQUE(`practice_session_question_id`)
);
--> statement-breakpoint
CREATE TABLE `practice_questions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`practice_id` int unsigned NOT NULL,
	`question_id` int unsigned NOT NULL,
	`order_index` int unsigned NOT NULL,
	`points` decimal(10,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practice_questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `practice_questions_practice_question_uq` UNIQUE(`practice_id`,`question_id`),
	CONSTRAINT `practice_questions_practice_order_uq` UNIQUE(`practice_id`,`order_index`)
);
--> statement-breakpoint
CREATE TABLE `practice_session_questions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`practice_session_id` int unsigned NOT NULL,
	`practice_question_id` int unsigned NOT NULL,
	`question_id` int unsigned NOT NULL,
	`order_index` int unsigned NOT NULL,
	`question_snapshot` json NOT NULL,
	`option_snapshot` json NOT NULL,
	`correct_answer_snapshot` json NOT NULL,
	`points` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practice_session_questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `practice_session_questions_session_practice_question_uq` UNIQUE(`practice_session_id`,`practice_question_id`)
);
--> statement-breakpoint
CREATE TABLE `practice_sessions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`practice_id` int unsigned NOT NULL,
	`user_id` int unsigned NOT NULL,
	`mode` enum('practice','quiz') NOT NULL,
	`status` enum('pending','in_progress','submitted','grading','graded','cancelled') NOT NULL DEFAULT 'in_progress',
	`total_questions` int unsigned NOT NULL DEFAULT 0,
	`total_correct` int unsigned NOT NULL DEFAULT 0,
	`total_wrong` int unsigned NOT NULL DEFAULT 0,
	`total_unanswered` int unsigned NOT NULL DEFAULT 0,
	`total_score` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total_max_score` decimal(10,2) NOT NULL DEFAULT '0.00',
	`duration_minutes` int unsigned,
	`current_question_order` int unsigned,
	`started_at` timestamp NOT NULL,
	`submitted_at` timestamp,
	`graded_at` timestamp,
	`last_saved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `practice_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `practices` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`exam_type_id` int unsigned NOT NULL,
	`subject_id` int unsigned NOT NULL,
	`topic_id` int unsigned,
	`title` varchar(255) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`description` text,
	`is_free` boolean NOT NULL,
	`has_practice_mode` boolean NOT NULL,
	`has_quiz_mode` boolean NOT NULL,
	`quiz_duration_minutes` int unsigned,
	`shuffle_questions` boolean NOT NULL,
	`shuffle_options` boolean NOT NULL,
	`allow_review_before_submit` boolean NOT NULL,
	`show_result_after_submit` boolean NOT NULL,
	`show_explanation_after_submit` boolean NOT NULL,
	`navigation_mode` enum('free','sequential') NOT NULL,
	`status` enum('draft','published','archived') NOT NULL,
	`published_at` timestamp,
	`created_by` int unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `practices_id` PRIMARY KEY(`id`),
	CONSTRAINT `practices_exam_type_slug_uq` UNIQUE(`exam_type_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `question_options` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`question_id` int unsigned NOT NULL,
	`label` varchar(20) NOT NULL,
	`content` longtext NOT NULL,
	`image_url` varchar(2048),
	`is_correct` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `question_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`subject_id` int unsigned NOT NULL,
	`topic_id` int unsigned,
	`type` enum('multiple_choice','multiple_answer','short_answer','essay','true_false') NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`scoring_rule` enum('all_or_nothing','partial'),
	`title` varchar(255),
	`content` longtext NOT NULL,
	`image_url` varchar(2048),
	`correct_answer_text` longtext,
	`grading_rubric` longtext,
	`manual_explanation` longtext,
	`ai_explanation` longtext,
	`year` int unsigned,
	`points` decimal(10,2) NOT NULL,
	`status` enum('draft','published','archived') NOT NULL,
	`created_by` int unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`exam_type_id` int unsigned NOT NULL,
	`name` varchar(150) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_exam_type_slug_uq` UNIQUE(`exam_type_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`plan_code` enum('free','pro','max') NOT NULL,
	`status` enum('active','expired','cancelled') NOT NULL,
	`source` enum('midtrans','manual','admin_grant') NOT NULL,
	`starts_at` timestamp NOT NULL,
	`ends_at` timestamp NOT NULL,
	`activated_by_admin_id` int unsigned,
	`cancelled_by_admin_id` int unsigned,
	`cancelled_at` timestamp,
	`cancellation_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`subject_id` int unsigned NOT NULL,
	`name` varchar(150) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topics_id` PRIMARY KEY(`id`),
	CONSTRAINT `topics_subject_slug_uq` UNIQUE(`subject_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `tryout_answers` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`tryout_session_id` int unsigned NOT NULL,
	`tryout_section_session_id` int unsigned NOT NULL,
	`tryout_session_question_id` int unsigned NOT NULL,
	`question_type` enum('multiple_choice','multiple_answer','short_answer','essay','true_false') NOT NULL,
	`selected_option_keys` json,
	`answer_text` longtext,
	`is_marked_for_review` boolean NOT NULL DEFAULT false,
	`is_correct` boolean,
	`score` decimal(10,2),
	`max_score` decimal(10,2),
	`grading_status` enum('not_required','pending','graded','needs_review') NOT NULL,
	`grading_source` enum('manual','ai','auto'),
	`grading_feedback` text,
	`graded_at` timestamp,
	`answered_at` timestamp,
	`last_saved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tryout_answers_id` PRIMARY KEY(`id`),
	CONSTRAINT `tryout_answers_session_question_uq` UNIQUE(`tryout_session_question_id`)
);
--> statement-breakpoint
CREATE TABLE `tryout_questions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`tryout_section_id` int unsigned NOT NULL,
	`question_id` int unsigned NOT NULL,
	`order_index` int unsigned NOT NULL,
	`points` decimal(10,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tryout_questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `tryout_questions_section_question_uq` UNIQUE(`tryout_section_id`,`question_id`),
	CONSTRAINT `tryout_questions_section_order_uq` UNIQUE(`tryout_section_id`,`order_index`)
);
--> statement-breakpoint
CREATE TABLE `tryout_section_sessions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`tryout_session_id` int unsigned NOT NULL,
	`tryout_section_id` int unsigned NOT NULL,
	`status` enum('pending','in_progress','submitted','grading','graded','cancelled') NOT NULL DEFAULT 'pending',
	`duration_minutes` int unsigned NOT NULL,
	`wrong_answer_penalty` decimal(5,2) NOT NULL DEFAULT '0.00',
	`total_questions` int unsigned NOT NULL DEFAULT 0,
	`correct_count` int unsigned NOT NULL DEFAULT 0,
	`wrong_count` int unsigned NOT NULL DEFAULT 0,
	`unanswered_count` int unsigned NOT NULL DEFAULT 0,
	`score` decimal(10,2) NOT NULL DEFAULT '0.00',
	`current_question_order` int unsigned,
	`started_at` timestamp,
	`submitted_at` timestamp,
	`graded_at` timestamp,
	`last_saved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tryout_section_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `tryout_section_sessions_session_section_uq` UNIQUE(`tryout_session_id`,`tryout_section_id`)
);
--> statement-breakpoint
CREATE TABLE `tryout_sections` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`tryout_id` int unsigned NOT NULL,
	`subject_id` int unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`duration_minutes` int unsigned NOT NULL,
	`order_index` int unsigned NOT NULL,
	`wrong_answer_penalty` decimal(5,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tryout_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `tryout_sections_tryout_order_uq` UNIQUE(`tryout_id`,`order_index`)
);
--> statement-breakpoint
CREATE TABLE `tryout_session_questions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`tryout_session_id` int unsigned NOT NULL,
	`tryout_section_session_id` int unsigned NOT NULL,
	`tryout_question_id` int unsigned NOT NULL,
	`question_id` int unsigned NOT NULL,
	`order_index` int unsigned NOT NULL,
	`question_snapshot` json NOT NULL,
	`option_snapshot` json NOT NULL,
	`correct_answer_snapshot` json NOT NULL,
	`points` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tryout_session_questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `tryout_session_questions_session_tryout_question_uq` UNIQUE(`tryout_session_id`,`tryout_question_id`)
);
--> statement-breakpoint
CREATE TABLE `tryout_sessions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`tryout_id` int unsigned NOT NULL,
	`user_id` int unsigned NOT NULL,
	`status` enum('pending','in_progress','submitted','grading','graded','cancelled') NOT NULL DEFAULT 'in_progress',
	`total_questions` int unsigned NOT NULL DEFAULT 0,
	`total_correct` int unsigned NOT NULL DEFAULT 0,
	`total_wrong` int unsigned NOT NULL DEFAULT 0,
	`total_unanswered` int unsigned NOT NULL DEFAULT 0,
	`total_score` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total_max_score` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total_sections_started` int unsigned NOT NULL DEFAULT 0,
	`duration_used_seconds` int unsigned NOT NULL DEFAULT 0,
	`auto_submitted` boolean NOT NULL DEFAULT false,
	`started_at` timestamp NOT NULL,
	`submitted_at` timestamp,
	`graded_at` timestamp,
	`last_saved_at` timestamp,
	`cancelled_at` timestamp,
	`cancellation_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tryout_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tryouts` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`exam_type_id` int unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`description` text,
	`is_free` boolean NOT NULL,
	`starts_at` timestamp,
	`ends_at` timestamp,
	`shuffle_questions` boolean NOT NULL,
	`shuffle_options` boolean NOT NULL,
	`allow_review_before_submit` boolean NOT NULL,
	`show_result_after_submit` boolean NOT NULL,
	`result_release_at` timestamp,
	`show_ranking_after_submit` boolean NOT NULL,
	`ranking_release_at` timestamp,
	`show_explanation_after_submit` boolean NOT NULL,
	`explanation_release_at` timestamp,
	`navigation_mode` enum('free','sequential') NOT NULL,
	`enforce_end_time` boolean NOT NULL,
	`wrong_answer_penalty` decimal(5,2) NOT NULL DEFAULT '0.00',
	`status` enum('draft','published','archived') NOT NULL,
	`published_at` timestamp,
	`created_by` int unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tryouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `tryouts_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_progress_snapshots` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`exam_type_id` int NOT NULL,
	`subject_id` int NOT NULL,
	`total_questions_answered` int unsigned NOT NULL DEFAULT 0,
	`total_correct` int unsigned NOT NULL DEFAULT 0,
	`total_wrong` int unsigned NOT NULL DEFAULT 0,
	`total_max_score_aggregate` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total_score_aggregate` decimal(10,2) NOT NULL DEFAULT '0.00',
	`average_score` decimal(7,2),
	`strongest_topics` json,
	`weakest_topics` json,
	`snapshot_date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_progress_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_progress_snapshots_scope_uq` UNIQUE(`user_id`,`exam_type_id`,`subject_id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`session_token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`last_active_at` timestamp NOT NULL,
	`ip_address` varchar(45),
	`user_agent` varchar(1024),
	`revoked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sessions_token_hash_uq` UNIQUE(`session_token_hash`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(191) NOT NULL,
	`email_verified_at` timestamp,
	`password_hash` varchar(255),
	`google_id` varchar(255),
	`avatar_url` varchar(2048),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`gender` enum('male','female'),
	`phone_number` varchar(32),
	`school_class` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`),
	CONSTRAINT `users_google_id_uq` UNIQUE(`google_id`)
);
--> statement-breakpoint
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_category_id_blog_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_change_tokens` ADD CONSTRAINT `email_change_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_verification_tokens` ADD CONSTRAINT `email_verification_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monthly_usage` ADD CONSTRAINT `monthly_usage_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_answers` ADD CONSTRAINT `practice_answers_practice_session_id_practice_sessions_id_fk` FOREIGN KEY (`practice_session_id`) REFERENCES `practice_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_answers` ADD CONSTRAINT `practice_answers_practice_session_question_id_practice_session_questions_id_fk` FOREIGN KEY (`practice_session_question_id`) REFERENCES `practice_session_questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_questions` ADD CONSTRAINT `practice_questions_practice_id_practices_id_fk` FOREIGN KEY (`practice_id`) REFERENCES `practices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_questions` ADD CONSTRAINT `practice_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_session_questions` ADD CONSTRAINT `practice_session_questions_practice_session_id_practice_sessions_id_fk` FOREIGN KEY (`practice_session_id`) REFERENCES `practice_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_session_questions` ADD CONSTRAINT `practice_session_questions_practice_question_id_practice_questions_id_fk` FOREIGN KEY (`practice_question_id`) REFERENCES `practice_questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_session_questions` ADD CONSTRAINT `practice_session_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_sessions` ADD CONSTRAINT `practice_sessions_practice_id_practices_id_fk` FOREIGN KEY (`practice_id`) REFERENCES `practices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_sessions` ADD CONSTRAINT `practice_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practices` ADD CONSTRAINT `practices_exam_type_id_exam_types_id_fk` FOREIGN KEY (`exam_type_id`) REFERENCES `exam_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practices` ADD CONSTRAINT `practices_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practices` ADD CONSTRAINT `practices_topic_id_topics_id_fk` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practices` ADD CONSTRAINT `practices_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_topic_id_topics_id_fk` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_exam_type_id_exam_types_id_fk` FOREIGN KEY (`exam_type_id`) REFERENCES `exam_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_activated_by_admin_id_users_id_fk` FOREIGN KEY (`activated_by_admin_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_cancelled_by_admin_id_users_id_fk` FOREIGN KEY (`cancelled_by_admin_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `topics` ADD CONSTRAINT `topics_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_answers` ADD CONSTRAINT `tryout_answers_tryout_session_id_tryout_sessions_id_fk` FOREIGN KEY (`tryout_session_id`) REFERENCES `tryout_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_answers` ADD CONSTRAINT `tryout_answers_tryout_section_session_id_tryout_section_sessions_id_fk` FOREIGN KEY (`tryout_section_session_id`) REFERENCES `tryout_section_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_answers` ADD CONSTRAINT `tryout_answers_tryout_session_question_id_tryout_session_questions_id_fk` FOREIGN KEY (`tryout_session_question_id`) REFERENCES `tryout_session_questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_questions` ADD CONSTRAINT `tryout_questions_tryout_section_id_tryout_sections_id_fk` FOREIGN KEY (`tryout_section_id`) REFERENCES `tryout_sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_questions` ADD CONSTRAINT `tryout_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_section_sessions` ADD CONSTRAINT `tryout_section_sessions_tryout_session_id_tryout_sessions_id_fk` FOREIGN KEY (`tryout_session_id`) REFERENCES `tryout_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_section_sessions` ADD CONSTRAINT `tryout_section_sessions_tryout_section_id_tryout_sections_id_fk` FOREIGN KEY (`tryout_section_id`) REFERENCES `tryout_sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_sections` ADD CONSTRAINT `tryout_sections_tryout_id_tryouts_id_fk` FOREIGN KEY (`tryout_id`) REFERENCES `tryouts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_sections` ADD CONSTRAINT `tryout_sections_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_session_questions` ADD CONSTRAINT `tryout_session_questions_tryout_session_id_tryout_sessions_id_fk` FOREIGN KEY (`tryout_session_id`) REFERENCES `tryout_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_session_questions` ADD CONSTRAINT `tryout_session_questions_tryout_section_session_id_tryout_section_sessions_id_fk` FOREIGN KEY (`tryout_section_session_id`) REFERENCES `tryout_section_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_session_questions` ADD CONSTRAINT `tryout_session_questions_tryout_question_id_tryout_questions_id_fk` FOREIGN KEY (`tryout_question_id`) REFERENCES `tryout_questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_session_questions` ADD CONSTRAINT `tryout_session_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_sessions` ADD CONSTRAINT `tryout_sessions_tryout_id_tryouts_id_fk` FOREIGN KEY (`tryout_id`) REFERENCES `tryouts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryout_sessions` ADD CONSTRAINT `tryout_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryouts` ADD CONSTRAINT `tryouts_exam_type_id_exam_types_id_fk` FOREIGN KEY (`exam_type_id`) REFERENCES `exam_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryouts` ADD CONSTRAINT `tryouts_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_progress_snapshots` ADD CONSTRAINT `user_progress_snapshots_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `blog_posts_public_listing_idx` ON `blog_posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `blog_posts_category_listing_idx` ON `blog_posts` (`category_id`,`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `blog_posts_author_listing_idx` ON `blog_posts` (`author_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `email_change_tokens_user_validity_idx` ON `email_change_tokens` (`user_id`,`invalidated_at`,`used_at`,`expires_at`);--> statement-breakpoint
CREATE INDEX `email_verification_tokens_user_validity_idx` ON `email_verification_tokens` (`user_id`,`invalidated_at`,`used_at`,`expires_at`);--> statement-breakpoint
CREATE INDEX `monthly_usage_period_idx` ON `monthly_usage` (`period`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_validity_idx` ON `password_reset_tokens` (`user_id`,`invalidated_at`,`used_at`,`expires_at`);--> statement-breakpoint
CREATE INDEX `payments_user_status_idx` ON `payments` (`user_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `payments_status_gateway_idx` ON `payments` (`status`,`gateway`,`created_at`);--> statement-breakpoint
CREATE INDEX `practice_answers_session_grading_idx` ON `practice_answers` (`practice_session_id`,`grading_status`,`graded_at`);--> statement-breakpoint
CREATE INDEX `practice_answers_grading_queue_idx` ON `practice_answers` (`grading_status`,`question_type`,`updated_at`);--> statement-breakpoint
CREATE INDEX `practice_questions_question_idx` ON `practice_questions` (`question_id`);--> statement-breakpoint
CREATE INDEX `practice_session_questions_session_order_idx` ON `practice_session_questions` (`practice_session_id`,`order_index`);--> statement-breakpoint
CREATE INDEX `practice_session_questions_question_idx` ON `practice_session_questions` (`question_id`);--> statement-breakpoint
CREATE INDEX `practice_sessions_user_practice_status_idx` ON `practice_sessions` (`user_id`,`practice_id`,`status`);--> statement-breakpoint
CREATE INDEX `practice_sessions_user_created_at_idx` ON `practice_sessions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `practice_sessions_status_last_saved_idx` ON `practice_sessions` (`status`,`last_saved_at`);--> statement-breakpoint
CREATE INDEX `practice_sessions_practice_status_idx` ON `practice_sessions` (`practice_id`,`status`);--> statement-breakpoint
CREATE INDEX `practices_bank_filter_idx` ON `practices` (`exam_type_id`,`subject_id`,`topic_id`,`status`,`is_free`);--> statement-breakpoint
CREATE INDEX `practices_status_publish_idx` ON `practices` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `practices_created_by_idx` ON `practices` (`created_by`);--> statement-breakpoint
CREATE INDEX `question_options_question_idx` ON `question_options` (`question_id`);--> statement-breakpoint
CREATE INDEX `question_options_question_correct_idx` ON `question_options` (`question_id`,`is_correct`);--> statement-breakpoint
CREATE INDEX `questions_subject_status_type_idx` ON `questions` (`subject_id`,`status`,`type`);--> statement-breakpoint
CREATE INDEX `questions_topic_status_idx` ON `questions` (`topic_id`,`status`);--> statement-breakpoint
CREATE INDEX `questions_status_difficulty_idx` ON `questions` (`status`,`difficulty`,`updated_at`);--> statement-breakpoint
CREATE INDEX `questions_created_by_idx` ON `questions` (`created_by`);--> statement-breakpoint
CREATE INDEX `subjects_exam_type_name_idx` ON `subjects` (`exam_type_id`,`name`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_status_ends_at_idx` ON `subscriptions` (`user_id`,`status`,`ends_at`);--> statement-breakpoint
CREATE INDEX `subscriptions_status_ends_at_idx` ON `subscriptions` (`status`,`ends_at`);--> statement-breakpoint
CREATE INDEX `subscriptions_plan_status_idx` ON `subscriptions` (`plan_code`,`status`);--> statement-breakpoint
CREATE INDEX `topics_subject_name_idx` ON `topics` (`subject_id`,`name`);--> statement-breakpoint
CREATE INDEX `tryout_answers_section_grading_idx` ON `tryout_answers` (`tryout_section_session_id`,`grading_status`,`graded_at`);--> statement-breakpoint
CREATE INDEX `tryout_answers_session_grading_idx` ON `tryout_answers` (`tryout_session_id`,`grading_status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `tryout_questions_question_idx` ON `tryout_questions` (`question_id`);--> statement-breakpoint
CREATE INDEX `tryout_section_sessions_session_status_idx` ON `tryout_section_sessions` (`tryout_session_id`,`status`,`started_at`);--> statement-breakpoint
CREATE INDEX `tryout_section_sessions_status_last_saved_idx` ON `tryout_section_sessions` (`status`,`last_saved_at`);--> statement-breakpoint
CREATE INDEX `tryout_section_sessions_section_idx` ON `tryout_section_sessions` (`tryout_section_id`);--> statement-breakpoint
CREATE INDEX `tryout_sections_tryout_order_idx` ON `tryout_sections` (`tryout_id`,`order_index`);--> statement-breakpoint
CREATE INDEX `tryout_sections_subject_idx` ON `tryout_sections` (`subject_id`);--> statement-breakpoint
CREATE INDEX `tryout_session_questions_section_order_idx` ON `tryout_session_questions` (`tryout_section_session_id`,`order_index`);--> statement-breakpoint
CREATE INDEX `tryout_session_questions_question_idx` ON `tryout_session_questions` (`question_id`);--> statement-breakpoint
CREATE INDEX `tryout_sessions_user_tryout_status_idx` ON `tryout_sessions` (`user_id`,`tryout_id`,`status`);--> statement-breakpoint
CREATE INDEX `tryout_sessions_ranking_idx` ON `tryout_sessions` (`tryout_id`,`status`,`total_score`,`total_sections_started`,`total_correct`,`duration_used_seconds`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `tryout_sessions_status_last_saved_idx` ON `tryout_sessions` (`status`,`last_saved_at`);--> statement-breakpoint
CREATE INDEX `tryout_sessions_user_created_at_idx` ON `tryout_sessions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `tryouts_exam_type_status_idx` ON `tryouts` (`exam_type_id`,`status`,`is_free`);--> statement-breakpoint
CREATE INDEX `tryouts_schedule_idx` ON `tryouts` (`status`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX `tryouts_publish_idx` ON `tryouts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `tryouts_created_by_idx` ON `tryouts` (`created_by`);--> statement-breakpoint
CREATE INDEX `user_progress_snapshots_user_exam_idx` ON `user_progress_snapshots` (`user_id`,`exam_type_id`,`subject_id`);--> statement-breakpoint
CREATE INDEX `user_progress_snapshots_user_snapshot_date_idx` ON `user_progress_snapshots` (`user_id`,`snapshot_date`);--> statement-breakpoint
CREATE INDEX `user_sessions_user_validity_idx` ON `user_sessions` (`user_id`,`revoked_at`,`expires_at`);--> statement-breakpoint
CREATE INDEX `user_sessions_expires_at_idx` ON `user_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `users_role_status_idx` ON `users` (`role`,`status`);--> statement-breakpoint
CREATE INDEX `users_status_created_at_idx` ON `users` (`status`,`created_at`);
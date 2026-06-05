CREATE TABLE `email_campaigns` (
  `id` int unsigned AUTO_INCREMENT NOT NULL,
  `subject` varchar(255) NOT NULL,
  `content_html` longtext NOT NULL,
  `content_text` longtext NOT NULL,
  `status` enum('queued','sending','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  `total_recipients` int unsigned NOT NULL DEFAULT 0,
  `sent_count` int unsigned NOT NULL DEFAULT 0,
  `failed_count` int unsigned NOT NULL DEFAULT 0,
  `cancelled_count` int unsigned NOT NULL DEFAULT 0,
  `created_by_admin_id` int unsigned,
  `started_at` timestamp NULL,
  `completed_at` timestamp NULL,
  `cancelled_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`),
  CONSTRAINT `email_campaigns_created_by_admin_id_users_id_fk`
    FOREIGN KEY (`created_by_admin_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE INDEX `email_campaigns_status_created_at_idx`
  ON `email_campaigns` (`status`, `created_at`);
--> statement-breakpoint
CREATE INDEX `email_campaigns_created_by_idx`
  ON `email_campaigns` (`created_by_admin_id`);
--> statement-breakpoint
CREATE TABLE `email_campaign_recipients` (
  `id` int unsigned AUTO_INCREMENT NOT NULL,
  `campaign_id` int unsigned NOT NULL,
  `user_id` int unsigned,
  `email` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` enum('queued','sending','sent','failed','cancelled') NOT NULL DEFAULT 'queued',
  `bull_job_id` varchar(191),
  `attempts` int unsigned NOT NULL DEFAULT 0,
  `last_error` text,
  `sent_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `email_campaign_recipients_id` PRIMARY KEY(`id`),
  CONSTRAINT `email_campaign_recipients_campaign_id_email_campaigns_id_fk`
    FOREIGN KEY (`campaign_id`) REFERENCES `email_campaigns`(`id`),
  CONSTRAINT `email_campaign_recipients_user_id_users_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_campaign_recipients_campaign_user_uq`
  ON `email_campaign_recipients` (`campaign_id`, `user_id`);
--> statement-breakpoint
CREATE INDEX `email_campaign_recipients_campaign_status_idx`
  ON `email_campaign_recipients` (`campaign_id`, `status`);
--> statement-breakpoint
CREATE INDEX `email_campaign_recipients_user_idx`
  ON `email_campaign_recipients` (`user_id`);
--> statement-breakpoint
CREATE INDEX `email_campaign_recipients_bull_job_idx`
  ON `email_campaign_recipients` (`bull_job_id`);

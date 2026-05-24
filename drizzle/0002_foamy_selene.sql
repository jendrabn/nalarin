CREATE TABLE `voucher_redemptions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`voucher_id` int unsigned NOT NULL,
	`user_id` int unsigned NOT NULL,
	`payment_id` int unsigned NOT NULL,
	`original_amount` bigint unsigned NOT NULL,
	`discount_amount` bigint unsigned NOT NULL,
	`final_amount` bigint unsigned NOT NULL,
	`redeemed_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voucher_redemptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `voucher_redemptions_payment_uq` UNIQUE(`payment_id`)
);
--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(64) NOT NULL,
	`starts_at` timestamp NOT NULL,
	`ends_at` timestamp NOT NULL,
	`max_global_usage` int unsigned NOT NULL,
	`max_usage_per_account` int unsigned NOT NULL DEFAULT 1,
	`discount_percent` int unsigned NOT NULL,
	`applies_to_pro` boolean NOT NULL DEFAULT false,
	`applies_to_max` boolean NOT NULL DEFAULT false,
	`is_public` boolean NOT NULL DEFAULT false,
	`promo_label` varchar(255),
	`promo_description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`internal_notes` text,
	`created_by` int unsigned,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vouchers_id` PRIMARY KEY(`id`),
	CONSTRAINT `vouchers_code_uq` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `payments` ADD `voucher_id` int unsigned;--> statement-breakpoint
ALTER TABLE `payments` ADD `voucher_code_snapshot` varchar(64);--> statement-breakpoint
ALTER TABLE `payments` ADD `voucher_name_snapshot` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` ADD `voucher_discount_percent` int unsigned;--> statement-breakpoint
ALTER TABLE `payments` ADD `original_amount` bigint unsigned;--> statement-breakpoint
ALTER TABLE `payments` ADD `discount_amount` bigint unsigned DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `voucher_redemptions` ADD CONSTRAINT `voucher_redemptions_voucher_id_vouchers_id_fk` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `voucher_redemptions` ADD CONSTRAINT `voucher_redemptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `voucher_redemptions` ADD CONSTRAINT `voucher_redemptions_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vouchers` ADD CONSTRAINT `vouchers_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `voucher_redemptions_voucher_user_idx` ON `voucher_redemptions` (`voucher_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `voucher_redemptions_voucher_redeemed_idx` ON `voucher_redemptions` (`voucher_id`,`redeemed_at`);--> statement-breakpoint
CREATE INDEX `voucher_redemptions_user_redeemed_idx` ON `voucher_redemptions` (`user_id`,`redeemed_at`);--> statement-breakpoint
CREATE INDEX `vouchers_public_active_idx` ON `vouchers` (`is_public`,`is_active`,`deleted_at`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX `vouchers_active_period_idx` ON `vouchers` (`is_active`,`deleted_at`,`starts_at`,`ends_at`);--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_voucher_id_vouchers_id_fk` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `payments_voucher_status_idx` ON `payments` (`voucher_id`,`status`,`created_at`);
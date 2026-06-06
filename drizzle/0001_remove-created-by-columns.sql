SET @drop_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = 'email_campaigns'
        AND constraint_name = 'email_campaigns_created_by_admin_id_users_id_fk'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE `email_campaigns` DROP FOREIGN KEY `email_campaigns_created_by_admin_id_users_id_fk`',
    'SELECT 1'
  )
);--> statement-breakpoint
PREPARE drop_fk_statement FROM @drop_fk;--> statement-breakpoint
EXECUTE drop_fk_statement;--> statement-breakpoint
DEALLOCATE PREPARE drop_fk_statement;--> statement-breakpoint

SET @drop_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = 'grammar_questions'
        AND constraint_name = 'grammar_questions_created_by_users_id_fk'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE `grammar_questions` DROP FOREIGN KEY `grammar_questions_created_by_users_id_fk`',
    'SELECT 1'
  )
);--> statement-breakpoint
PREPARE drop_fk_statement FROM @drop_fk;--> statement-breakpoint
EXECUTE drop_fk_statement;--> statement-breakpoint
DEALLOCATE PREPARE drop_fk_statement;--> statement-breakpoint

SET @drop_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = 'materials'
        AND constraint_name = 'materials_created_by_users_id_fk'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE `materials` DROP FOREIGN KEY `materials_created_by_users_id_fk`',
    'SELECT 1'
  )
);--> statement-breakpoint
PREPARE drop_fk_statement FROM @drop_fk;--> statement-breakpoint
EXECUTE drop_fk_statement;--> statement-breakpoint
DEALLOCATE PREPARE drop_fk_statement;--> statement-breakpoint

SET @drop_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = 'practices'
        AND constraint_name = 'practices_created_by_users_id_fk'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE `practices` DROP FOREIGN KEY `practices_created_by_users_id_fk`',
    'SELECT 1'
  )
);--> statement-breakpoint
PREPARE drop_fk_statement FROM @drop_fk;--> statement-breakpoint
EXECUTE drop_fk_statement;--> statement-breakpoint
DEALLOCATE PREPARE drop_fk_statement;--> statement-breakpoint

SET @drop_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = 'questions'
        AND constraint_name = 'questions_created_by_users_id_fk'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE `questions` DROP FOREIGN KEY `questions_created_by_users_id_fk`',
    'SELECT 1'
  )
);--> statement-breakpoint
PREPARE drop_fk_statement FROM @drop_fk;--> statement-breakpoint
EXECUTE drop_fk_statement;--> statement-breakpoint
DEALLOCATE PREPARE drop_fk_statement;--> statement-breakpoint

SET @drop_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = 'tryouts'
        AND constraint_name = 'tryouts_created_by_users_id_fk'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE `tryouts` DROP FOREIGN KEY `tryouts_created_by_users_id_fk`',
    'SELECT 1'
  )
);--> statement-breakpoint
PREPARE drop_fk_statement FROM @drop_fk;--> statement-breakpoint
EXECUTE drop_fk_statement;--> statement-breakpoint
DEALLOCATE PREPARE drop_fk_statement;--> statement-breakpoint

SET @drop_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = 'vocabularies'
        AND constraint_name = 'vocabularies_created_by_users_id_fk'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE `vocabularies` DROP FOREIGN KEY `vocabularies_created_by_users_id_fk`',
    'SELECT 1'
  )
);--> statement-breakpoint
PREPARE drop_fk_statement FROM @drop_fk;--> statement-breakpoint
EXECUTE drop_fk_statement;--> statement-breakpoint
DEALLOCATE PREPARE drop_fk_statement;--> statement-breakpoint

SET @drop_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = 'vouchers'
        AND constraint_name = 'vouchers_created_by_users_id_fk'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE `vouchers` DROP FOREIGN KEY `vouchers_created_by_users_id_fk`',
    'SELECT 1'
  )
);--> statement-breakpoint
PREPARE drop_fk_statement FROM @drop_fk;--> statement-breakpoint
EXECUTE drop_fk_statement;--> statement-breakpoint
DEALLOCATE PREPARE drop_fk_statement;--> statement-breakpoint

ALTER TABLE `email_campaigns` DROP COLUMN `created_by_admin_id`;--> statement-breakpoint
ALTER TABLE `grammar_questions` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `materials` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `practices` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `questions` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `tryouts` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `vocabularies` DROP COLUMN `created_by`;--> statement-breakpoint
ALTER TABLE `vouchers` DROP COLUMN `created_by`;

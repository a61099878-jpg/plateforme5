CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `conventions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`type_stage` text NOT NULL,
	`file_path` text,
	`file_name` text,
	`status` text DEFAULT 'en_attente',
	`generated_at` text DEFAULT (datetime('now', 'localtime')),
	`submitted_at` text,
	`validated_at` text,
	`rejected_at` text,
	`admin_notes` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text,
	`nom` text NOT NULL,
	`telephone` text,
	`filiere` text NOT NULL,
	`annee` integer NOT NULL,
	`code_apogee` text NOT NULL,
	`cne` text NOT NULL,
	`cin` text NOT NULL,
	`date_naissance` text NOT NULL,
	`is_registered` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_email_unique` ON `students` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_code_apogee_unique` ON `students` (`code_apogee`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_cne_unique` ON `students` (`cne`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_cin_unique` ON `students` (`cin`);
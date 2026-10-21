CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `words` ADD `association` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `words` ADD `example` text DEFAULT '' NOT NULL;
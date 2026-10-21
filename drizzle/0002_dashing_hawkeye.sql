CREATE TABLE `pattern_holds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rule` text NOT NULL,
	`attempt_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pattern_holds_rule_idx` ON `pattern_holds` (`rule`);--> statement-breakpoint
ALTER TABLE `errors` ADD `pattern` text;
ALTER TABLE `epics` ADD `position` integer NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE `epics` SET `position` = `id`;--> statement-breakpoint
ALTER TABLE `picks` ADD `position` integer NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE `picks` SET `position` = `id`;

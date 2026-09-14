CREATE TABLE `epics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository` text NOT NULL,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `picks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository` text NOT NULL,
	`feature` text NOT NULL,
	`epic` integer NOT NULL,
	FOREIGN KEY (`epic`) REFERENCES `epics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `a_feature_is_in_at_most_one_epic` ON `picks` (`repository`,`feature`);
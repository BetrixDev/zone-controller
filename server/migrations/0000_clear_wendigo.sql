CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`port` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pins` (
	`id` integer NOT NULL,
	`zone_id` text NOT NULL,
	`associated_color` text NOT NULL,
	PRIMARY KEY(`id`, `zone_id`)
);
--> statement-breakpoint
CREATE TABLE `preset_zones` (
	`zone_id` text NOT NULL,
	`preset_id` text NOT NULL,
	`color` text NOT NULL,
	PRIMARY KEY(`preset_id`, `zone_id`)
);
--> statement-breakpoint
CREATE TABLE `presets` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`display_name` text NOT NULL,
	`type` text DEFAULT 'white' NOT NULL,
	`is_pca9685` integer DEFAULT false NOT NULL,
	`pca_address` integer,
	`enabled` integer DEFAULT true NOT NULL,
	`color` text DEFAULT '#FFFFFF' NOT NULL
);

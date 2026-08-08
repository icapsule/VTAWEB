CREATE TABLE IF NOT EXISTS "big_titles_leaderboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_name" text NOT NULL,
	"country" text DEFAULT 'UNK' NOT NULL,
	"grand_slams" integer DEFAULT 0 NOT NULL,
	"atp_finals" integer DEFAULT 0 NOT NULL,
	"masters_1000" integer DEFAULT 0 NOT NULL,
	"olympics" integer DEFAULT 0 NOT NULL,
	"total_big_titles" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grand_slam_champions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slam_id" text NOT NULL,
	"tour" "tour" NOT NULL,
	"year" integer NOT NULL,
	"champion" text NOT NULL,
	"champ_country" text NOT NULL,
	"runner_up" text NOT NULL,
	"runner_country" text NOT NULL,
	"score" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 CREATE TYPE "ranking_type" AS ENUM('standard', 'race');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tour" AS ENUM('atp', 'wta');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour" "tour" NOT NULL,
	"type" "ranking_type" NOT NULL,
	"rank" integer NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"points" integer NOT NULL,
	"change" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"surface" text NOT NULL,
	"status" text NOT NULL,
	"tour" "tour" NOT NULL,
	"category" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

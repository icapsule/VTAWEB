import { pgTable, text, timestamp, uuid, integer, pgEnum } from "drizzle-orm/pg-core";

export const tourEnum = pgEnum("tour", ["atp", "wta"]);
export const rankingTypeEnum = pgEnum("ranking_type", ["standard", "race"]);

export const rankings = pgTable("rankings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tour: tourEnum("tour").notNull(),
  type: rankingTypeEnum("type").notNull(),
  rank: integer("rank").notNull(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  points: integer("points").notNull(),
  change: integer("change").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tournaments = pgTable("tournaments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  surface: text("surface").notNull(),
  status: text("status").notNull(),
  tour: tourEnum("tour").notNull(),
  category: text("category").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

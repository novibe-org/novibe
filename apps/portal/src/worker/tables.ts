import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const epics = sqliteTable("epics", {
  id: integer().primaryKey({ autoIncrement: true }),
  repository: text().notNull(),
  title: text().notNull(),
});

export const picks = sqliteTable(
  "picks",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    repository: text().notNull(),
    feature: text().notNull(),
    epic: integer()
      .notNull()
      .references(() => epics.id),
  },
  (table) => [uniqueIndex("a_feature_is_in_at_most_one_epic").on(table.repository, table.feature)],
);

import { pgTable, serial, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#000000"),
  imageUrl: varchar("image_url", { length: 500 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  price: integer("price").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  stock: integer("stock").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  whatsappText: text("whatsapp_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 500 }).notNull(),
  alt: varchar("alt", { length: 200 }),
  displayOrder: integer("display_order").default(0).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

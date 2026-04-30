import { db } from "../index";
import { categories } from "../schema";
import { eq } from "drizzle-orm";
import type { CategoryInput } from "@/lib/validations";

export function getAllCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export function getActiveCategories() {
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.name);
}

export function getCategoryById(id: number) {
  return db.select().from(categories).where(eq(categories.id, id)).limit(1);
}

export function createCategory(data: CategoryInput) {
  return db.insert(categories).values(data).returning();
}

export function updateCategory(id: number, data: Partial<CategoryInput>) {
  return db.update(categories).set(data).where(eq(categories.id, id)).returning();
}

export function deleteCategory(id: number) {
  return db.update(categories).set({ active: false }).where(eq(categories.id, id)).returning();
}

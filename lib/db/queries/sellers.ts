import { db } from "../index";
import { sellers } from "../schema";
import { eq } from "drizzle-orm";
import type { SellerInput } from "@/lib/validations";

export function getAllSellers() {
  return db.select().from(sellers).orderBy(sellers.name);
}

export function getActiveSellers() {
  return db.select().from(sellers).where(eq(sellers.active, true)).orderBy(sellers.name);
}

export function getSellerById(id: number) {
  return db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
}

export function createSeller(data: SellerInput) {
  return db.insert(sellers).values(data).returning();
}

export function updateSeller(id: number, data: Partial<SellerInput>) {
  return db.update(sellers).set(data).where(eq(sellers.id, id)).returning();
}

export function deleteSeller(id: number) {
  return db.update(sellers).set({ active: false }).where(eq(sellers.id, id)).returning();
}

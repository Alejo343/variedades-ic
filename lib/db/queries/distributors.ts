import { db } from "../index";
import { distributors } from "../schema";
import { eq } from "drizzle-orm";
import type { DistributorInput } from "@/lib/validations";

export function getAllDistributors() {
  return db.select().from(distributors).orderBy(distributors.name);
}

export function getActiveDistributors() {
  return db.select().from(distributors).where(eq(distributors.active, true)).orderBy(distributors.name);
}

export function getDistributorById(id: number) {
  return db.select().from(distributors).where(eq(distributors.id, id)).limit(1);
}

export function createDistributor(data: DistributorInput) {
  return db.insert(distributors).values(data).returning();
}

export function updateDistributor(id: number, data: Partial<DistributorInput>) {
  return db.update(distributors).set(data).where(eq(distributors.id, id)).returning();
}

export function deleteDistributor(id: number) {
  return db.update(distributors).set({ active: false }).where(eq(distributors.id, id)).returning();
}

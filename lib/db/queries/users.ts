import { db } from "../index";
import { deviceSessions, users } from "../schema";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

// Seller app logins, managed from the seller's detail page (sub-paso 4 of the
// mobile sync). Nothing here ever returns password_hash to the panel.

const publicUserColumns = {
  id: users.id,
  username: users.username,
  name: users.name,
  role: users.role,
  sellerId: users.sellerId,
  active: users.active,
  createdAt: users.createdAt,
};

export function getUserBySellerId(sellerId: number) {
  return db.select(publicUserColumns).from(users).where(eq(users.sellerId, sellerId)).limit(1);
}

export function getUserByUsername(username: string) {
  return db.select(publicUserColumns).from(users).where(eq(users.username, username)).limit(1);
}

export function createSellerUser(data: { sellerId: number; name: string; username: string; passwordHash: string }) {
  return db
    .insert(users)
    .values({ ...data, role: "seller" })
    .returning(publicUserColumns);
}

export function updateSellerUser(sellerId: number, data: { passwordHash?: string; active?: boolean }) {
  return db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(users.sellerId, sellerId), eq(users.role, "seller")))
    .returning(publicUserColumns);
}

export function getDeviceSessions(userId: number) {
  return db
    .select({
      id: deviceSessions.id,
      deviceName: deviceSessions.deviceName,
      createdAt: deviceSessions.createdAt,
      lastSeenAt: deviceSessions.lastSeenAt,
      revokedAt: deviceSessions.revokedAt,
    })
    .from(deviceSessions)
    .where(eq(deviceSessions.userId, userId))
    .orderBy(desc(deviceSessions.lastSeenAt));
}

// Scoped to the seller's own user so a request can't revoke another user's
// device by guessing ids. Revoking twice is a no-op (keeps the first date).
export function revokeSellerDeviceSession(sellerId: number, sessionId: number) {
  return db
    .update(deviceSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(deviceSessions.id, sessionId),
        isNull(deviceSessions.revokedAt),
        inArray(deviceSessions.userId, db.select({ id: users.id }).from(users).where(eq(users.sellerId, sellerId))),
      ),
    )
    .returning({ id: deviceSessions.id });
}

// The owner's own login (/admin/account). The hash only leaves this file to
// be compared, never returned to the panel.
export function getOwnerCredentials(username: string) {
  return db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(and(eq(users.username, username), eq(users.role, "owner"), eq(users.active, true)))
    .limit(1);
}

export function updateOwnerPassword(userId: number, passwordHash: string) {
  return db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.role, "owner")))
    .returning({ id: users.id });
}

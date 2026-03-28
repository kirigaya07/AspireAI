import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

/**
 * Syncs the Clerk-authenticated user with the database.
 * Uses upsert to eliminate race conditions on concurrent first-logins.
 * Creates an initial token transaction for new users as an audit trail.
 */
export const checkUser = async () => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const email = user.emailAddresses[0]?.emailAddress || "";

    // upsert: create if not exists, no-op update if already exists
    // Eliminates the findUnique → create race condition
    const dbUser = await db.user.upsert({
      where: { clerkUserId: user.id },
      update: {}, // intentionally empty — don't overwrite user edits on every login
      create: {
        clerkUserId: user.id,
        name: name || email || "User",
        imageUrl: user.imageUrl,
        email,
      },
    });

    // Create the signup bonus transaction if this user has no history yet.
    // Gives every new account a proper audit trail for their 10,000 free tokens.
    const txCount = await db.tokenTransaction.count({
      where: { userId: dbUser.id },
    });

    if (txCount === 0) {
      await db.tokenTransaction.create({
        data: {
          userId: dbUser.id,
          amount: 10000,
          description: "Welcome bonus — 10,000 free tokens on signup",
          featureType: "signup_bonus",
        },
      });
    }

    return dbUser;
  } catch (error) {
    console.error("[checkUser] Error:", error.message);
    return null;
  }
};

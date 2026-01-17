"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

/**
 * Get the authenticated user from the database
 * @throws {Error} If user is not authenticated or not found
 * @returns {Promise<Object>} The user object from the database
 */
export async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Get the authenticated user with optional relations
 * @param {Object} options - Query options
 * @param {Object} options.include - Prisma include options
 * @param {Object} options.select - Prisma select options
 * @throws {Error} If user is not authenticated or not found
 * @returns {Promise<Object>} The user object from the database
 */
export async function getAuthenticatedUserWith(options = {}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    ...options,
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

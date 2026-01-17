import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

/**
 * Checks if the currently authenticated user exists in the database.
 * If the user does not exist, creates a new user record in the database.
 *
 * @returns {Promise<Object|null>} The logged-in user from the database or null if no user is found.
 */
export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    // Check if the user already exists in the database using their Clerk user ID
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    // Construct the full name by combining the first and last names
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    // If the user does not exist, create a new user record in the database
    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name: name || user.emailAddresses[0]?.emailAddress || "User",
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress || "",
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error checking/creating user:", error.message);
    return null;
  }
};

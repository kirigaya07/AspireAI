"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser, getAuthenticatedUserWith } from "@/lib/auth-utils";
import { generateAIInsights } from "./dashboard";

/**
 * Updates the user's profile information and ensures the industry insight record exists.
 * Uses a database transaction to maintain consistency between user updates and industry insights.
 *
 * @param {Object} data - The updated user profile data.
 * @param {string} data.industry - The user's selected industry.
 * @param {number} data.experience - The user's years of experience.
 * @param {string} data.bio - The user's bio.
 * @param {string[]} data.skills - The user's skills.
 * @throws {Error} If the user is not authenticated, not found, or if the update fails.
 * @returns {Promise<{ updateUser: Object, industryInsight: Object }>} Updated user and industry insight records.
 */
export async function updateUser(data) {
  const user = await getAuthenticatedUser();

  try {
    // Perform database operations within a transaction to ensure data consistency.
    const result = await db.$transaction(
      async (tx) => {
        // Check if an industry insight record already exists for the given industry.
        let industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: data.industry,
          },
        });

        // If no industry insight exists, create a new one with default values.
        if (!industryInsight) {
          const insights = await generateAIInsights(data.industry);

          industryInsight = await db.industryInsight.create({
            data: {
              industry: data.industry,
              ...insights,
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }

        // Update the user's profile with the provided data.
        const updateUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });

        return { updateUser, industryInsight }; // Return the updated user and industry insight data.
      },
      {
        timeout: 10000, // Set a transaction timeout of 10 seconds.
      }
    );

    return { success: true, ...result }; // Return the final transaction result.
  } catch (error) {
    console.error("Error updating user and industry", error.message);
    throw new Error("Failed to update profile"); // Throw a user-friendly error message.
  }
}

/**
 * Retrieves the onboarding status of the currently authenticated user.
 * The user is considered onboarded if they have an assigned industry.
 *
 * @throws {Error} If the user is not authenticated, not found, or if the database query fails.
 * @returns {Promise<{ isOnboarded: boolean }>} An object indicating whether the user is onboarded.
 */
export async function getUserOnboardingStatus() {
  try {
    const user = await getAuthenticatedUserWith({
      select: { industry: true },
    });

    return {
      isOnboarded: !!user.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
}

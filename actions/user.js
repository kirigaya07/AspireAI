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
    // Check if industry insight already exists BEFORE opening a transaction.
    // generateAIInsights is an AI call that can take 10–30s — running it inside
    // a transaction would time out the 10s limit.
    let existingInsight = await db.industryInsight.findUnique({
      where: { industry: data.industry },
    });

    // If missing, generate and persist it outside the transaction.
    if (!existingInsight) {
      const insights = await generateAIInsights(data.industry);
      // Use upsert in case a concurrent request created it while we were generating.
      existingInsight = await db.industryInsight.upsert({
        where: { industry: data.industry },
        update: {},
        create: {
          industry: data.industry,
          ...insights,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Now run a fast, focused transaction — only DB writes, no AI calls.
    const result = await db.$transaction(
      async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });
        return { updateUser: updatedUser, industryInsight: existingInsight };
      },
      { timeout: 10000 }
    );

    return { success: true, ...result };
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error("Failed to update profile");
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

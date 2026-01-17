"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUserWith } from "@/lib/auth-utils";

/**
 * Check if user has enough tokens
 * @param {number} tokensNeeded - Number of tokens required
 * @returns {Promise<boolean>} True if user has enough tokens
 */
export async function hasEnoughTokens(tokensNeeded = 1) {
  const user = await getAuthenticatedUserWith({
    select: { id: true, tokens: true },
  });

  return user.tokens >= tokensNeeded;
}

/**
 * Consume tokens for an operation and record the transaction
 * @param {number} tokensToConsume - Number of tokens to consume
 * @param {string} description - Description of the transaction
 * @param {string} featureType - Type of feature using tokens
 * @returns {Promise<Object>} Result with success status and remaining tokens
 */
export async function consumeTokens(tokensToConsume, description, featureType) {
  const user = await getAuthenticatedUserWith({
    select: { id: true, tokens: true },
  });

  if (user.tokens < tokensToConsume) {
    throw new Error("Insufficient tokens");
  }

  // Update user tokens and record transaction in a single transaction
  const result = await db.$transaction([
    // Decrement user tokens
    db.user.update({
      where: { id: user.id },
      data: { tokens: { decrement: tokensToConsume } },
    }),

    // Record the transaction
    db.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: -tokensToConsume,
        description,
        featureType,
      },
    }),
  ]);

  return {
    success: true,
    remainingTokens: result[0].tokens,
  };
}

/**
 * Add tokens to user account and record the transaction
 * @param {number} tokensToAdd - Number of tokens to add
 * @param {string} description - Description of the transaction
 * @returns {Promise<Object>} Result with success status and new balance
 */
export async function addTokens(tokensToAdd, description = "Token Purchase") {
  const user = await getAuthenticatedUserWith({
    select: { id: true },
  });

  // Update user tokens and record transaction in a single transaction
  const result = await db.$transaction([
    // Increment user tokens
    db.user.update({
      where: { id: user.id },
      data: { tokens: { increment: tokensToAdd } },
    }),

    // Record the transaction
    db.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: tokensToAdd,
        description,
        featureType: "purchase",
      },
    }),
  ]);

  return {
    success: true,
    newBalance: result[0].tokens,
  };
}

/**
 * Get user's current token balance
 * @returns {Promise<number>} Current token balance
 */
export async function getTokenBalance() {
  const user = await getAuthenticatedUserWith({
    select: { tokens: true },
  });

  return user.tokens;
}

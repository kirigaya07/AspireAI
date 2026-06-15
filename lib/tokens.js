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
    select: { id: true },
  });

  // Decrement and record in one transaction. The decrement is guarded by a
  // `tokens >= cost` condition so concurrent calls can't drive the balance
  // negative (the pre-check + decrement would otherwise be a TOCTOU race).
  const remainingTokens = await db.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: user.id, tokens: { gte: tokensToConsume } },
      data: { tokens: { decrement: tokensToConsume } },
    });

    if (count === 0) {
      throw new Error("Insufficient tokens");
    }

    await tx.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: -tokensToConsume,
        description,
        featureType,
      },
    });

    const updated = await tx.user.findUnique({
      where: { id: user.id },
      select: { tokens: true },
    });

    return updated.tokens;
  });

  return {
    success: true,
    remainingTokens,
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

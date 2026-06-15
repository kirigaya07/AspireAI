"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser, getAuthenticatedUserWith } from "@/lib/auth-utils";
import { TOKEN_PACKAGES } from "@/lib/constants";

/**
 * Get available token packages
 * @returns {Promise<Array>} Array of token packages
 */
export async function getTokenPackages() {
  return TOKEN_PACKAGES;
}

/**
 * Get user's payment history
 * @returns {Promise<Array>} Array of payment objects
 */
export async function getPaymentHistory(limit = 20) {
  const user = await getAuthenticatedUser();

  try {
    const payments = await db.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return payments;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw new Error("Failed to fetch payments");
  }
}

/**
 * Get user's token information including balance and packages
 * @returns {Promise<Object>} Object with tokens and packages
 */
export async function getUserTokenInfo() {
  const user = await getAuthenticatedUserWith({
    select: { tokens: true },
  });

  const packages = await getTokenPackages();

  return {
    tokens: user.tokens ?? 0,
    packages,
  };
}

/**
 * Get token transaction history
 * @param {number} limit - Maximum number of transactions to return (default: 50)
 * @returns {Promise<Array>} Array of transaction objects
 */
export async function getTokenTransactionHistory(limit = 50) {
  const user = await getAuthenticatedUser();

  try {
    const transactions = await db.tokenTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Failed to fetch transactions");
  }
}

// recordSuccessfulPayment lives in lib/payments.js (a plain module, not a
// "use server" action) so it is never exposed as a client-callable RPC. It must
// only be invoked from trusted server contexts that have already verified the
// payment with Razorpay.

// getTokenTransactions is an alias for getTokenTransactionHistory for backwards compatibility
export const getTokenTransactions = getTokenTransactionHistory;

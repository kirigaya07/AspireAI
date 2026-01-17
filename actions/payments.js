"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser, getAuthenticatedUserWith } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { TOKEN_PACKAGES, getPackageById } from "@/lib/constants";

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
export async function getPaymentHistory() {
  const user = await getAuthenticatedUser();

  try {
    const payments = await db.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
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
  try {
    const user = await getAuthenticatedUserWith({
      select: { tokens: true },
    });

    const packages = await getTokenPackages();

    return {
      tokens: user.tokens || 10000,
      packages,
    };
  } catch (error) {
    console.error("Error fetching user token info:", error);
    // Return mock data if there's an error
    return {
      tokens: 10000,
      packages: await getTokenPackages(),
    };
  }
}

/**
 * Get token transaction history
 * @param {number} limit - Maximum number of transactions to return
 * @returns {Promise<Array>} Array of transaction objects
 */
export async function getTokenTransactionHistory(limit = 5) {
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

/**
 * Record successful payment and add tokens to user account
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} packageId - Package ID
 * @param {string} userId - User ID (for security verification)
 * @param {number} amount - Payment amount in rupees (for validation)
 * @returns {Promise<Object>} Success response
 */
export async function recordSuccessfulPayment(
  orderId,
  paymentId,
  packageId,
  userId,
  amount
) {
  const tokenPackage = getPackageById(packageId);
  if (!tokenPackage) {
    throw new Error("Invalid package");
  }

  // Validate amount matches package
  if (Math.abs(amount - tokenPackage.amount) > 0.01) {
    console.error("Amount mismatch", {
      expected: tokenPackage.amount,
      received: amount,
      orderId,
      paymentId,
      userId,
    });
    throw new Error("Payment amount does not match package");
  }

  // Find payment record by order ID
  const payment = await db.payment.findUnique({
    where: { razorpayId: orderId },
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  // CRITICAL: Verify payment belongs to the authenticated user
  if (payment.userId !== userId) {
    console.error("Payment ownership mismatch", {
      paymentUserId: payment.userId,
      authenticatedUserId: userId,
      orderId,
      paymentId,
    });
    throw new Error("Payment does not belong to authenticated user");
  }

  // Verify payment amount matches
  if (Math.abs(payment.amount - tokenPackage.amount) > 0.01) {
    console.error("Payment amount mismatch in database", {
      dbAmount: payment.amount,
      packageAmount: tokenPackage.amount,
      orderId,
      paymentId,
    });
    throw new Error("Payment amount mismatch");
  }

  // Check if already processed (prevent duplicate processing)
  if (payment.status === "COMPLETED") {
    console.warn("Payment already processed", {
      orderId,
      paymentId,
      userId,
    });
    return { success: true, message: "Payment already processed" };
  }

  // Use database transaction with timeout to prevent race conditions
  try {
    await db.$transaction(
      async (tx) => {
        // Double-check status within transaction (prevent race condition)
        const currentPayment = await tx.payment.findUnique({
          where: { id: payment.id },
          select: { status: true },
        });

        if (currentPayment.status === "COMPLETED") {
          throw new Error("Payment already processed");
        }

        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            // Store payment ID for better tracking
            razorpayPaymentId: paymentId,
          },
        });

        // Add tokens to user
        await tx.user.update({
          where: { id: userId },
          data: { tokens: { increment: tokenPackage.tokens } },
        });

        // Record token transaction
        await tx.tokenTransaction.create({
          data: {
            userId: userId,
            amount: tokenPackage.tokens,
            description: `Purchased ${tokenPackage.description} (Order: ${orderId})`,
            featureType: "purchase",
          },
        });
      },
      {
        timeout: 10000, // 10 second timeout
        isolationLevel: "Serializable", // Highest isolation level to prevent race conditions
      }
    );

    revalidatePath("/tokens");

    return {
      success: true,
      message: "Payment processed successfully",
      tokensAdded: tokenPackage.tokens,
    };
  } catch (error) {
    console.error("Error processing payment transaction:", error);
    throw error;
  }
}

/**
 * Get user's token transaction history
 * @returns {Promise<Array>} Array of transaction objects
 */
export async function getTokenTransactions() {
  try {
    const user = await getAuthenticatedUserWith({
      select: { id: true },
    });

    // Get the user's token transactions
    const transactions = await db.tokenTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to most recent 50 transactions
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching token transactions:", error);
    return [];
  }
}

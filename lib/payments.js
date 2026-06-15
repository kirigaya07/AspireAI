import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getPackageById } from "@/lib/constants";

/**
 * Record a successful payment and credit tokens to the user.
 *
 * SECURITY: This is intentionally NOT a "use server" action. It trusts its
 * arguments (e.g. that the payment was genuinely captured), so it must only be
 * called from trusted server contexts that have already verified the payment
 * with Razorpay — the verify route (signature + API check), the signed webhook,
 * and the reconciliation job. Exposing it as a client-callable RPC would let a
 * user mint free tokens by forging a paymentId for one of their pending orders.
 *
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} packageId - Package ID
 * @param {string} userId - User ID the payment belongs to
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

  // CRITICAL: Verify payment belongs to the expected user
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

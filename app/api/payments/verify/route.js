import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";
import { recordSuccessfulPayment } from "@/actions/payments";

/**
 * Verify Razorpay payment signature and process payment
 * POST /api/payments/verify
 * 
 * Security measures:
 * 1. Signature verification using HMAC SHA256
 * 2. Payment ownership verification (payment belongs to authenticated user)
 * 3. Amount validation (payment amount matches package)
 * 4. Razorpay API verification (verify payment status with Razorpay)
 * 5. Duplicate payment prevention
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      packageId,
    } = await request.json();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !packageId) {
      return NextResponse.json(
        { error: "Missing required payment information" },
        { status: 400 }
      );
    }

    // Step 1: Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Invalid payment signature", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Step 2: Verify payment with Razorpay API
    let razorpayPayment;
    try {
      razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (error) {
      console.error("Error fetching payment from Razorpay:", error);
      return NextResponse.json(
        { error: "Failed to verify payment with Razorpay" },
        { status: 500 }
      );
    }

    // Step 3: Verify payment status
    if (razorpayPayment.status !== "captured" && razorpayPayment.status !== "authorized") {
      console.error("Payment not captured", {
        paymentId: razorpay_payment_id,
        status: razorpayPayment.status,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Step 4: Verify payment belongs to the order
    if (razorpayPayment.order_id !== razorpay_order_id) {
      console.error("Payment order mismatch", {
        paymentId: razorpay_payment_id,
        paymentOrderId: razorpayPayment.order_id,
        expectedOrderId: razorpay_order_id,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Payment order mismatch" },
        { status: 400 }
      );
    }

    // Step 5: Record the successful payment (with additional security checks)
    await recordSuccessfulPayment(
      razorpay_order_id,
      razorpay_payment_id,
      packageId,
      user.id,
      razorpayPayment.amount / 100 // Convert from paise to rupees
    );

    return NextResponse.json({
      success: true,
      message: "Payment verified and processed successfully",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getPackageById } from "@/lib/constants";

/**
 * Create a Razorpay payment order
 * POST /api/payments/create-order
 * 
 * Security measures:
 * 1. User authentication required
 * 2. Package validation
 * 3. Amount validation
 * 4. Prevents duplicate pending orders for same user
 */
export async function POST(request) {
  try {
    // Step 1: Authenticate user
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

    // Step 2: Validate request body
    const body = await request.json();
    const { packageId } = body;

    if (!packageId || typeof packageId !== "string") {
      return NextResponse.json(
        { error: "Invalid package ID" },
        { status: 400 }
      );
    }

    // Step 3: Validate package
    const tokenPackage = getPackageById(packageId);
    if (!tokenPackage) {
      return NextResponse.json(
        { error: "Invalid package selected" },
        { status: 400 }
      );
    }

    // Step 4: Validate amount (prevent tampering)
    if (!tokenPackage.amount || tokenPackage.amount <= 0) {
      console.error("Invalid package amount", {
        packageId,
        amount: tokenPackage.amount,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Invalid package configuration" },
        { status: 500 }
      );
    }

    // Step 5: Check for existing pending orders (prevent duplicate orders)
    const existingPendingPayment = await db.payment.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingPendingPayment) {
      // Return existing order instead of creating a new one
      return NextResponse.json({
        orderId: existingPendingPayment.razorpayId,
        amount: existingPendingPayment.amount * 100, // Convert to paise
        currency: existingPendingPayment.currency || "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        message: "Using existing pending order",
      });
    }

    // Step 6: Create Razorpay order
    let order;
    try {
      order = await razorpay.orders.create({
        amount: Math.round(tokenPackage.amount * 100), // Amount in paise (ensure integer)
        currency: "INR",
        receipt: `receipt_${user.id}_${Date.now()}`,
        notes: {
          userId: user.id,
          packageId: tokenPackage.id,
          tokens: tokenPackage.tokens.toString(),
        },
      });
    } catch (razorpayError) {
      console.error("Razorpay API error:", razorpayError);
      return NextResponse.json(
        { error: "Failed to create payment order with Razorpay" },
        { status: 500 }
      );
    }

    // Step 7: Create a pending payment record in database
    try {
      await db.payment.create({
        data: {
          userId: user.id,
          amount: tokenPackage.amount,
          currency: "INR",
          razorpayId: order.id,
          tokensAdded: tokenPackage.tokens,
          status: "PENDING",
        },
      });
    } catch (dbError) {
      console.error("Database error creating payment record:", dbError);
      // If database fails, we should ideally cancel the Razorpay order
      // For now, log the error and return the order (Razorpay will handle it)
      console.warn("Payment record creation failed, but Razorpay order created", {
        orderId: order.id,
        userId: user.id,
      });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Unexpected error creating payment order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}

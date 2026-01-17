import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";
import { recordSuccessfulPayment } from "@/actions/payments";

/**
 * Razorpay Webhook Handler
 * POST /api/payments/webhook
 * 
 * This endpoint receives webhook events from Razorpay.
 * Webhooks are more secure than client-side verification as they come directly from Razorpay.
 * 
 * Security measures:
 * 1. Webhook signature verification using HMAC SHA256
 * 2. Payment status verification with Razorpay API
 * 3. Idempotency handling (prevent duplicate processing)
 * 4. Payment ownership verification
 * 5. Amount validation
 * 
 * To configure in Razorpay Dashboard:
 * - Go to Settings > Webhooks
 * - Add webhook URL: https://yourdomain.com/api/payments/webhook
 * - Select events: payment.captured, payment.failed
 * - Copy the webhook secret to RAZORPAY_WEBHOOK_SECRET env variable
 */
export async function POST(request) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("Missing webhook signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle payment.captured event
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const order = event.payload.payment.entity.order_id;

      try {
        // Fetch order details from Razorpay to get notes
        const razorpayOrder = await razorpay.orders.fetch(order);
        const notes = razorpayOrder.notes || {};

        if (!notes.userId || !notes.packageId) {
          console.error("Missing order notes", {
            orderId: order,
            paymentId: payment.id,
          });
          return NextResponse.json(
            { error: "Invalid order data" },
            { status: 400 }
          );
        }

        // Verify payment with Razorpay API
        const razorpayPayment = await razorpay.payments.fetch(payment.id);

        if (razorpayPayment.status !== "captured") {
          console.warn("Payment not captured", {
            paymentId: payment.id,
            status: razorpayPayment.status,
          });
          return NextResponse.json({ success: true, message: "Payment not captured yet" });
        }

        // Process payment
        await recordSuccessfulPayment(
          order,
          payment.id,
          notes.packageId,
          notes.userId,
          razorpayPayment.amount / 100 // Convert from paise to rupees
        );

        console.log("Webhook payment processed successfully", {
          orderId: order,
          paymentId: payment.id,
          userId: notes.userId,
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("Error processing webhook payment:", error);
        // Return 200 to prevent Razorpay from retrying immediately
        // Log the error for manual investigation
        return NextResponse.json(
          { error: "Error processing payment", message: error.message },
          { status: 200 }
        );
      }
    }

    // Handle payment.failed event
    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      try {
        // Update payment status to FAILED
        await db.payment.updateMany({
          where: {
            razorpayId: orderId,
            status: "PENDING",
          },
          data: {
            status: "FAILED",
          },
        });

        console.log("Payment marked as failed", {
          orderId,
          paymentId: payment.id,
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("Error updating failed payment:", error);
        return NextResponse.json({ success: true }); // Return 200 to acknowledge webhook
      }
    }

    // Acknowledge other events
    return NextResponse.json({ success: true, message: "Event received" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhook (we need raw body for signature verification)
export const runtime = "nodejs";

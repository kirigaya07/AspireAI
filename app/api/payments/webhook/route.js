import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";
import { recordSuccessfulPayment } from "@/actions/payments";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  // ── 1. Signature must be present ─────────────────────────────
  if (!signature) {
    console.error("[webhook] Missing signature");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // ── 2. Verify HMAC signature ──────────────────────────────────
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (expected !== signature) {
    console.error("[webhook] Invalid signature — possible spoofing attempt");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── 3. payment.captured ───────────────────────────────────────
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;

    // Idempotency: skip if this exact payment was already processed
    const alreadyProcessed = await db.webhookEvent.findUnique({
      where: { eventId: paymentId },
    });
    if (alreadyProcessed) {
      console.log(`[webhook] Already processed payment ${paymentId}, skipping`);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    try {
      // Fetch order notes (userId + packageId stored at order creation)
      const razorpayOrder = await razorpay.orders.fetch(orderId);
      const notes = razorpayOrder.notes || {};

      if (!notes.userId || !notes.packageId) {
        console.error("[webhook] Missing order notes", { orderId, paymentId });
        // Mark as processed so we don't retry endlessly — needs manual intervention
        await db.webhookEvent.create({
          data: { eventId: paymentId, eventType: event.event, success: false, errorMsg: "Missing order notes" },
        });
        return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
      }

      // Verify payment is actually captured with Razorpay API
      const razorpayPayment = await razorpay.payments.fetch(paymentId);
      if (razorpayPayment.status !== "captured") {
        console.warn(`[webhook] Payment ${paymentId} not captured (status: ${razorpayPayment.status})`);
        return NextResponse.json({ success: true, message: "Payment not captured yet" });
      }

      // Process — recordSuccessfulPayment is idempotent via Serializable transaction
      await recordSuccessfulPayment(
        orderId,
        paymentId,
        notes.packageId,
        notes.userId,
        razorpayPayment.amount / 100
      );

      // Mark event as processed
      await db.webhookEvent.create({
        data: { eventId: paymentId, eventType: event.event, success: true },
      });

      console.log(`[webhook] Payment ${paymentId} processed for user ${notes.userId}`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[webhook] Error processing payment.captured:", error);
      // Return 500 so Razorpay retries — only do this for transient errors
      // If it's a business logic error (already processed, ownership mismatch), swallow it
      const isTransient = !(
        error.message?.includes("already processed") ||
        error.message?.includes("does not belong") ||
        error.message?.includes("amount mismatch")
      );
      if (isTransient) {
        return NextResponse.json({ error: "Transient error, will retry" }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "Non-retryable error" });
    }
  }

  // ── 4. payment.failed ─────────────────────────────────────────
  if (event.event === "payment.failed") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;

    try {
      await db.payment.updateMany({
        where: { razorpayId: orderId, status: "PENDING" },
        data: { status: "FAILED" },
      });
      console.log(`[webhook] Payment failed for order ${orderId}`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[webhook] Error marking payment as failed:", error);
      return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 });
    }
  }

  // Acknowledge all other events
  return NextResponse.json({ success: true, message: "Event acknowledged" });
}

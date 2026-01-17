-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "razorpayPaymentId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_razorpayPaymentId_idx" ON "Payment"("razorpayPaymentId");

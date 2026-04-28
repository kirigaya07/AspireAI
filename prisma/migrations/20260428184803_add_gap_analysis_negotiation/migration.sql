-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "gapAnalysis" JSONB;

-- CreateTable
CREATE TABLE "NegotiationSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT,
    "offerDetails" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NegotiationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NegotiationSession_userId_idx" ON "NegotiationSession"("userId");

-- CreateIndex
CREATE INDEX "NegotiationMessage_sessionId_idx" ON "NegotiationMessage"("sessionId");

-- AddForeignKey
ALTER TABLE "NegotiationSession" ADD CONSTRAINT "NegotiationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationMessage" ADD CONSTRAINT "NegotiationMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NegotiationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

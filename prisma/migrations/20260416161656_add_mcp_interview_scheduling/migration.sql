-- AlterTable
ALTER TABLE "InterviewInvite" ADD COLUMN "emailDeliveryStatus" TEXT;
ALTER TABLE "InterviewInvite" ADD COLUMN "mcpEventId" TEXT;
ALTER TABLE "InterviewInvite" ADD COLUMN "mcpTrace" TEXT;
ALTER TABLE "InterviewInvite" ADD COLUMN "meetingUrl" TEXT;
ALTER TABLE "InterviewInvite" ADD COLUMN "scheduledEnd" DATETIME;
ALTER TABLE "InterviewInvite" ADD COLUMN "scheduledStart" DATETIME;
ALTER TABLE "InterviewInvite" ADD COLUMN "timezone" TEXT;

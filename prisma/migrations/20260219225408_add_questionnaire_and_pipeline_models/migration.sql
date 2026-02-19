/*
  Warnings:

  - You are about to drop the column `keyRisks` on the `DecisionPacket` table. All the data in the column will be lost.
  - You are about to drop the column `questions` on the `DecisionPacket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "aiFindings" TEXT,
ADD COLUMN     "proposedBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "questionnaireSentAt" TIMESTAMP(3),
ADD COLUMN     "questionnaireStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
ADD COLUMN     "questionnaireSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "shortlistedAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "justification" TEXT;

-- AlterTable
ALTER TABLE "DecisionPacket" DROP COLUMN "keyRisks",
DROP COLUMN "questions",
ADD COLUMN     "executiveSummary" TEXT,
ADD COLUMN     "impactAssessment" TEXT,
ADD COLUMN     "questionsForContractor" TEXT,
ADD COLUMN     "risks" TEXT,
ADD COLUMN     "strengths" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "businessCategories" TEXT,
ADD COLUMN     "certifications" TEXT;

-- AlterTable
ALTER TABLE "RFP" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "questionnaireConfig" TEXT;

-- CreateTable
CREATE TABLE "QuestionnaireQuestion" (
    "id" TEXT NOT NULL,
    "rfpId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "options" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnaireQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireResponse" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "responseText" TEXT,
    "filePath" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireEvaluation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "internalNotes" TEXT,
    "internalScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireEvaluation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuestionnaireQuestion" ADD CONSTRAINT "QuestionnaireQuestion_rfpId_fkey" FOREIGN KEY ("rfpId") REFERENCES "RFP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireResponse" ADD CONSTRAINT "QuestionnaireResponse_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireResponse" ADD CONSTRAINT "QuestionnaireResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionnaireQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireEvaluation" ADD CONSTRAINT "QuestionnaireEvaluation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireEvaluation" ADD CONSTRAINT "QuestionnaireEvaluation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionnaireQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireEvaluation" ADD CONSTRAINT "QuestionnaireEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "auth_codes" ADD COLUMN     "codeChallenge" TEXT,
ADD COLUMN     "codeChallengeMethod" TEXT;

-- Create InvitationStatus enum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- Create invitations table
CREATE TABLE "invitations" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "role" "TenantRole" NOT NULL DEFAULT 'SCOUT',
  "token" TEXT NOT NULL,
  "invitedBy" TEXT,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),

  CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on token
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- Create indexes for performance
CREATE INDEX "invitations_email_idx" ON "invitations"("email");
CREATE INDEX "invitations_tenantId_idx" ON "invitations"("tenantId");
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- Add foreign key constraint to tenants
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
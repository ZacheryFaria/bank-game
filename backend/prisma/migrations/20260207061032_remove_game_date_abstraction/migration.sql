/*
  Warnings:

  - You are about to drop the column `game_quarters_elapsed` on the `collections` table. All the data in the column will be lost.
  - You are about to drop the column `game_time_end` on the `collections` table. All the data in the column will be lost.
  - You are about to drop the column `game_time_start` on the `collections` table. All the data in the column will be lost.
  - You are about to drop the column `collected_at` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `quarterly_snapshots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "quarterly_snapshots" DROP CONSTRAINT "quarterly_snapshots_bank_id_fkey";

-- DropIndex
DROP INDEX "idx_transactions_collected";

-- AlterTable
ALTER TABLE "collections" DROP COLUMN "game_quarters_elapsed",
DROP COLUMN "game_time_end",
DROP COLUMN "game_time_start";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "collected_at";

-- DropTable
DROP TABLE "quarterly_snapshots";

-- CreateTable
CREATE TABLE "snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_id" UUID NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "total_assets" DECIMAL(18,2) NOT NULL,
    "total_loans" DECIMAL(18,2) NOT NULL,
    "loan_loss_reserve" DECIMAL(18,2) NOT NULL,
    "cash_and_reserves" DECIMAL(18,2) NOT NULL,
    "total_deposits" DECIMAL(18,2) NOT NULL,
    "total_liabilities" DECIMAL(18,2) NOT NULL,
    "total_equity" DECIMAL(18,2) NOT NULL,
    "interest_income" DECIMAL(18,2) NOT NULL,
    "interest_expense" DECIMAL(18,2) NOT NULL,
    "net_interest_income" DECIMAL(18,2) NOT NULL,
    "provision_for_losses" DECIMAL(18,2) NOT NULL,
    "operating_expenses" DECIMAL(18,2) NOT NULL,
    "net_income" DECIMAL(18,2) NOT NULL,
    "capital_ratio" DECIMAL(5,4) NOT NULL,
    "net_interest_margin" DECIMAL(5,4) NOT NULL,
    "return_on_equity" DECIMAL(5,4) NOT NULL,
    "default_rate" DECIMAL(5,4) NOT NULL,
    "portfolio_by_product" JSONB NOT NULL,
    "portfolio_by_risk_class" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snapshots_bank_id_period_end_key" ON "snapshots"("bank_id", "period_end");

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

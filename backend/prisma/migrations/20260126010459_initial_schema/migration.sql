-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "refresh_token_hash" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_collected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_equity" DECIMAL(18,2) NOT NULL DEFAULT 200000.00,
    "current_loans" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "current_deposits" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_rates" (
    "bank_id" UUID NOT NULL,
    "product" VARCHAR(20) NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_rates_pkey" PRIMARY KEY ("bank_id","product")
);

-- CreateTable
CREATE TABLE "bank_allocation" (
    "bank_id" UUID NOT NULL,
    "risk_class" VARCHAR(20) NOT NULL,
    "percentage" DECIMAL(5,4) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_allocation_pkey" PRIMARY KEY ("bank_id","risk_class")
);

-- CreateTable
CREATE TABLE "loan_buckets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_id" UUID NOT NULL,
    "product" VARCHAR(20) NOT NULL,
    "risk_class" VARCHAR(20) NOT NULL,
    "origination_hour" TIMESTAMPTZ(6) NOT NULL,
    "original_principal" DECIMAL(18,2) NOT NULL,
    "current_balance" DECIMAL(18,2) NOT NULL,
    "interest_rate" DECIMAL(5,4) NOT NULL,
    "loan_count" INTEGER NOT NULL,
    "active_loan_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_buckets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_id" UUID NOT NULL,
    "product" VARCHAR(20) NOT NULL,
    "origination_hour" TIMESTAMPTZ(6) NOT NULL,
    "original_amount" DECIMAL(18,2) NOT NULL,
    "current_balance" DECIMAL(18,2) NOT NULL,
    "interest_rate" DECIMAL(5,4) NOT NULL,
    "maturity_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "collected_at" TIMESTAMPTZ(6) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "loan_bucket_id" UUID,
    "deposit_bucket_id" UUID,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_id" UUID NOT NULL,
    "collected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "game_time_start" TIMESTAMPTZ(6) NOT NULL,
    "game_time_end" TIMESTAMPTZ(6) NOT NULL,
    "real_hours_elapsed" DECIMAL(10,4) NOT NULL,
    "game_quarters_elapsed" DECIMAL(10,4) NOT NULL,
    "loans_originated" DECIMAL(18,2) NOT NULL,
    "interest_income" DECIMAL(18,2) NOT NULL,
    "interest_expense" DECIMAL(18,2) NOT NULL,
    "default_losses" DECIMAL(18,2) NOT NULL,
    "operating_expenses" DECIMAL(18,2) NOT NULL,
    "net_income" DECIMAL(18,2) NOT NULL,
    "ending_equity" DECIMAL(18,2) NOT NULL,
    "ending_loans" DECIMAL(18,2) NOT NULL,
    "ending_deposits" DECIMAL(18,2) NOT NULL,
    "random_seed" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarterly_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_id" UUID NOT NULL,
    "quarter_end" DATE NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "fiscal_quarter" INTEGER NOT NULL,
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

    CONSTRAINT "quarterly_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_created" ON "users"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "banks_user_id_key" ON "banks"("user_id");

-- CreateIndex
CREATE INDEX "idx_banks_equity" ON "banks"("current_equity" DESC);

-- CreateIndex
CREATE INDEX "idx_banks_loans" ON "banks"("current_loans" DESC);

-- CreateIndex
CREATE INDEX "idx_banks_last_collected" ON "banks"("last_collected_at");

-- CreateIndex
CREATE INDEX "idx_loan_buckets_bank" ON "loan_buckets"("bank_id");

-- CreateIndex
CREATE INDEX "idx_loan_buckets_balance" ON "loan_buckets"("bank_id", "current_balance");

-- CreateIndex
CREATE UNIQUE INDEX "loan_buckets_bank_id_product_risk_class_origination_hour_key" ON "loan_buckets"("bank_id", "product", "risk_class", "origination_hour");

-- CreateIndex
CREATE INDEX "idx_deposit_buckets_bank" ON "deposit_buckets"("bank_id");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_buckets_bank_id_product_origination_hour_key" ON "deposit_buckets"("bank_id", "product", "origination_hour");

-- CreateIndex
CREATE INDEX "idx_transactions_bank" ON "transactions"("bank_id", "timestamp");

-- CreateIndex
CREATE INDEX "idx_transactions_type" ON "transactions"("bank_id", "type");

-- CreateIndex
CREATE INDEX "idx_transactions_collected" ON "transactions"("collected_at");

-- CreateIndex
CREATE INDEX "idx_collections_bank" ON "collections"("bank_id", "collected_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "quarterly_snapshots_bank_id_quarter_end_key" ON "quarterly_snapshots"("bank_id", "quarter_end");

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_rates" ADD CONSTRAINT "bank_rates_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_allocation" ADD CONSTRAINT "bank_allocation_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_buckets" ADD CONSTRAINT "loan_buckets_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_buckets" ADD CONSTRAINT "deposit_buckets_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_deposit_bucket_id_fkey" FOREIGN KEY ("deposit_bucket_id") REFERENCES "deposit_buckets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_loan_bucket_id_fkey" FOREIGN KEY ("loan_bucket_id") REFERENCES "loan_buckets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_snapshots" ADD CONSTRAINT "quarterly_snapshots_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;


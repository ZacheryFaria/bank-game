export { contract, BankRateSchema, BankAllocationSchema, BankSchema, UserSchema, CollectionReportSchema, DepositBucketSchema } from "./contract.js";
export type { Contract } from "./contract.js";

// Export inferred types from schemas
import { z } from "zod";
import { BankRateSchema, BankAllocationSchema, BankSchema, UserSchema, CollectionReportSchema, DepositBucketSchema } from "./contract.js";

export type BankRate = z.infer<typeof BankRateSchema>;
export type BankAllocation = z.infer<typeof BankAllocationSchema>;
export type Bank = z.infer<typeof BankSchema>;
export type User = z.infer<typeof UserSchema>;
export type CollectionReport = z.infer<typeof CollectionReportSchema>;
export type DepositBucket = z.infer<typeof DepositBucketSchema>;

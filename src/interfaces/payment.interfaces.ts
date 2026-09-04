import { IUser } from "./user.interfaces";

export enum VoucherStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum WalletTransactionType {
  VOUCHER_RECHARGE = "VOUCHER_RECHARGE",
  COURSE_PURCHASE = "COURSE_PURCHASE",
  REFUND = "REFUND",
  ADJUSTMENT = "ADJUSTMENT",
}

// ============================================================
// WALLET
// ============================================================

export interface IWallet {
  id: string;
  studentId: string;
  createdAt: Date;
  updatedAt?: Date;

  student: IUser;
  teacherBalances: ITeacherWalletBalance[];
}

// ============================================================
// TEACHER WALLET BALANCE
// ============================================================

export interface ITeacherWalletBalance {
  id: string;
  walletId: string;
  teacherId: string;
  balance: number;
  createdAt: Date;
  updatedAt?: Date;

  wallet: IWallet;
  teacher: IUser;
  transactions: IWalletTransaction[];
}

// ============================================================
// VOUCHER
// ============================================================

export interface IVoucher {
  id: string;
  code: string;
  amount: number;
  teacherId: string;
  status: VoucherStatus;
  expiresAt?: Date;
  redeemedAt?: Date;
  redeemedById?: string;
  createdAt: Date;

  teacher: IUser;
  redeemedBy?: IUser;

  transaction?: IWalletTransaction;
}

// ============================================================
// WALLET TRANSACTION
// ============================================================

export interface IWalletTransaction {
  id: string;
  teacherWalletBalanceId: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  voucherId?: string;
  description?: string;
  createdAt: Date;

  teacherWalletBalance: ITeacherWalletBalance;
  voucher?: IVoucher;
}

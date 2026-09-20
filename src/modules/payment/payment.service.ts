import walletTransactionRepository, {
  WalletTransactionRepository,
} from "./../../repositories/wallet-transaction.repository";
import walletRepository, {
  WalletRepository,
} from "./../../repositories/wallet.repository";
import { randomUUID } from "crypto";
import { badRequestException } from "../../common";
import {
  teacherProfileRepository,
  TeacherProfileRepository,
  TeacherWalletBalanceRepository,
  teacherWalletBalanceRepository,
} from "../../repositories";
import voucherRepository, {
  VoucherRepository,
} from "./../../repositories/voucher.repository";
import { createVoucherDto } from "./payment.dto";

export class PaymentService {
  private voucherRepository: VoucherRepository;
  private teacherRepository: TeacherProfileRepository;
  private teacherWalletRepository: TeacherWalletBalanceRepository;
  private walletRepository: WalletRepository;
  private walletTransactionRepository: WalletTransactionRepository;

  constructor() {
    this.voucherRepository = voucherRepository;
    this.teacherRepository = teacherProfileRepository;
    this.teacherWalletRepository = teacherWalletBalanceRepository;
    this.walletRepository = walletRepository;
    this.walletTransactionRepository = walletTransactionRepository;
  }
  async createVoucher({ teacherId, amount, expiresAt }: createVoucherDto) {
    const teacher = await this.teacherRepository.findById(teacherId);
    if (!teacher) throw new badRequestException("no teacher found ");
    const code = `EDU-${randomUUID()}`;
    const voucher = await this.voucherRepository.create({
      teacherId,
      amount: amount.toString(),
      code,
      expiresAt: expiresAt.toString(),
    });
    if (!voucher) throw new badRequestException(" error creating code  ");
    return voucher;
  }
  async redeemVoucher({ code }: any, studentId: string) {
    const voucher = await this.voucherRepository.findOne({
      code,
      status: "ACTIVE",
    });
    if (!voucher) {
      throw new badRequestException("voucher has been used or expired");
    }
    const wallet = await this.walletRepository.findOne({ studentId });
    if (!wallet) throw new badRequestException("wallet not found");

    const teacherWallet = await this.teacherWalletRepository.findOne({
      walletId: wallet.id,
      teacherId: voucher.teacherId,
    });
    if (!teacherWallet) throw new badRequestException("wallet not found");

    const balanceBefore = teacherWallet?.balance || "0";
    const newBalance = Number(teacherWallet?.balance) + Number(voucher.amount);

    await this.teacherWalletRepository.update({
      where: { walletId: wallet.id, teacherId: voucher.teacherId },
      update: {
        balance: newBalance,
        updateAt: new Date(),
      },
    });
    await this.voucherRepository.update({
      where: {
        id: voucher.id,
      },
      update: {
        status: "USED",
        usedBy: studentId,
        usedAt: new Date(),
      },
    });
    const transaction = await this.walletTransactionRepository.create({
      amount: voucher.amount.toString(),
      balanceBefore: balanceBefore,
      balanceAfter: newBalance.toString(),
      teacherWalletBalanceId: teacherWallet?.id,
      type: "VOUCHER_RECHARGE",
      voucherId: voucher.id,
    });
    return transaction;
  }
}

const paymentService = new PaymentService();
export default paymentService;

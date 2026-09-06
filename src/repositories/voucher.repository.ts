import { BaseRepository } from "./base.repository";

export class VoucherRepository extends BaseRepository<"Voucher"> {
  constructor() {
    super("Voucher");
  }

  // Add Voucher-specific query methods here.
}

const voucherRepository = new VoucherRepository();
export default voucherRepository;

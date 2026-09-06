import { BaseRepository } from "./base.repository";

export class WalletTransactionRepository extends BaseRepository<"WalletTransaction"> {
  constructor() {
    super("WalletTransaction");
  }

  // Add WalletTransaction-specific query methods here.
}

const walletTransactionRepository = new WalletTransactionRepository();
export default walletTransactionRepository;

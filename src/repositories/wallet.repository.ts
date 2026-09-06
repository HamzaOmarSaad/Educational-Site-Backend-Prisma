import { BaseRepository } from "./base.repository";

export class WalletRepository extends BaseRepository<"Wallet"> {
  constructor() {
    super("Wallet");
  }

  // Add Wallet-specific query methods here.
}

const walletRepository = new WalletRepository();
export default walletRepository;

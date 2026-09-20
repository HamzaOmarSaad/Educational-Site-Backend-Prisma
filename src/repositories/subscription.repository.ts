import { BaseRepository } from "./base.repository";

export class SubscriptionRepository extends BaseRepository<"Subscription"> {
  constructor() {
    super("Subscription");
  }

  // Add Subscription-specific query methods here.
}

const subscriptionRepository = new SubscriptionRepository();
export default subscriptionRepository;

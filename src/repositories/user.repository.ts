import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository<"User"> {
  constructor() {
    super("User");
  }

  // Add User-specific query methods here.
}

const userRepository = new UserRepository();
export default userRepository;

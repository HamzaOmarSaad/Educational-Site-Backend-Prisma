import { db } from "../prisma/db";

const userModel = db.orm.public.User;

export const userRepository = {
  findById(id: string) {
    return userModel.where((user) => user.id.eq(id)).first();
  },
};

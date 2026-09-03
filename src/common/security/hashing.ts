import bcrypt from "bcrypt";

export const hashService = async (text: string): Promise<string> => {
  return await bcrypt.hash(text, 10);
};
export const verifyHashService = async (
  originalText: string,
  hashedText: string,
): Promise<boolean> => {
  return await bcrypt.compare(originalText, hashedText);
};

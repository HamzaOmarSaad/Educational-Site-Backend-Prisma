import CryptoJS from "crypto-js";
import { ENCRYPTION_KEY } from "../../env/config";

export const encryptService = (text: string) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};
export const decryptService = (encryptedtext: string) => {
  return CryptoJS.AES.decrypt(encryptedtext, ENCRYPTION_KEY).toString(
    CryptoJS.enc.Utf8,
  );
};

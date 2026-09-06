import EventEmitter from "events";
import { EventHandler } from "../utils/EventHandler";
import emailService from "./email.service";

const EmailEmitter = new EventEmitter();

export const emailEvent = new EventHandler(EmailEmitter);

emailEvent.subscribe("confirm-Email", async (payload) => {
  await emailService.sendEmail(payload);
});

emailEvent.subscribe("forgetPassword", async (payload) => {
  await emailService.sendEmail(payload);
});

import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export class NotificationService {
  private client: App;

  constructor() {
    const serviceAccount = JSON.parse(
      // config file
      readFileSync(
        resolve(
          "./src/env/eduleb-4af00-firebase-adminsdk-fbsvc-7bcf5bf9b3.json",
        ),
        "utf8",
      ),
    );

    if (!getApps().length) {
      this.client = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      this.client = getApps()[0] as App;
    }
  }

  async sendNotification({
    token,
    data: { title, body },
  }: {
    token: string;
    data: {
      title: string;
      body: string;
    };
  }) {
    return await getMessaging(this.client).send({
      token,
      notification: {
        title,
        body,
      },
    });
  }
  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: {
      title: string;
      body: string;
    };
  }) {
    // to send them all  in parallel
    await Promise.allSettled(
      tokens.map(async (token) => {
        return this.sendNotification({ token, data });
      }),
    );
  }
}

export const notificationService = new NotificationService();

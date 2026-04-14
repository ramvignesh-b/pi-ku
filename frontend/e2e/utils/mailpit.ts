import { request } from "@playwright/test";

export interface MailpitMessage {
  ID: string;
  Subject: string;
  Snippet: string;
  To: { Address: string }[];
}

const MAILPIT_API_URL = process.env.MAILPIT_API_URL;

export const MailpitHelper = {
  getActivationLink: async (
    email: string,
    timeout = 10000,
  ): Promise<string> => {
    const startTime = Date.now();
    const requestContext = await request.newContext();

    while (Date.now() - startTime < timeout) {
      // Search specifically for the recipient to reduce data transfer
      const response = await requestContext.get(`${MAILPIT_API_URL}/search`, {
        params: { query: `to:${email}`, limit: 1 },
      });

      if (response.ok()) {
        const data = await response.json();
        if (data.messages?.length > 0) {
          const msgId = data.messages[0].ID;
          const detailRes = await requestContext.get(
            `${MAILPIT_API_URL}/message/${msgId}`,
          );
          const details = await detailRes.json();

          const body = details.HTML || details.Text || "";
          const match = body.match(/https?:\/\/\S+activate\/\S+/);

          if (match) return match[0];
        }
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    throw new Error(`Timeout: Could not find activation link for ${email}`);
  },
};

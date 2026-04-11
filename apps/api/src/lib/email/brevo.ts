import { HttpError } from "../http.js";

type Recipient = {
  email: string;
  name?: string;
};

type BrevoDependencyStatus = {
  provider: "brevo";
  configured: boolean;
  lastStatus: "ok" | "error" | "unknown";
  lastError?: string;
  lastCheckedAt?: string;
};

const brevoStatus: BrevoDependencyStatus = {
  provider: "brevo",
  configured: false,
  lastStatus: "unknown"
};

function isBrevoConfigured() {
  return Boolean(
    process.env.BREVO_API_KEY?.trim() &&
    process.env.BREVO_SENDER_EMAIL?.trim()
  );
}

function markBrevoStatus(status: "ok" | "error", error?: string) {
  brevoStatus.configured = isBrevoConfigured();
  brevoStatus.lastStatus = status;
  brevoStatus.lastError = error;
  brevoStatus.lastCheckedAt = new Date().toISOString();
}

export function getBrevoDependencyStatus(): BrevoDependencyStatus {
  return {
    ...brevoStatus,
    configured: isBrevoConfigured()
  };
}

function readEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new HttpError(500, `Missing environment variable: ${name}`, "missing_mail_env");
  }

  return value;
}

export async function sendBrevoEmail(input: {
  to: Recipient[];
  subject: string;
  htmlContent: string;
}) {
  if (!isBrevoConfigured()) {
    markBrevoStatus("error", "missing_brevo_env");
  }
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": readEnv("BREVO_API_KEY"),
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        email: readEnv("BREVO_SENDER_EMAIL"),
        name: process.env.BREVO_SENDER_NAME ?? "SURAKSHA"
      },
      to: input.to,
      subject: input.subject,
      htmlContent: input.htmlContent
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    markBrevoStatus("error", errorText || response.statusText || `http_${response.status}`);
    throw new HttpError(
      502,
      `Brevo email send failed: ${errorText || response.statusText}`,
      "brevo_send_failed"
    );
  }

  markBrevoStatus("ok");
  return response.json();
}

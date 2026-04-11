import { sendBrevoEmail } from "../lib/email/brevo.js";

function getArg(index: number) {
  const args = process.argv.slice(2).filter((value) => value !== "--");
  return args[index]?.trim() ?? "";
}

function requireArg(name: string, value: string) {
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }

  return value;
}

async function main() {
  const to = requireArg("recipient email", getArg(0));
  const subject = getArg(1) || "SURAKSHA test email";

  await sendBrevoEmail({
    to: [{ email: to }],
    subject,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 12px">SURAKSHA test email</h2>
        <p style="margin:0 0 12px">This is a simple delivery test from the API.</p>
        <p style="margin:0">If you received this, Brevo sending is working.</p>
      </div>
    `
  });

  console.log(`Sent test email to ${to}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
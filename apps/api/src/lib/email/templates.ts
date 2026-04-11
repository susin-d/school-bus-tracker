function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function baseLayout(input: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: string;
}) {
  const cta =
    input.ctaLabel && input.ctaHref
      ? `<p style="margin:32px 0 0;">
          <a href="${input.ctaHref}" style="display:inline-block;background:#d98932;color:#fff7ef;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700;">
            ${escapeHtml(input.ctaLabel)}
          </a>
        </p>`
      : "";

  return `
  <!doctype html>
  <html lang="en">
    <body style="margin:0;padding:0;background:#f7f1e8;font-family:Segoe UI,Arial,sans-serif;color:#17324d;">
      <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
        <div style="background:linear-gradient(180deg,#17324d 0%,#244968 100%);border-radius:28px 28px 0 0;padding:28px 32px;">
          <div style="font-size:13px;letter-spacing:1.8px;text-transform:uppercase;color:#f2bc74;font-weight:700;">SURAKSHA</div>
          <h1 style="margin:12px 0 0;color:#fffaf4;font-size:30px;line-height:1.2;">${escapeHtml(input.heading)}</h1>
        </div>
        <div style="background:#fffaf4;border:1px solid #ead8c1;border-top:none;border-radius:0 0 28px 28px;padding:32px;">
          <div style="font-size:16px;line-height:1.7;color:#4f6275;">
            ${input.body}
          </div>
          ${cta}
          <p style="margin:32px 0 0;color:#7a8895;font-size:13px;line-height:1.6;">
            ${input.footer ?? "If you did not request this email, you can safely ignore it."}
          </p>
        </div>
      </div>
    </body>
  </html>`;
}

export function buildWelcomeEmailHtml(input: { fullName: string }) {
  return baseLayout({
    heading: `Welcome aboard, ${input.fullName}`,
    body: `
      <p style="margin:0 0 16px;">Your SURAKSHA account is ready.</p>
      <p style="margin:0 0 16px;">You can now use the platform to stay informed about routes, attendance, and safety updates.</p>
      <p style="margin:0;">We built this experience to keep school transportation clear, calm, and safe for families and staff.</p>
    `,
    footer: "This mailbox is used for transactional updates from SURAKSHA."
  });
}

export function buildVerificationEmailHtml(input: {
  fullName: string;
  verificationLink: string;
}) {
  return baseLayout({
    heading: "Verify your email",
    body: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(input.fullName)},</p>
      <p style="margin:0 0 16px;">Please verify your email address to activate your SURAKSHA account and finish setup.</p>
      <p style="margin:0;">This link is time-sensitive and should only be used by you.</p>
    `,
    ctaLabel: "Verify Email",
    ctaHref: input.verificationLink
  });
}

export function buildForgotPasswordEmailHtml(input: {
  fullName: string;
  resetLink: string;
}) {
  return baseLayout({
    heading: "Reset your password",
    body: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(input.fullName)},</p>
      <p style="margin:0 0 16px;">We received a request to reset your SURAKSHA password.</p>
      <p style="margin:0;">Use the button below to choose a new password.</p>
    `,
    ctaLabel: "Reset Password",
    ctaHref: input.resetLink
  });
}

export function buildForgotPasswordOtpEmailHtml(input: {
  fullName: string;
  otp: string;
  expiresInMinutes: number;
}) {
  return baseLayout({
    heading: "Your password reset code",
    body: `
      <p style="margin:0 0 16px;">Hi ${escapeHtml(input.fullName)},</p>
      <p style="margin:0 0 16px;">Use this one-time code to reset your SURAKSHA password:</p>
      <p style="margin:0 0 16px;font-size:28px;letter-spacing:8px;font-weight:800;color:#17324d;">
        ${escapeHtml(input.otp)}
      </p>
      <p style="margin:0;">This code expires in ${input.expiresInMinutes} minutes and can be used only once.</p>
    `,
    footer: "If you did not request a password reset, please ignore this email."
  });
}

export function buildAdminBroadcastEmailHtml(input: {
  heading: string;
  messageHtml: string;
}) {
  return baseLayout({
    heading: input.heading,
    body: `
      <p style="margin:0 0 16px;">${input.messageHtml}</p>
      <p style="margin:0;">Sent via SURAKSHA administration.</p>
    `,
    footer: "This is an operational communication from your school transport system."
  });
}

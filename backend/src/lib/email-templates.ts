export function verificationEmailTemplate(opts: {
  firstName: string;
  verifyUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f4f4f5;padding:40px 0;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:40px">
    <h2 style="margin:0 0 16px;color:#111827">Verify your email</h2>
    <p style="color:#374151;margin:0 0 24px">Hi ${opts.firstName}, click the button below to verify your email address.</p>
    <a href="${opts.verifyUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Verify email</a>
    <p style="color:#6b7280;font-size:13px;margin:24px 0 0">This link expires in 24 hours. If you did not create an account, ignore this email.</p>
  </div>
</body>
</html>`;
}

export function passwordResetEmailTemplate(opts: {
  firstName: string;
  resetUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f4f4f5;padding:40px 0;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:40px">
    <h2 style="margin:0 0 16px;color:#111827">Reset your password</h2>
    <p style="color:#374151;margin:0 0 24px">Hi ${opts.firstName}, click the button below to reset your password.</p>
    <a href="${opts.resetUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600">Reset password</a>
    <p style="color:#6b7280;font-size:13px;margin:24px 0 0">This link expires in 1 hour. If you did not request a password reset, ignore this email.</p>
  </div>
</body>
</html>`;
}

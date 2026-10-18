import nodemailer from "nodemailer";

// Email opsional: aktif hanya bila SMTP_URL diisi (mis. smtps://user:pass@smtp.example.com:465).
// Tanpa itu, reset password tetap bisa lewat tautan buatan admin.
export function isMailConfigured() {
  return !!process.env.SMTP_URL?.trim();
}

export async function sendMail(to: string, subject: string, text: string) {
  const url = process.env.SMTP_URL?.trim();
  if (!url) throw new Error("SMTP_URL belum diatur");
  const from = process.env.MAIL_FROM?.trim() || "TemanNakes <temannakes2026@gmail.com>";
  await nodemailer.createTransport(url).sendMail({ from, to, subject, text });
}

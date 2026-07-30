import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: Number(process.env.SMTP_PORT ?? 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await getTransporter().sendMail({
    from: `"VK Global Publications Digital Library" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
}

export function bookAccessGrantedEmail({ name, bookTitle }: { name: string; bookTitle: string }) {
  return {
    subject: `You now have access to "${bookTitle}"`,
    html: `
      <p>Hi ${name},</p>
      <p>You've been granted access to <strong>${bookTitle}</strong> on the VK Global Publications Digital Library. You can open it anytime from your dashboard.</p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">This is an automated message — please do not reply to this email.</p>
    `,
  };
}

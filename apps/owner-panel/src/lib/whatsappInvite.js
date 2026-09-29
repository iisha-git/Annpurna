export const APP_DOWNLOAD_URL =
  'https://drive.google.com/file/d/1GsMAddZYPIQgeUq4NQPUJBuM8JfFqeNh/view?usp=sharing';

/**
 * Extracts the first exactly-10-digit mobile number from strings like "9022379818/8605537523"
 */
export function extractCleanMobile(rawMobile) {
  const candidates = String(rawMobile ?? '')
    .split(/[/\s,]+/)
    .map((n) => n.replace(/\D/g, ''))
    .filter((n) => n.length === 10);
  return candidates[0] || '';
}

/**
 * Generates the personalized WhatsApp invitation message.
 */
export function buildWhatsAppInviteMessage(student) {
  const name = String(student.name || '').trim();
  const messNumber = String(student.messNumber ?? student.id ?? '').trim();
  const mobile = extractCleanMobile(student.mobile);

  return (
    `Hi ${name || 'friend'} (Mess ${messNumber})! 🍽️\n\n` +
    `Download the Annpurna Mess app here:\n` +
    `👉 ${APP_DOWNLOAD_URL}\n\n` +
    `Steps to get started:\n` +
    `1. Open the app and tap "Create Account"\n` +
    `2. Enter your Name: ${name}\n` +
    `3. Enter your Mess No: ${messNumber}\n` +
    `4. Enter your Mobile: ${mobile || 'your registered phone'}\n` +
    `5. Set your password and sign in!\n\n` +
    `You can check daily menus, see live crowd levels in real time, and request leave days directly from the app.`
  );
}

/**
 * Opens WhatsApp directly in a new tab with the pre-filled invitation.
 */
export function openWhatsAppInvite(student) {
  const mobile = extractCleanMobile(student.mobile);
  if (!mobile) {
    throw new Error(
      `No valid 10-digit mobile number on file for ${student.name || 'this student'}.`
    );
  }

  const message = buildWhatsAppInviteMessage(student);
  const url = `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

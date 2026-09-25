import {
  APP_DOWNLOAD_URL,
  WHATSAPP_API_TOKEN,
  WHATSAPP_COUNTRY_CODE,
  WHATSAPP_PHONE_ID,
  WHATSAPP_TEMPLATE_NAME,
} from '../config.js';

const GRAPH_VERSION = 'v21.0';

/** The three placeholder values the approved Meta template receives. */
function inviteParams({ name, messNumber }) {
  return [
    { type: 'text', text: String(name || 'friend') },
    { type: 'text', text: String(messNumber) },
    { type: 'text', text: APP_DOWNLOAD_URL || 'ask the mess office for the download link' },
  ];
}

/**
 * Human-readable copy of the invite — kept for logging/help text. The actual
 * message a student receives is the approved Meta template's body; these are
 * its {{1}} {{2}} {{3}} parameters.
 */
export function buildInviteMessage({ name, messNumber }) {
  const install = APP_DOWNLOAD_URL
    ? `Download the app: ${APP_DOWNLOAD_URL}`
    : 'Ask the mess office for the app download link';
  return (
    `Hi ${name || 'friend'} (Mess ${messNumber})! ${install}. In the app tap Create Account, ` +
    'enter your full name, mess number and the mobile on the mess list, set a password, then ' +
    'sign in with your mess number to see the menu, crowd status, leave approvals and more.'
  );
}

/**
 * Send an approved template message through the Meta WhatsApp Cloud API.
 * Returns { ok: true, messageId, to } on success, or { ok: false, code, message }.
 */
export async function sendWhatsApp(mobile, { name, messNumber }) {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_ID) {
    return {
      ok: false,
      code: 'WHATSAPP_NOT_CONFIGURED',
      message: 'Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_ID on the server to enable WhatsApp invites.',
    };
  }
  if (!WHATSAPP_TEMPLATE_NAME) {
    return {
      ok: false,
      code: 'WHATSAPP_TEMPLATE_MISSING',
      message: 'Set WHATSAPP_TEMPLATE_NAME (the approved Meta message template).',
    };
  }

  const to = `${WHATSAPP_COUNTRY_CODE || '91'}${String(mobile).replace(/\D/g, '')}`;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: WHATSAPP_TEMPLATE_NAME,
      language: { code: 'en' },
      components: [{ type: 'body', parameters: inviteParams({ name, messNumber }) }],
    },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json().catch(() => null);
    const messageId = data?.messages?.[0]?.id;
    if (res.ok && messageId) return { ok: true, messageId, to };

    const err = data?.error;
    return {
      ok: false,
      code: 'WHATSAPP_API_ERROR',
      message: err?.error?.user_title || err?.message || `Meta replied with status ${res.status}.`,
    };
  } catch (err) {
    return { ok: false, code: 'WHATSAPP_NETWORK_ERROR', message: err.message };
  }
}
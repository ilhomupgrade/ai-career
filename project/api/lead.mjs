const MAX_FIELD_LENGTH = 1200;
const SITE_URL = 'https://weupgrade.ru';

const json = (body, init = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });

const clean = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FIELD_LENGTH);

const formatLeadText = (lead) =>
  [
    'Новая заявка на курс "ИИ для карьеры 2026"',
    '',
    `Имя: ${lead.name}`,
    `Контакт: ${lead.contact}`,
    `Формат: ${lead.format}`,
    `Задача: ${lead.message || 'не указана'}`,
    '',
    `Страница: ${lead.page || SITE_URL}`,
    `Дата: ${lead.submittedAt}`,
  ].join('\n');

const configuredChannels = () => {
  const channels = [];

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    channels.push('telegram');
  }

  if (process.env.RESEND_API_KEY && process.env.LEAD_TO_EMAIL && process.env.LEAD_FROM_EMAIL) {
    channels.push('email');
  }

  if (process.env.LEADS_WEBHOOK_URL) {
    channels.push('webhook');
  }

  return channels;
};

const sendTelegram = async (lead, text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Telegram delivery failed: ${response.status} ${detail}`);
  }

  return { channel: 'telegram', ok: true };
};

const sendEmail = async (lead, text) => {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!apiKey || !to || !from) return null;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Заявка на курс ИИ для карьеры 2026',
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email delivery failed: ${response.status} ${detail}`);
  }

  return { channel: 'email', ok: true };
};

const sendWebhook = async (lead) => {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return null;

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.LEADS_WEBHOOK_SECRET) {
    headers.Authorization = `Bearer ${process.env.LEADS_WEBHOOK_SECRET}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(lead),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Webhook delivery failed: ${response.status} ${detail}`);
  }

  return { channel: 'webhook', ok: true };
};

export async function POST(request) {
  try {
    const payload = await request.json();

    if (clean(payload.company)) {
      return json({ ok: true, ignored: true });
    }

    const lead = {
      name: clean(payload.name),
      contact: clean(payload.contact),
      format: clean(payload.format),
      message: clean(payload.message),
      page: clean(payload.page),
      referrer: clean(payload.referrer),
      utm: payload.utm && typeof payload.utm === 'object' ? payload.utm : {},
      submittedAt: new Date().toISOString(),
    };

    if (!lead.name || !lead.contact || !lead.format) {
      return json({ ok: false, error: 'Заполните имя, контакт и формат обучения.' }, { status: 400 });
    }

    const channels = configuredChannels();
    if (channels.length === 0) {
      return json(
        {
          ok: false,
          error: 'Доставка заявок ещё не настроена. Напишите напрямую в Telegram @ilhom_upgrade.',
          code: 'NO_DELIVERY_CHANNELS',
        },
        { status: 503 },
      );
    }

    const text = formatLeadText(lead);
    const deliveries = await Promise.allSettled([
      sendTelegram(lead, text),
      sendEmail(lead, text),
      sendWebhook(lead),
    ]);

    const sent = deliveries
      .filter((result) => result.status === 'fulfilled' && result.value)
      .map((result) => result.value.channel);

    if (sent.length === 0) {
      const errors = deliveries
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason?.message || 'Unknown delivery error');
      console.error('Lead delivery failed', errors);
      return json({ ok: false, error: 'Не удалось отправить заявку. Напишите напрямую в Telegram @ilhom_upgrade.' }, { status: 502 });
    }

    return json({ ok: true, sent });
  } catch (error) {
    console.error('Lead API error', error);
    return json({ ok: false, error: 'Не удалось обработать заявку. Напишите напрямую в Telegram @ilhom_upgrade.' }, { status: 500 });
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
      'Cache-Control': 'no-store',
    },
  });
}

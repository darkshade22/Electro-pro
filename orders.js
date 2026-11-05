// Vercel Node.js Function. Secrets stay on the server, never in index.html.
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwwORDYMsk8lObnb8zr4r6-lTTF--_85h2y8bnY5cXA6d88y6kEP7E5hFyuVi-RHjft/exec';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const fail = (status, error, code) => res.status(status).json({ ok: false, error, code });
  const secret = (process.env.ORDERS_SECRET || '').trim();
  const scriptUrl = (process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL).trim();

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'Electro Pro Rahma — Google Sheets',
      configured: Boolean(secret)
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return fail(405, 'هاد المسار كيقبل إرسال الطلبات فقط.', 'METHOD_NOT_ALLOWED');
  }
  if (req.headers?.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) {
        return fail(403, 'خاص الطلب يتصيفط من الموقع نفسه.', 'ORIGIN_REJECTED');
      }
    } catch {
      return fail(403, 'تعذر التحقق من مصدر الطلب.', 'ORIGIN_REJECTED');
    }
  }
  if (!secret) {
    return fail(503, 'استقبال الطلبات مازال ما تفعلش. خاص يتكمّل إعداد الربط.', 'MISSING_ORDERS_SECRET');
  }
  try {
    const url = new URL(scriptUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !url.pathname.endsWith('/exec')) {
      return fail(503, 'رابط استقبال الطلبات ما مضبوطش.', 'INVALID_SCRIPT_URL');
    }
  } catch {
    return fail(503, 'رابط استقبال الطلبات ما مضبوطش.', 'INVALID_SCRIPT_URL');
  }

  let body;
  try {
    if (typeof req.body === 'string' && Buffer.byteLength(req.body) > 16384) {
      return fail(413, 'حجم الطلب كبير بزاف.', 'PAYLOAD_TOO_LARGE');
    }
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return fail(400, 'معلومات الطلب ما وصلاتش بصيغة صحيحة.', 'INVALID_JSON');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail(400, 'معلومات الطلب ما وصلاتش بصيغة صحيحة.', 'INVALID_BODY');
  }
  const text = value => value == null ? '' : String(value);
  if (text(body.website)) return fail(400, 'تعذر إرسال الطلب.', 'INVALID_BODY');
  const requestKey = text(body.requestKey).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(requestKey)) {
    return fail(400, 'عاودي تحميل الصفحة وجربي من جديد.', 'INVALID_REQUEST_KEY');
  }

  // Customer fields pass through as entered. The deployed Google script
  // applies its own validation; a rejected response is never reported as success.
  const payload = {
    token: secret,
    requestKey,
    name: text(body.name ?? body.full_name),
    phone: text(body.phone),
    city: text(body.city),
    address: text(body.address)
  };
  if (Buffer.byteLength(JSON.stringify(payload)) > 16384) {
    return fail(413, 'حجم الطلب كبير بزاف.', 'PAYLOAD_TOO_LARGE');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  try {
    const upstream = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal
    });
    let result;
    try { result = await upstream.json(); }
    catch {
      return fail(502, 'Google ما رجعش تأكيد مفهوم. راجعي الطلبات قبل تعاودي الإرسال.', 'INVALID_GOOGLE_RESPONSE');
    }
    if (!upstream.ok) {
      return fail(502, 'تعذر التحقق من تسجيل الطلب فـGoogle. راجعي الطلبات قبل تعاودي الإرسال.', 'GOOGLE_UNAVAILABLE');
    }
    if (!result || result.ok !== true) {
      const code = typeof result?.error === 'string' ? result.error : 'GOOGLE_REJECTED';
      if (code === 'UNAUTHORIZED') return fail(503, 'مفتاح ربط الطلبات ما مطابقش. خاص يتراجع إعداد السيرفر.', code);
      if (code === 'SETUP_REQUIRED') return fail(503, 'خاص يتكمّل إعداد Google Sheet قبل استقبال الطلبات.', code);
      if (code === 'INVALID_FIELDS') return fail(422, 'Google Script رفض المعلومات. خاص تتراجع شروط الخانات فالسكريبت.', code);
      if (code === 'BUSY_RETRY') return fail(503, 'السيرفر مشغول دابا. عاودي المحاولة بعد لحظة.', code);
      return fail(502, 'Google ما أكدش تسجيل الطلب. راجعي الطلبات قبل تعاودي الإرسال.', 'GOOGLE_REJECTED');
    }
    if (typeof result.id !== 'string' || !result.id.trim() || result.total !== 650) {
      return fail(502, 'Google جاوب ولكن تأكيد الطلب ناقص. راجعي الشييت قبل تعاودي الإرسال.', 'INVALID_CONFIRMATION');
    }
    return res.status(200).json({
      ok: true,
      id: result.id,
      total: 650,
      duplicate: result.duplicate === true,
      emailSent: typeof result.emailSent === 'boolean' ? result.emailSent : null
    });
  } catch {
    return fail(504, 'ما تأكدش تسجيل الطلب بسبب الاتصال. راجعي الشييت قبل تعاودي الإرسال.', 'GOOGLE_TIMEOUT');
  } finally {
    clearTimeout(timeout);
  }
};

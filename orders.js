// Vercel Node.js Function. The browser calls /api/orders on its own domain.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const fail = (status, error, code) => res.status(status).json({ ok: false, error, code });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(405, 'هاد المسار كيقبل إرسال الطلبات فقط.', 'METHOD_NOT_ALLOWED');
  }
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return fail(400, 'معلومات الطلب ما وصلاتش بصيغة صحيحة.', 'INVALID_JSON');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail(400, 'معلومات الطلب ما وصلاتش بصيغة صحيحة.', 'INVALID_BODY');
  }
  // Preserve test values, including short names, letters in phone, and empty fields.
  const text = value => value == null ? '' : String(value);
  if (text(body.website)) return fail(400, 'تعذر إرسال الطلب.', 'INVALID_BODY');
  const payload = {
    full_name: text(body.name ?? body.full_name),
    phone: text(body.phone),
    city: text(body.city),
    address: text(body.address),
    items: [{ name: 'باك أواني 12 قطعة فاخر (عرض 650 درهم)', price: 650, quantity: 1 }],
    total: 650,
    requestKey: text(body.requestKey)
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const upstream = await fetch('https://electro-pro-rahma-1.ai.studio/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    let result;
    try { result = await upstream.json(); }
    catch { return fail(502, 'سيرفر الطلبات ما رجعش جواب مفهوم. ما تأكدش تسجيل الطلب.', 'INVALID_UPSTREAM_RESPONSE'); }
    if (!upstream.ok || !result || result.ok === false || result.success === false || result.error) {
      return fail(502, 'سيرفر الطلبات رفض الطلب. خاص يتراجع إعداد استقبال الطلبات فالتطبيق.', 'UPSTREAM_REJECTED');
    }
    // Never generate an order ID: require a real ID from the application.
    // Support direct results and common wrappers without treating them as verified API contracts.
    const id = result.id ?? result.order?.id ?? result.data?.id;
    if (typeof id !== 'string' || !id.trim()) {
      return fail(502, 'السيرفر جاوب ولكن ما رجعش رقم الطلب. راجعي التطبيق قبل تعاودي الإرسال.', 'MISSING_ORDER_ID');
    }
    return res.status(200).json({ ok: true, id, total: 650 });
  } catch {
    return fail(504, 'ما تأكدش تسجيل الطلب بسبب تأخر أو تعذر الاتصال. راجعي التطبيق قبل تعاودي الإرسال.', 'UPSTREAM_UNAVAILABLE');
  } finally { clearTimeout(timeout); }
};

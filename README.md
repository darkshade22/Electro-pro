# Electro Pro Rahma — Google Sheets + Gmail / Vercel

هاد الحزمة كتبدّل الربط القديم ديال التطبيق بربط Google Apps Script.
التصميم والصور والألوان باقين، والفورم كينادي `/api/orders` داخل نفس موقع Vercel.
سيرفر Vercel هو اللي كيمرر الطلب لـGoogle مع المفتاح الخاص. المفتاح ما كيتحطش فـHTML.

## 1. ملفات GitHub

فك الضغط، ورفع هاد الملفات داخل جذر نفس repository:

- `index.html` — يعوض القديم.
- `api/orders.js` — يعوض النسخة القديمة ديال هاد الملف. احتفظ بمجلد `api`.
- `vercel.json` — إعداد هاد الصفحة المستقلة. إذا كان عندك إعداد خاص آخر، ادمج إعداد الدالة عوض تعويضه بلا مراجعة.
- `.gitignore` — ادمج قواعد استثناء الأسرار إذا كان الملف موجوداً.

ما ترفعش ZIP كما هو. رفع محتوياته، ثم Commit على branch المربوط بـVercel.
Framework Preset: Other. ما كاينش Build Command خاص ولا Output Directory خاص بهاد الصفحة.

## 2. المفتاح كيبقى عند صاحب Google Sheet

داخل Apps Script:
Project Settings ⚙️ → Script Properties → ORDERS_SECRET
ينسخ القيمة كاملة بلا تغيير.
ما يصيفطهاش فشات، وما يحطهاش فـindex.html أو GitHub.

داخل Vercel، يفتح نفس المشروع:
Settings → Environment Variables

يزيد:

| Name | Value |
| --- | --- |
| GOOGLE_SCRIPT_URL | رابط `/exec` الجديد المبيّن فـ.env.example |
| ORDERS_SECRET | نفس القيمة اللي نسخ من Script Properties |

يختار Production، ويختار Preview كذلك إلا كان باغي يجرب نسخة معاينة مربوطة بنفس الشييت.
يقدر صاحب الحساب يدخل المفتاح بنفسه، بلا مشاركة حساب Google أو المفتاح مع المطور.
بعد الحفظ يدير Redeploy، حيث خاص deployment جديدة باش تستعمل القيم الجديدة.

## 3. التجربة

1. يفتح رابط الموقع المنشور على Vercel، ماشي ملف HTML من الجهاز.
2. يدير طلب تجريبي واضح. مثال صالح لشروط السكريبت السابق:
   الاسم `TEST`، الهاتف `0600000000`، المدينة `TEST`، العنوان `TEST ORDER - DO NOT SHIP`.
   هادي معلومات وهمية؛ ما خاص حتى اتصال أو توصيل لهاد الطلب.
3. يتأكد الطلب بان فـOrders داخل Google Sheet.
4. يتأكد إشعار Gmail وصل، ويشوف Spam إلا ما بانش.
5. يتأكد صفحة الشكر والـconfetti ظهروا مع رقم الطلب الحقيقي اللي رجع السكريبت.

`/api/orders` فالمتصفح كيعرض غير حالة الإعداد، وما كيسجّل حتى طلب.
`configured: true` كيعني المفتاح موجود فـVercel فقط، وما كيأكدش أنه مطابق أو أن الحفظ خدام.

## شروط الخانات

خانات HTML وهذا الوسيط ما كيلزموش رقم مغربي ولا حد أدنى للطول.
لكن Google Apps Script اللي تعطى سابقاً كيتحقق من الهاتف والطول؛ باش تقبل حروفاً عشوائية حتى فالشييت، خاص تعديل شروط السكريبت وإعادة نشر النسخة الجديدة.

## التأكيد والأخطاء

- ما كتظهرش صفحة النجاح إلا رجع Google `ok: true` ورقم الطلب `id` والثمن 650.
- فشل الإيميل بوحده ما كيلغيش طلباً أكد Google أنه محفوظ. شوف عمود إشعار الإيميل فالشييت.
- `UNAUTHORIZED`: مفتاح Vercel ما مطابقش ORDERS_SECRET ديال نفس مشروع Apps Script.
- `SETUP_REQUIRED`: خاص setup فمشروع Apps Script الصحيح.
- `INVALID_FIELDS`: شروط Google Script رفضت المعطيات.
- إذا وقع timeout أو تأكيد ناقص، راجع الشييت قبل إعادة الطلب.
- السكريبت السابق كيعتمد requestKey لمنع تكرار نفس محاولة الإرسال. الفورم الحالي كيبقي نفس المفتاح لإعادة المحاولة داخل نفس تحميل الصفحة؛ إعادة تحميل الصفحة كتولد مفتاحاً جديداً.

## التحقق اللي تدار

رابط Google /exec جاوب GET بـ200 و`{ "ok": true, "service": "Electro Pro Rahma Orders" }`.
اختبارات محلية باستجابات وهمية كتراجع تمرير البيانات، الحفاظ على المفتاح فالسيرفر، أخطاء Google، والتأكيد الحقيقي قبل النجاح.
ما ترسلات حتى طلبية حقيقية ولا إيميل من طرفنا. التجربة الكاملة كتبقى بعد وضع المفتاح والنشر.

مراجع:
https://developers.google.com/apps-script/guides/web
https://vercel.com/docs/functions/runtimes/node-js
https://vercel.com/docs/environment-variables

## Meta Pixel

Pixel ID: 2139937503271075.
The base pixel loads asynchronously and tracks PageView once per page load. No Purchase or Lead event was added.
The old ai.studio application endpoint is absent. Google Sheets/Gmail still uses the same-origin /api/orders function.
Local checks verified the pixel init/event queue without loading Meta or sending live tracking requests.

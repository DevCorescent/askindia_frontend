// Browser regression for store access, store order workflow, customer
// tracking/reviews and the forgot-password page. PHASE=otp runs the
// PASSWORD_RESET_OTP_ENABLED=true recovery flow instead. Run it through
// run-browser-regression.sh, which starts the backend's throwaway test stack
// (local DB + API) and a Vite dev server; never point it at a real environment.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const APP = process.env.TEST_APP_URL;
const API = process.env.TEST_API_URL;
const DB  = process.env.TEST_DATABASE_URL;
if (!APP || !API || !DB) throw new Error('TEST_APP_URL, TEST_API_URL and TEST_DATABASE_URL are required');
for (const url of [APP, API, DB]) {
  const host = new URL(url).hostname;
  if (!['127.0.0.1', 'localhost'].includes(host)) throw new Error(`Refusing to run against non-local host ${host}`);
}
// playwright-core is not a project dependency: the runner provides it.
const { chromium } = await import(process.env.PLAYWRIGHT_CORE ? pathToFileURL(process.env.PLAYWRIGHT_CORE).href : 'playwright-core');
const sql = (q) => execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-At', '-c', q]).toString().trim();
// Optional screenshots for debugging (never committed).
const SHOTS = process.env.SHOTS_DIR;
if (SHOTS) execFileSync('mkdir', ['-p', SHOTS]);
const RUN = Date.now().toString(36).slice(-5);
const USERNAME = `ui_store_${RUN}`;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

// Every API response the page receives, to catch calls a role must not make.
const ADMIN_ONLY = /^\/api\/v1\/(agents|analytics\/activities|analytics\/abandoned-carts)$/;
const apiLog = [];
const simulated = new WeakSet(); // requests the test answers itself (page.route)
page.on('response', r => {
  if (simulated.has(r.request())) return;
  const u = new URL(r.url());
  if (u.pathname.startsWith('/api/v1/')) apiLog.push({ path: u.pathname, status: r.status() });
});
const mark = () => apiLog.length;
const adminOnlySince = (m) => apiLog.slice(m).filter(e => ADMIN_ONLY.test(e.path));

const results = [];
const ok = (name, cond, detail = '') => { results.push(`${cond ? '✔' : '✘'} ${name}`); console.log(`${cond ? '✔' : '✘'} ${name}${!cond && detail ? ` — ${detail}` : ''}`); };
const shot = (n) => (SHOTS ? page.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: false }) : Promise.resolve());
async function uiLogin(id, pw) {
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${APP}/login`);
  await page.getByPlaceholder('you@example.com or store User ID').fill(id);
  await page.locator('input[type="password"]').fill(pw);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}
const api = async (method, path, body, token) => (await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body && JSON.stringify(body) })).json();

// Mail captured by the backend's local SMTP sink (quoted-printable decoded).
function mailsTo(address, subject) {
  const file = process.env.MAIL_SINK_FILE;
  if (!file || !existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
    .filter(m => m.to.includes(address) && subject.test(m.data))
    .map(m => m.data.replace(/=\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
}
const otpFromMail = (address) => mailsTo(address, /Subject: Your AskIndia password reset code/).at(-1)?.match(/reset code is (\d{6})/)?.[1];
const visibleSoon = (locator) => locator.waitFor({ timeout: 8000 }).then(() => true, () => false);

async function finish() {
  console.log(errors.length ? `page errors:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
  const passed = results.filter(r => r.startsWith('✔')).length;
  console.log(`\n${passed}/${results.length} passed`);
  process.exit(passed !== results.length || errors.length ? 1 : 0);
}

if (process.env.PHASE === 'otp') {
  // PASSWORD_RESET_OTP_ENABLED=true: Forgot password → emailed code → new password.
  const email = `otp_ui_${RUN}@test.io`;
  await api('POST', '/auth/signup', { email, password: 'OldPass123', name: 'OTP UI', role: 'customer' });
  await page.goto(`${APP}/login`);
  const forgot = page.getByRole('button', { name: 'Forgot password?' });
  ok('login page shows "Forgot password?" (OTP on)', await visibleSoon(forgot));
  await forgot.click();
  ok('forgot-password shows the OTP flow', await visibleSoon(page.getByRole('button', { name: 'Send Code' }))
    && !(await page.getByRole('button', { name: 'Send Reset Link' }).isVisible()));
  await shot('20-otp-request');
  await page.getByPlaceholder('you@example.com or User ID').fill(email);
  await page.getByRole('button', { name: 'Send Code' }).click();
  await page.getByPlaceholder('••••••').waitFor();
  const code = otpFromMail(email);
  ok('code arrives by email', /^\d{6}$/.test(code ?? ''));
  ok('code is not shown on the page', !!code && !(await page.content()).includes(code));
  await shot('21-otp-verify');
  await page.getByPlaceholder('••••••').fill(code === '000000' ? '111111' : '000000');
  await page.getByRole('button', { name: 'Verify Code' }).click();
  ok('wrong code rejected', await visibleSoon(page.getByText('Invalid or expired code')));
  await page.getByPlaceholder('••••••').fill(code);
  await page.getByRole('button', { name: 'Verify Code' }).click();
  await page.waitForURL(u => u.pathname === '/reset-password', { timeout: 10000 });
  await page.getByPlaceholder(/Minimum \d+ characters/).fill('NewOtpPass123');
  await page.getByPlaceholder('Re-enter new password').fill('NewOtpPass123');
  await page.getByRole('button', { name: 'Reset Password' }).click();
  ok('password reset after correct code', await visibleSoon(page.getByText('Password Reset Complete')));
  await uiLogin(email, 'NewOtpPass123');
  ok('customer logs in with the new password', page.url().endsWith('/shop'));
  await finish();
}

// 1. Admin creates a store with its own login from the UI
await page.goto(APP);
let m0 = mark();
await uiLogin('admin@test.io', 'AdminPass123');
ok('admin lands on /admin', page.url().endsWith('/admin'));
ok('admin still loads agents / activities / abandoned carts (200)',
  adminOnlySince(m0).length >= 3 && adminOnlySince(m0).every(e => e.status === 200));
await page.goto(`${APP}/admin/stores`);
await page.getByRole('button', { name: /create new store/i }).click();
await page.getByPlaceholder("e.g. Rahul's Electronics Hub").fill(`UI Store ${RUN}`);
await page.getByPlaceholder('Your short brand promise').fill('Fresh daily');
await page.getByPlaceholder('Mumbai').fill('Pune');
await page.getByPlaceholder('Rahul Sharma').fill('Priya Store Manager');
await page.getByPlaceholder('owner@store.com').fill(`${USERNAME}@test.io`);
await page.getByPlaceholder('mystore01').fill(USERNAME);
await page.getByTitle('Generate password').first().click();
const password = await page.locator('input[autocomplete="new-password"]').first().inputValue();
await shot('01-admin-create-store-login');
await page.getByRole('button', { name: /create store \(pending activation\)/i }).click();
await page.waitForTimeout(1500);
await shot('02-admin-store-created');
ok('create modal closed after success', !(await page.getByPlaceholder('mystore01').isVisible().catch(() => false)));
ok('generated password length ≥ 8', password.length >= 8);

// Activate it and look at Login Access
await page.getByRole('button', { name: /all status/i }).click().catch(() => {});
await page.getByPlaceholder('Search stores, owners, subdomains...').fill(`UI Store ${RUN}`);
await page.getByRole('button', { name: 'Details' }).first().click();
await page.getByRole('button', { name: /login access/i }).click();
await page.waitForTimeout(500);
ok('Login Access shows the User ID', await page.getByText(USERNAME, { exact: true }).isVisible());
await shot('03-admin-login-access');
await page.getByRole('button', { name: /activate store/i }).click().catch(() => {});
await page.waitForTimeout(800);


// 2. Store logs in with User ID
m0 = mark();
await uiLogin(USERNAME, password);
ok('store login with User ID lands on /store', page.url().endsWith('/store'));
ok('store login makes no admin-only API calls (no 403s)', adminOnlySince(m0).length === 0, JSON.stringify(adminOnlySince(m0)));
await page.waitForTimeout(800);
await shot('04-store-dashboard');
ok('store dashboard shows Customer Reviews card', await page.getByText('Customer Reviews').isVisible());
const storeToken = await page.evaluate(() => localStorage.getItem('ai_access'));
const me = await api('GET', '/auth/me', undefined, storeToken);
const storeId = me.data.storeId;

// Store cannot open admin pages (frontend guard) — and backend refuses too
await page.goto(`${APP}/admin/stores`);
await page.waitForLoadState('networkidle');
ok('store redirected away from /admin', !page.url().includes('/admin'));

// 3. Customer places an order (API) for that store
const email = `ui_cust_${RUN}@test.io`;
await api('POST', '/auth/signup', { email, password: 'CustPass123', name: 'UI Customer', role: 'customer' });
const cust = (await api('POST', '/auth/signin', { email, password: 'CustPass123' })).data;
const productId = sql(`insert into products (store_id,name,price,stock,status) values ('${storeId}','Masala Chai Pack',180,20,'active') returning id`).split('\n')[0];
const order = (await api('POST', '/orders', {
  customerName: 'UI Customer', customerEmail: email, storeId, storeName: `UI Store ${RUN}`,
  items: [{ productId, productName: 'Masala Chai Pack', productIcon: '🍵', productColor: '#f59e0b', quantity: 2, price: 180, commission: 10 }],
  subtotal: 360, total: 360, commissionTotal: 36, adminRevenue: 36, paymentMethod: 'cod', paymentStatus: 'paid', address: '12 MG Road', city: 'Pune',
}, cust.accessToken)).data;

// 4. Store drives the order: Accept → Dispatch → Mark Delivered
await uiLogin(USERNAME, password);
await page.goto(`${APP}/store/orders`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
await shot('05-store-orders-pending');
for (const label of ['Accept Order', 'Dispatch', 'Mark Delivered']) {
  await page.getByTitle(label).first().click();
  await page.waitForTimeout(900);
}
const final = await api('GET', `/orders/${order.id}`, undefined, cust.accessToken);
ok('order reached delivered through store UI', final.data?.status === 'delivered');
await page.getByTitle('View details').first().click();
await page.waitForTimeout(900);
await shot('06-store-order-details-timeline');
ok('store detail shows status history', await page.getByText('Status History').isVisible());

// 5. Customer tracks and reviews
m0 = mark();
await uiLogin(email, 'CustPass123');
ok('customer login makes no admin-only API calls (no 403s)', adminOnlySince(m0).length === 0, JSON.stringify(adminOnlySince(m0)));
await page.goto(`${APP}/shop/orders`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
await shot('07-customer-orders');
await page.getByRole('button', { name: 'Track Order' }).first().click();
await page.waitForTimeout(1000);
ok('customer sees Dispatched step in timeline', await page.getByText('Dispatched').last().isVisible());
await shot('08-customer-tracking-modal');
await page.keyboard.press('Escape');
await page.locator('button:has-text("✕"), [aria-label="Close"]').first().click().catch(() => {});
await page.goto(`${APP}/shop/orders`);
await page.waitForLoadState('networkidle');
await page.getByRole('button', { name: /^Rate/ }).first().click();
await page.locator('.max-w-sm button:has(svg)').nth(4).click(); // 5th star
await page.getByPlaceholder('Tell us about your experience (optional)…').fill('Loved it!');
await shot('09-customer-review');
await page.getByRole('button', { name: 'Submit Review' }).click();
await page.waitForTimeout(1000);
ok('customer order shows Reviewed', await page.getByText('Reviewed').first().isVisible());

// 5b. Checkout: a failed order write must not confirm the order or empty the cart
const mCheckout = mark();
await page.goto(`${APP}/shop/product/${productId}`);
await page.getByRole('button', { name: /Add to Cart/ }).first().click();
await page.goto(`${APP}/shop/checkout`);
await page.getByPlaceholder('First name').fill('UI');
await page.getByPlaceholder('Last name').fill('Customer');
await page.getByPlaceholder('House / Flat / Block no., Building name').fill('12 MG Road');
await page.getByPlaceholder('City').fill('Pune');
await page.getByPlaceholder('400001').fill('411001');
await page.getByRole('button', { name: /Continue to Payment/ }).click();
await page.getByText('Cash on Delivery').click();
const ordersBefore = (await api('GET', '/orders', undefined, cust.accessToken)).data.length;
const failOrderCreate = (route) => route.request().method() === 'POST'
  ? (simulated.add(route.request()), route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Simulated database failure' }) }))
  : route.continue();
await page.route(`${API}/orders`, failOrderCreate);
await page.getByRole('button', { name: /Place Order/ }).click();
ok('failed order write shows the error, not a confirmation',
  await visibleSoon(page.getByText(/Failed to place order: Simulated database failure/))
  && !(await page.getByText('Order Placed Successfully!').isVisible()));
await shot('09b-checkout-failed');
await page.unroute(`${API}/orders`, failOrderCreate);
await page.getByRole('button', { name: /Place Order/ }).click();
ok('retry with the kept cart places a real order', await visibleSoon(page.getByText('Order Placed Successfully!'))
  && (await api('GET', '/orders', undefined, cust.accessToken)).data.length === ordersBefore + 1);
await page.waitForLoadState('networkidle');
const refused = apiLog.slice(mCheckout).filter(e => e.status === 401 || e.status === 403);
ok('checkout makes no refused (401/403) API calls', refused.length === 0, JSON.stringify(refused));

// 5c. A saved cart with a stale demo item ("demo_p1") is cleaned on load
await page.goto(`${APP}/shop/product/${productId}`);
await page.getByRole('button', { name: /Add to Cart/ }).first().click();
await page.waitForTimeout(300);
await page.evaluate(() => {
  const saved = JSON.parse(localStorage.getItem('askindia-store'));
  const real = saved.state.cart[0];
  saved.state.cart.push({ product: { ...real.product, id: 'demo_p1', name: 'Wireless Bluetooth Earbuds' }, quantity: 1 });
  localStorage.setItem('askindia-store', JSON.stringify(saved));
});
await page.goto(`${APP}/shop/cart`);
await page.waitForLoadState('networkidle');
const cartIds = await page.evaluate(() => JSON.parse(localStorage.getItem('askindia-store')).state.cart.map(i => i.product.id));
ok('F. stale demo_p1 removed from the restored cart, real item kept',
  !(await page.getByText('Wireless Bluetooth Earbuds').isVisible()) && await page.getByText('Masala Chai Pack').first().isVisible(),
  JSON.stringify(cartIds));
await page.goto(`${APP}/shop/checkout`);
// The earlier checkout saved this customer's address: checkout lists it and
// offers "add a new one" — enter the address again as a returning customer would.
await page.locator('input[placeholder="First name"], button:has-text("add a new one")').first().waitFor();
if (!(await page.getByPlaceholder('First name').isVisible())) await page.getByRole('button', { name: 'add a new one' }).click();
await page.getByPlaceholder('First name').fill('UI');
await page.getByPlaceholder('Last name').fill('Customer');
await page.getByPlaceholder('House / Flat / Block no., Building name').fill('12 MG Road');
await page.getByPlaceholder('City').fill('Pune');
await page.getByPlaceholder('400001').fill('411001');
await page.getByRole('button', { name: /Continue to Payment/ }).click();
await page.getByText('Cash on Delivery').click();
const beforeClean = (await api('GET', '/orders', undefined, cust.accessToken)).data;
await page.getByRole('button', { name: /Place Order/ }).click();
const placed = await visibleSoon(page.getByText('Order Placed Successfully!'));
const newOrder = (await api('GET', '/orders', undefined, cust.accessToken)).data.find(o => !beforeClean.some(b => b.id === o.id));
ok('G. checkout with the cleaned cart succeeds with only real items', placed && !!newOrder
  && newOrder.items.every(i => i.productId === productId), JSON.stringify(newOrder?.items?.map(i => i.productId)));

// 6. Store sees the review on its dashboard
await uiLogin(USERNAME, password);
await page.waitForTimeout(1000);
ok('store dashboard lists the review', await page.getByText('Loved it!').isVisible());
await shot('10-store-dashboard-review');

// 7. Forgot password (OTP off → reset-link flow, still reachable from login)
await page.evaluate(() => localStorage.clear());
await page.goto(`${APP}/login`);
const forgotLink = page.getByRole('button', { name: 'Forgot password?' });
ok('login page shows "Forgot password?" (OTP off)', await visibleSoon(forgotLink));
await forgotLink.click();
ok('forgot-password shows existing link flow (OTP disabled)', await visibleSoon(page.getByRole('button', { name: 'Send Reset Link' })));
await shot('11-forgot-password');
await page.getByPlaceholder('you@example.com').fill('admin@test.io');
await page.getByRole('button', { name: 'Send Reset Link' }).click();
ok('reset link emailed, no OTP sent', await visibleSoon(page.getByText('Check your inbox'))
  && mailsTo('admin@test.io', /Subject: Reset your AskIndia password/).length > 0
  && mailsTo('admin@test.io', /Subject: Your AskIndia password reset code/).length === 0);

// 8. PWA manifest icons exist and are real PNGs of the declared size
const manifest = await (await fetch(`${APP}/site.webmanifest`)).json();
const iconChecks = await Promise.all([...manifest.icons.map(i => i.src), '/apple-touch-icon.png'].map(async (src) => {
  const res = await fetch(APP + src);
  const buf = Buffer.from(await res.arrayBuffer());
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const declared = manifest.icons.find(i => i.src === src)?.sizes;
  const size = png ? `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}` : '';
  return res.status === 200 && png && (!declared || declared === size) ? null : `${src} (${res.status}, png=${png}, ${size})`;
}));
ok('manifest + apple-touch icons load as valid PNGs of the declared size', iconChecks.every(c => c === null), iconChecks.filter(Boolean).join('; '));
ok('no API 5xx during the run', !apiLog.some(e => e.status >= 500), JSON.stringify(apiLog.filter(e => e.status >= 500)));

await finish();

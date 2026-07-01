// Test with casesensitive + verify session matches
import http from 'node:http';

const SBD = '42008901';
const HATINH_BASE = 'http://tracuudiemthi.hatinh.edu.vn';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
const ANTICAPTCHA_KEY = '713350abe4798883ca27c52e080fb393';

function httpReq(method: string, url: string, headers: Record<string, string> = {}, body?: string): Promise<{
  statusCode: number; rawHeaders: string[]; body: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const opts: http.RequestOptions = {
      hostname: urlObj.hostname, port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search, method,
      headers: { 'User-Agent': UA, ...headers },
    };
    if (body) opts.headers!['Content-Length'] = Buffer.byteLength(body).toString();
    const req = http.request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, rawHeaders: res.rawHeaders, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function test() {
  // Step 1: Visit homepage first to create a session
  console.log('=== Step 1: Visit homepage ===');
  const homeRes = await httpReq('GET', HATINH_BASE + '/');
  console.log('Home status:', homeRes.statusCode);
  
  // Check if homepage sets cookie
  let sessionFromHome = '';
  for (let i = 0; i < homeRes.rawHeaders.length; i += 2) {
    if (homeRes.rawHeaders[i].toLowerCase() === 'set-cookie') {
      console.log('Home Set-Cookie:', homeRes.rawHeaders[i+1]);
      const m = homeRes.rawHeaders[i+1].match(/ASP\.NET_SessionId=([^;]+)/);
      if (m) sessionFromHome = `ASP.NET_SessionId=${m[1]}`;
    }
  }

  // Step 2: Get captcha - send session from homepage (or fake)
  console.log('\n=== Step 2: Get captcha ===');
  const cookieToSend = sessionFromHome || `ASP.NET_SessionId=fake${Date.now().toString(36)}`;
  console.log('Sending cookie:', cookieToSend);
  
  const captchaRes = await httpReq('GET', `${HATINH_BASE}/TraCuu/GetCaptcha?time=${Date.now()}&choose=1`, {
    'Cookie': cookieToSend, 'Referer': `${HATINH_BASE}/`,
  });
  
  // Check what session comes back
  let sessionFromCaptcha = '';
  for (let i = 0; i < captchaRes.rawHeaders.length; i += 2) {
    if (captchaRes.rawHeaders[i].toLowerCase() === 'set-cookie') {
      console.log('Captcha Set-Cookie:', captchaRes.rawHeaders[i+1]);
      const m = captchaRes.rawHeaders[i+1].match(/ASP\.NET_SessionId=([^;]+)/);
      if (m) sessionFromCaptcha = `ASP.NET_SessionId=${m[1]}`;
    }
  }
  
  // Use the session from captcha response (this is the one tied to the captcha)
  const sessionForSearch = sessionFromCaptcha || cookieToSend;
  console.log('Session for search:', sessionForSearch);
  console.log('Captcha size:', captchaRes.body.length);
  
  const b64 = captchaRes.body.toString('base64');

  // Step 3: Solve
  console.log('\n=== Step 3: Solve ===');
  const t1 = Date.now();
  const solveRes = await fetch('https://anticaptcha.top/api/captcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: ANTICAPTCHA_KEY, img: b64, type: 14, casesensitive: 1 }),
  });
  const solveJson = await solveRes.json() as { success: boolean; captcha: string; message: string };
  console.log('Solved in', Date.now() - t1, 'ms:', JSON.stringify(solveJson));

  if (!solveJson.success) { console.log('❌ Failed'); return; }
  console.log('✅ Captcha:', solveJson.captcha);

  // Step 4: Search
  console.log('\n=== Step 4: Search ===');
  const searchBody = `SOBAODANH=${SBD}&ConfirmCode=${encodeURIComponent(solveJson.captcha)}`;
  console.log('POST body:', searchBody);
  const searchRes = await httpReq('POST', `${HATINH_BASE}/TraCuu/TraCuu`,
    { 'Cookie': sessionForSearch, 'Origin': HATINH_BASE, 'Referer': `${HATINH_BASE}/`,
      'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    searchBody
  );
  console.log('Status:', searchRes.statusCode);
  console.log('Response:', searchRes.body.toString());
}

test().catch(console.error);

const assert = require('assert');
const http = require('http');
const app = require('../server/index');

let server;
const PORT = 3001;

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: 'localhost',
      port: PORT,
      path,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Starting API Tests...');
  server = app.listen(PORT);

  try {
    // 1. Test GET /api/config
    const cfgRes = await request('/api/config');
    assert.strictEqual(cfgRes.status, 200, 'Config endpoint status should be 200');
    assert.ok(cfgRes.body.email, 'Config should include email');
    console.log('PASS: GET /api/config');

    // 2. Test GET /api/services
    const srvRes = await request('/api/services');
    assert.strictEqual(srvRes.status, 200);
    assert.ok(Array.isArray(srvRes.body), 'Services should be an array');
    console.log('PASS: GET /api/services');

    // 3. Test POST /api/contact
    const contactRes = await request('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Test User',
      email: 'test@example.com',
      message: 'Hello world'
    });
    assert.strictEqual(contactRes.status, 201);
    assert.strictEqual(contactRes.body.success, true);
    console.log('PASS: POST /api/contact');

    // 4. Test POST /api/auth/login with default credentials
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: 'admin',
      password: 'admin12'
    });
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.body.token, 'Login should return token');
    const token = loginRes.body.token;
    console.log('PASS: POST /api/auth/login (admin/admin12)');

    // 5. Test GET /api/admin/dashboard
    const dashRes = await request('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(dashRes.status, 200);
    assert.ok(dashRes.body.unreadMessages !== undefined, 'Dashboard should return metrics');
    console.log('PASS: GET /api/admin/dashboard');

    // 6. Test Password Change
    const changePassRes = await request('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      currentPassword: 'admin12',
      newPassword: 'newadminpass123'
    });
    assert.strictEqual(changePassRes.status, 200);
    assert.strictEqual(changePassRes.body.success, true);
    console.log('PASS: POST /api/auth/change-password');

    // Revert password back to admin12 for clean slate
    await request('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      currentPassword: 'newadminpass123',
      newPassword: 'admin12'
    });

    console.log('\nALL API TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();

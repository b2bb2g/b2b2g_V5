import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Load server-only TypeScript with explicit dependency mocks, without Next runtime.
function load(path, dependencies = {}) {
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function('require', 'exports', outputText)((name) => {
    if (name === 'server-only') return {};
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected import: ${name}`);
    return dependencies[name];
  }, exports);
  return exports;
}

const { createCaptchaBypassFetch } = load('lib/supabase/captcha-fetch.ts');
const origin = 'https://project.supabase.co';

test('only the four intended POST auth operations receive server credentials', async () => {
  for (const path of ['/auth/v1/signup', '/auth/v1/recover', '/auth/v1/resend', '/auth/v1/token?grant_type=password']) {
    const transport = createCaptchaBypassFetch(origin, 'server-secret', async (request, options) => {
      assert.equal(request.headers.get('Authorization'), 'Bearer server-secret');
      assert.equal(request.headers.get('apikey'), 'server-secret');
      assert.equal(options.redirect, 'error');
      assert.equal(await request.text(), '{"email":"test@example.invalid"}');
      return new Response('{}');
    });
    await transport(`${origin}${path}`, { method: 'POST', body: '{"email":"test@example.invalid"}' });
  }
});

test('database, admin, refresh, GET and foreign-origin requests retain user credentials', async () => {
  for (const [url, method] of [
    [`${origin}/rest/v1/profiles`, 'POST'],
    [`${origin}/auth/v1/admin/users`, 'POST'],
    [`${origin}/auth/v1/token?grant_type=refresh_token`, 'POST'],
    [`${origin}/auth/v1/signup`, 'GET'],
    ['https://other.example/auth/v1/signup', 'POST'],
  ]) {
    const transport = createCaptchaBypassFetch(origin, 'server-secret', async (request) => {
      assert.equal(request.headers.get('Authorization'), 'Bearer user-token');
      assert.equal(request.headers.get('apikey'), 'public-key');
      return new Response('{}');
    });
    await transport(url, { method, headers: { Authorization: 'Bearer user-token', apikey: 'public-key' } });
  }
});

test('server policy defaults OFF, honors ON, and fails closed on database errors', async () => {
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-secret';
  process.env.NEXT_PUBLIC_SUPABASE_URL = origin;
  try {
    for (const [data, error, enabled] of [[null, null, false], [{value:false}, null, false], [{value:true}, null, true], [null, new Error('unavailable'), null]]) {
      const calls = [];
      const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data, error }) };
      const client = { from: () => query };
      const { createAuthClient } = load('lib/supabase/auth-client.ts', {
        '@/lib/supabase/server': { createClient: async (options) => { calls.push(options); return client; } },
        '@/lib/supabase/captcha-fetch': { createCaptchaBypassFetch },
      });
      if (error) {
        await assert.rejects(createAuthClient(), /unavailable/);
        assert.equal(calls.length, 1);
      } else {
        const result = await createAuthClient(true);
        assert.equal(result.captchaEnabled, enabled);
        assert.equal(calls.length, enabled ? 1 : 2);
        assert.equal(calls.at(-1).sessionOnly, true);
        assert.equal(typeof calls.at(-1).authFetch, enabled ? 'undefined' : 'function');
      }
    }
  } finally {
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  }
});

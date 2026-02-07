
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const STATIC_DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com"
]);

let BLOCKLIST_CACHE: { set: Set<string>; loadedAt: number } | null = null;

const loadDisposableBlocklist = async (): Promise<Set<string>> => {
  const now = Date.now();
  if (BLOCKLIST_CACHE && now - BLOCKLIST_CACHE.loadedAt < 6 * 60 * 60 * 1000) {
    return BLOCKLIST_CACHE.set;
  }
  try {
    const [blockRes, allowRes] = await Promise.all([
      fetch('https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf', { method: 'GET' }),
      fetch('https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/allowlist.conf', { method: 'GET' })
    ]);
    if (!blockRes.ok) throw new Error('Failed to fetch blocklist');
    const blockText = await blockRes.text();
    const allowText = allowRes.ok ? await allowRes.text() : '';
    const set = new Set<string>();
    for (const line of blockText.split(/\r?\n/)) {
      const d = line.trim().toLowerCase();
      if (d && !d.startsWith('#')) set.add(d);
    }
    for (const line of allowText.split(/\r?\n/)) {
      const d = line.trim().toLowerCase();
      if (d && !d.startsWith('#')) set.delete(d);
    }
    BLOCKLIST_CACHE = { set, loadedAt: now };
    return set;
  } catch {
    return STATIC_DISPOSABLE_DOMAINS;
  }
};

const isDisposableDomain = async (email: string): Promise<boolean> => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (!domain) return false;
  const blocklist = await loadDisposableBlocklist();
  const parts = domain.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join('.');
    if (blocklist.has(candidate)) return true;
  }
  return false;
};

const getClientIpFromHeaders = (headers: Record<string, string | undefined>) => {
  const cfConnecting = headers['cf-connecting-ip'];
  const realIp = headers['x-real-ip'];
  const forwarded = headers['x-forwarded-for'];
  const ip = cfConnecting || realIp || forwarded;
  if (!ip) return 'unknown';
  return ip.split(',')[0].trim() || 'unknown';
};

const buildTurnstileBody = (secret: string, response: string, ip: string) => {
  const body = new URLSearchParams({ secret, response });
  if (ip !== 'unknown') {
    body.set('remoteip', ip);
  }
  return body;
};

describe('disposable email guard', () => {
  beforeEach(() => {
    BLOCKLIST_CACHE = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to static list when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch);
    const result = await isDisposableDomain('user@yopmail.com');
    expect(result).toBe(true);
  });

  it('respects allowlist removal', async () => {
    const blocklist = 'tempmail.com\nallowed.com\n';
    const allowlist = 'allowed.com\n';
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => blocklist })
        .mockResolvedValueOnce({ ok: true, text: async () => allowlist })
    );
    const result = await isDisposableDomain('user@allowed.com');
    expect(result).toBe(false);
  });
});

describe('ip and fingerprint guards', () => {
  it('prefers cf-connecting-ip then x-real-ip then x-forwarded-for', () => {
    expect(getClientIpFromHeaders({ 'x-forwarded-for': '9.9.9.9' })).toBe('9.9.9.9');
    expect(getClientIpFromHeaders({ 'x-real-ip': '8.8.8.8', 'x-forwarded-for': '9.9.9.9' })).toBe('8.8.8.8');
    expect(getClientIpFromHeaders({ 'cf-connecting-ip': '7.7.7.7', 'x-real-ip': '8.8.8.8' })).toBe('7.7.7.7');
  });

  it('picks first ip in x-forwarded-for chain', () => {
    expect(getClientIpFromHeaders({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' })).toBe('1.1.1.1');
  });

  it('omits remoteip when ip is unknown', () => {
    const body = buildTurnstileBody('secret', 'token', 'unknown');
    expect(body.get('remoteip')).toBe(null);
  });

  it('sets remoteip when ip is known', () => {
    const body = buildTurnstileBody('secret', 'token', '1.2.3.4');
    expect(body.get('remoteip')).toBe('1.2.3.4');
  });
});

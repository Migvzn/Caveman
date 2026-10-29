/* VAYNORA House — API de l'Espace équipe (fonction serverless Vercel, sans dépendance).
   Stockage : Redis Upstash (intégration Vercel Marketplace), via son API REST.
   Rôles : owner (tout), associe (tout ; gère les managers et chatters), manager (tout sauf les comptes),
   chatter (formation + ses chiffres). Les comptes se créent par invitation (lien à usage unique) ou directement. */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COLS = ['models', 'revenue', 'chatters', 'cmonths', 'expenses', 'recruits'];
const ROLES = ['owner', 'associe', 'manager', 'chatter'];
const RANK = { owner: 3, associe: 2, manager: 1, chatter: 0 };
const STAFF = ['owner', 'associe', 'manager'], ADMIN = ['owner', 'associe'];
const INVITE_DAYS = 7, MAX_INVITES = 50;
const SUB_TYPES = ['creatrice', 'equipe', 'contact'];
const MAX_ITEM = 20000, MAX_OPS = 3000, SESSION_DAYS = 30;
const P = 'vnr:';

/* ── Redis (REST Upstash) ───────────────────────────────── */
function redisEnv() {
  const env = process.env;
  let url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL, token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    for (const k of Object.keys(env)) {
      if (!url && /(KV_REST_API_URL|REDIS_REST_URL)$/.test(k)) url = env[k];
      if (!token && /(KV_REST_API_TOKEN|REDIS_REST_TOKEN)$/.test(k) && !/READ_ONLY/.test(k)) token = env[k];
    }
  }
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
async function pipe(cmds) {
  const r = redisEnv();
  const res = await fetch(r.url + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + r.token, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!res.ok) throw new Error('redis ' + res.status);
  const out = await res.json();
  return out.map(x => { if (x.error) throw new Error('redis: ' + x.error); return x.result; });
}
const one = async (...cmd) => (await pipe([cmd]))[0];
const hashToObj = arr => { const o = {}; for (let i = 0; i < (arr || []).length; i += 2) { try { o[arr[i]] = JSON.parse(arr[i + 1]); } catch (e) { o[arr[i]] = arr[i + 1]; } } return o; };

/* ── Outils HTTP ────────────────────────────────────────── */
function send(res, status, body, headers) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (headers) for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 4e6) throw Object.assign(new Error('trop volumineux'), { status: 413 }); chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch (e) { return {}; }
}
const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket && req.socket.remoteAddress || '?').split(',')[0].trim();
const fail = (status, msg) => Object.assign(new Error(msg), { status });
async function limit(key, max, seconds) {
  const n = await one('INCR', P + 'rl:' + key);
  if (n === 1) await one('EXPIRE', P + 'rl:' + key, String(seconds));
  if (n > max) throw fail(429, 'Trop de tentatives. Réessayez un peu plus tard.');
}
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const uid = () => Date.now().toString(36) + crypto.randomBytes(5).toString('hex');

/* ── Mots de passe & sessions ───────────────────────────── */
function hashPw(pw, salt) { salt = salt || crypto.randomBytes(16).toString('hex'); return { salt, hash: crypto.scryptSync(String(pw), salt, 64).toString('hex') }; }
function checkPw(pw, u) { const h = crypto.scryptSync(String(pw), u.salt, 64); const ref = Buffer.from(u.hash, 'hex'); return ref.length === h.length && crypto.timingSafeEqual(h, ref); }
function tempPassword() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; return Array.from(crypto.randomBytes(12), b => A[b % A.length]).join(''); }
function secret() { const r = redisEnv(); return process.env.SESSION_SECRET || crypto.createHash('sha256').update('vaynora-session|' + (r ? r.token : '')).digest(); }
const b64u = b => Buffer.from(b).toString('base64url');
function sign(payload) { const body = b64u(JSON.stringify(payload)); return body + '.' + b64u(crypto.createHmac('sha256', secret()).update(body).digest()); }
function verify(token) {
  if (!token || token.indexOf('.') < 0) return null;
  const [body, mac] = token.split('.');
  const good = b64u(crypto.createHmac('sha256', secret()).update(body).digest());
  if (mac.length !== good.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); return p.e > Date.now() ? p : null; } catch (e) { return null; }
}
function cookieOf(req, name) { const m = String(req.headers.cookie || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)')); return m ? decodeURIComponent(m[1]) : ''; }
function sessionCookie(u) {
  const token = sign({ u: u.id, v: u.sv || 0, e: Date.now() + SESSION_DAYS * 864e5 });
  return `vnr_s=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}
const clearCookie = 'vnr_s=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
async function currentUser(req) {
  const p = verify(cookieOf(req, 'vnr_s')); if (!p) return null;
  const raw = await one('HGET', P + 'users', p.u); if (!raw) return null;
  const u = JSON.parse(raw); return (u.sv || 0) === p.v ? u : null;
}
const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, chatterId: u.chatterId || '', mustChange: !!u.mustChange, created: u.created });
const need = (u, roles) => { if (!u) throw fail(401, 'Session expirée : reconnectez-vous.'); if (roles && !roles.includes(u.role)) throw fail(403, 'Accès réservé.'); };
/* Le propriétaire gère tout le monde ; un associé gère seulement les rôles en dessous du sien (managers, chatters). */
const canAssign = (u, role) => u.role === 'owner' || RANK[role] < RANK[u.role];
const ONLY_OWNER = 'Réservé au propriétaire : un associé gère les managers et les chatters.';
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/* ── Invitations ─────────────────────────────────────────
   Le lien contient un jeton aléatoire ; seule son empreinte SHA-256 est stockée (hash vnr:invites). */
const tokenHash = t => crypto.createHash('sha256').update(String(t)).digest('hex');
const newToken = () => crypto.randomBytes(24).toString('base64url');
const invPub = i => ({ id: i.id, role: i.role, name: i.name || '', email: i.email || '', chatterId: i.chatterId || '', byName: i.byName || '', created: i.created, expires: i.expires });
async function allInvites() {
  const raw = await one('HGETALL', P + 'invites'), now = Date.now(), live = [], dead = [];
  for (let k = 0; k < (raw || []).length; k += 2) {
    let i; try { i = JSON.parse(raw[k + 1]); } catch (e) { dead.push(raw[k]); continue; }
    if (Date.parse(i.expires) > now) live.push(Object.assign(i, { key: raw[k] })); else dead.push(raw[k]);
  }
  if (dead.length) await one('HDEL', P + 'invites', ...dead);
  return live.sort((a, c) => a.created < c.created ? 1 : -1);
}
async function inviteByToken(token) {
  token = str(token, 100);
  if (token.length < 20) return null;
  const raw = await one('HGET', P + 'invites', tokenHash(token));
  const i = raw ? JSON.parse(raw) : null;
  return i && Date.parse(i.expires) > Date.now() ? i : null;
}

/* Le compte propriétaire ne peut être créé qu'avec le code d'accès de la formation :
   on vérifie qu'il déchiffre bien vaynora/formation.enc.json (PBKDF2-SHA256 + AES-256-GCM). */
function formationCodeOk(code) {
  let enc;
  try { enc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vaynora', 'formation.enc.json'), 'utf8')); }
  catch (e) { throw fail(500, 'formation.enc.json introuvable'); }
  try {
    const key = crypto.pbkdf2Sync(String(code).trim(), Buffer.from(enc.salt, 'base64'), enc.iter, 32, 'sha256');
    const ct = Buffer.from(enc.ct, 'base64'), d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(enc.iv, 'base64'));
    d.setAuthTag(ct.subarray(ct.length - 16)); d.update(ct.subarray(0, ct.length - 16)); d.final();
    return true;
  } catch (e) { return false; }
}

/* ── Données ─────────────────────────────────────────────── */
async function loadData(u) {
  const staff = STAFF.includes(u.role);
  const cmds = [['GET', P + 'settings'], ['GET', P + 'meta'], ['GET', P + 'fcode'], ['HGETALL', P + 'lessons:' + u.id], ['GET', P + 'path:' + u.id], ['HVALS', P + 'subs']];
  COLS.forEach(c => cmds.push(['HGETALL', P + 'col:' + c]));
  const r = await pipe(cmds);
  const settings = r[0] ? JSON.parse(r[0]) : {};
  const cols = {}; COLS.forEach((c, i) => cols[c] = Object.values(hashToObj(r[6 + i])));
  const newSubs = (r[5] || []).filter(x => { try { return JSON.parse(x).status === 'new'; } catch (e) { return false; } }).length;
  const out = { settings, meta: r[1] ? JSON.parse(r[1]) : {}, fcode: r[2] || '', lessons: hashToObj(r[3]), path: r[4] || '', me: pub(u) };
  if (staff) { out.cols = cols; out.newSubs = newSubs; }
  else {
    out.settings = { agency: settings.agency, currency: settings.currency };
    const ch = cols.chatters.find(c => c.id === u.chatterId);
    out.cols = { chatters: ch ? [ch] : [], cmonths: ch ? cols.cmonths.filter(m => m.chatter === ch.id) : [], models: ch ? cols.models.filter(m => (ch.models || []).includes(m.id)).map(m => ({ id: m.id, name: m.name, platform: m.platform, status: m.status })) : [], revenue: [], expenses: [], recruits: [] };
  }
  return out;
}
async function applyOps(u, ops) {
  if (!Array.isArray(ops) || ops.length > MAX_OPS) throw fail(400, 'Requête invalide.');
  const staff = STAFF.includes(u.role);
  const cmds = [];
  for (const op of ops) {
    if (!op || typeof op !== 'object') throw fail(400, 'Opération invalide.');
    if (op.c) {
      if (!staff) throw fail(403, 'Accès réservé.');
      if (!COLS.includes(op.c)) throw fail(400, 'Collection inconnue.');
      if (op.del) { cmds.push(['HDEL', P + 'col:' + op.c, str(op.del, 64)]); continue; }
      const it = op.put; if (!it || typeof it !== 'object' || typeof it.id !== 'string' || !it.id || it.id.length > 64) throw fail(400, 'Élément invalide.');
      const js = JSON.stringify(it); if (js.length > MAX_ITEM) throw fail(413, 'Élément trop volumineux.');
      cmds.push(['HSET', P + 'col:' + op.c, it.id, js]);
    } else if (op.settings) {
      if (!staff) throw fail(403, 'Accès réservé.');
      const js = JSON.stringify(op.settings); if (js.length > MAX_ITEM) throw fail(413, 'Réglages trop volumineux.');
      cmds.push(['SET', P + 'settings', js]);
    } else if (op.meta) {
      if (!staff) throw fail(403, 'Accès réservé.');
      cmds.push(['SET', P + 'meta', JSON.stringify({ demo: !!op.meta.demo })]);
    } else if (op.lessons) {
      const put = op.lessons.put || {}, del = op.lessons.del || [];
      const flat = []; Object.entries(put).slice(0, 500).forEach(([k, v]) => flat.push(str(k, 20), str(v, 20)));
      if (flat.length) cmds.push(['HSET', P + 'lessons:' + u.id, ...flat]);
      if (del.length) cmds.push(['HDEL', P + 'lessons:' + u.id, ...del.slice(0, 500).map(k => str(k, 20))]);
    } else if ('path' in op) {
      cmds.push(['SET', P + 'path:' + u.id, str(op.path, 40)]);
    } else throw fail(400, 'Opération inconnue.');
  }
  for (let i = 0; i < cmds.length; i += 400) await pipe(cmds.slice(i, i + 400));
  return cmds.length;
}

/* ── Actions ─────────────────────────────────────────────── */
const actions = {
  async status(req) {
    const [n] = await pipe([['HLEN', P + 'users']]);
    const u = n ? await currentUser(req) : null;
    return { db: true, setup: n > 0, user: u ? pub(u) : null };
  },
  async setup(req, b, ctx) {
    const name = str(b.name, 60), email = str(b.email, 120).toLowerCase(), pw = String(b.password || '');
    if (!name || !validEmail(email)) throw fail(400, 'Nom et email valides requis.');
    if (pw.length < 10) throw fail(400, 'Mot de passe : 10 caractères minimum.');
    await limit('setup:' + ipOf(req), 10, 3600);
    if (!formationCodeOk(b.fcode || '')) throw fail(403, "Code de la formation incorrect : seul le détenteur du code peut créer le compte propriétaire.");
    const lock = await one('SET', P + 'setuplock', '1', 'NX', 'EX', '30');
    if (!lock) throw fail(409, 'Création en cours : réessayez dans 30 secondes.');
    const n = await one('HLEN', P + 'users');
    if (n > 0) throw fail(409, 'Le compte propriétaire existe déjà : connectez-vous.');
    const u = Object.assign({ id: uid(), name, email, role: 'owner', sv: 0, created: new Date().toISOString() }, hashPw(pw));
    const cmds = [['HSET', P + 'users', u.id, JSON.stringify(u)], ['HSET', P + 'useridx', email, u.id]];
    cmds.push(['SET', P + 'fcode', str(b.fcode, 80)]);
    await pipe(cmds);
    ctx.headers['Set-Cookie'] = sessionCookie(u);
    return { ok: true, user: pub(u) };
  },
  async login(req, b, ctx) {
    const email = str(b.email, 120).toLowerCase();
    await limit('login:' + ipOf(req), 30, 900);
    await limit('loginu:' + email, 10, 900);
    const id = await one('HGET', P + 'useridx', email);
    const raw = id ? await one('HGET', P + 'users', id) : null;
    const u = raw ? JSON.parse(raw) : null;
    if (!u || !checkPw(b.password || '', u)) { if (!u) hashPw('x'); throw fail(401, 'Email ou mot de passe incorrect.'); }
    ctx.headers['Set-Cookie'] = sessionCookie(u);
    return { ok: true, user: pub(u) };
  },
  async logout(req, b, ctx) { ctx.headers['Set-Cookie'] = clearCookie; return { ok: true }; },
  async password(req, b, ctx, u) {
    need(u);
    if (!checkPw(b.old || '', u)) throw fail(400, 'Mot de passe actuel incorrect.');
    if (String(b.password || '').length < 10) throw fail(400, 'Nouveau mot de passe : 10 caractères minimum.');
    Object.assign(u, hashPw(b.password), { sv: (u.sv || 0) + 1, mustChange: false });
    await one('HSET', P + 'users', u.id, JSON.stringify(u));
    ctx.headers['Set-Cookie'] = sessionCookie(u);
    return { ok: true, user: pub(u) };
  },
  async data(req, b, ctx, u) { need(u); return loadData(u); },
  async sync(req, b, ctx, u) { need(u); return { ok: true, n: await applyOps(u, b.ops) }; },
  async fcode(req, b, ctx, u) { need(u, ['owner']); if (!formationCodeOk(b.fcode || '')) throw fail(400, 'Code incorrect : la formation ne s\'ouvre pas avec ce code.'); await one('SET', P + 'fcode', str(b.fcode, 80)); return { ok: true }; },
  async users(req, b, ctx, u) { need(u, ADMIN); const all = Object.values(hashToObj(await one('HGETALL', P + 'users'))); return { users: all.map(pub).sort((a, c) => a.created < c.created ? -1 : 1) }; },
  async userSave(req, b, ctx, u) {
    need(u, ADMIN);
    const name = str(b.name, 60), email = str(b.email, 120).toLowerCase(), role = ROLES.includes(b.role) ? b.role : 'chatter';
    if (!name || !validEmail(email)) throw fail(400, 'Nom et email valides requis.');
    const all = hashToObj(await one('HGETALL', P + 'users'));
    const taken = Object.values(all).find(x => x.email === email && x.id !== b.id);
    if (taken) throw fail(409, 'Cet email est déjà utilisé.');
    let x = b.id ? all[b.id] : null, temp = '';
    if (b.id && !x) throw fail(404, 'Compte introuvable.');
    if (x && x.id === u.id) { if (role !== u.role) throw fail(400, 'Vous ne pouvez pas changer votre propre rôle.'); }
    else if ((x && !canAssign(u, x.role)) || !canAssign(u, role)) throw fail(403, ONLY_OWNER);
    const cmds = [];
    if (!x) { temp = tempPassword(); x = Object.assign({ id: uid(), sv: 0, mustChange: true, created: new Date().toISOString() }, hashPw(temp)); }
    else if (x.email !== email) cmds.push(['HDEL', P + 'useridx', x.email]);
    Object.assign(x, { name, email, role, chatterId: str(b.chatterId, 64) });
    cmds.push(['HSET', P + 'users', x.id, JSON.stringify(x)], ['HSET', P + 'useridx', email, x.id]);
    await pipe(cmds);
    return { ok: true, user: pub(x), temp };
  },
  async userReset(req, b, ctx, u) {
    need(u, ADMIN);
    const raw = await one('HGET', P + 'users', str(b.id, 64)); if (!raw) throw fail(404, 'Compte introuvable.');
    const x = JSON.parse(raw), temp = tempPassword();
    if (x.id !== u.id && !canAssign(u, x.role)) throw fail(403, ONLY_OWNER);
    Object.assign(x, hashPw(temp), { sv: (x.sv || 0) + 1, mustChange: true });
    await one('HSET', P + 'users', x.id, JSON.stringify(x));
    return { ok: true, temp };
  },
  async userDel(req, b, ctx, u) {
    need(u, ADMIN);
    if (b.id === u.id) throw fail(400, 'Vous ne pouvez pas supprimer votre propre compte.');
    const raw = await one('HGET', P + 'users', str(b.id, 64)); if (!raw) throw fail(404, 'Compte introuvable.');
    const x = JSON.parse(raw);
    if (!canAssign(u, x.role)) throw fail(403, ONLY_OWNER);
    await pipe([['HDEL', P + 'users', x.id], ['HDEL', P + 'useridx', x.email], ['DEL', P + 'lessons:' + x.id], ['DEL', P + 'path:' + x.id]]);
    return { ok: true };
  },
  async submit(req, b) {
    const type = SUB_TYPES.includes(b.type) ? b.type : 'contact';
    if (b.website) return { ok: true };
    await limit('submit:' + ipOf(req), 8, 3600);
    const data = {};
    Object.entries(b.data && typeof b.data === 'object' ? b.data : {}).slice(0, 60).forEach(([k, v]) => { data[str(k, 80)] = str(v, 4000); });
    if (!Object.keys(data).length) throw fail(400, 'Formulaire vide.');
    const s = { id: uid(), type, status: 'new', at: new Date().toISOString(), subject: str(b.subject, 200), data };
    if (JSON.stringify(s).length > 40000) throw fail(413, 'Formulaire trop volumineux.');
    await one('HSET', P + 'subs', s.id, JSON.stringify(s));
    return { ok: true };
  },
  async subs(req, b, ctx, u) { need(u, STAFF); const all = Object.values(hashToObj(await one('HGETALL', P + 'subs'))); return { subs: all.sort((a, c) => a.at < c.at ? 1 : -1) }; },
  async subUpdate(req, b, ctx, u) {
    need(u, STAFF);
    const raw = await one('HGET', P + 'subs', str(b.id, 64)); if (!raw) throw fail(404, 'Introuvable.');
    const s = JSON.parse(raw); s.status = b.status === 'new' ? 'new' : 'done'; if (b.note != null) s.note = str(b.note, 2000);
    await one('HSET', P + 'subs', s.id, JSON.stringify(s));
    return { ok: true, sub: s };
  },
  async subDel(req, b, ctx, u) { need(u, STAFF); await one('HDEL', P + 'subs', str(b.id, 64)); return { ok: true }; },

  /* Invitations : créées par le propriétaire ou un associé, acceptées sans compte via le lien. */
  async invites(req, b, ctx, u) { need(u, ADMIN); return { invites: (await allInvites()).map(invPub) }; },
  async inviteCreate(req, b, ctx, u) {
    need(u, ADMIN);
    const role = ROLES.includes(b.role) ? b.role : 'associe', email = str(b.email, 120).toLowerCase();
    if (!canAssign(u, role)) throw fail(403, ONLY_OWNER);
    if (email && !validEmail(email)) throw fail(400, 'Email invalide.');
    if (email && await one('HEXISTS', P + 'useridx', email)) throw fail(409, 'Cet email a déjà un compte.');
    const live = await allInvites();
    if (live.length >= MAX_INVITES) throw fail(429, 'Trop d\'invitations en attente : révoquez-en avant d\'en créer de nouvelles.');
    const token = newToken(), now = Date.now();
    const i = { id: uid(), role, name: str(b.name, 60), email, chatterId: role === 'chatter' ? str(b.chatterId, 64) : '', by: u.id, byName: u.name, created: new Date(now).toISOString(), expires: new Date(now + INVITE_DAYS * 864e5).toISOString() };
    await one('HSET', P + 'invites', tokenHash(token), JSON.stringify(i));
    return { ok: true, invite: invPub(i), token };
  },
  async inviteRenew(req, b, ctx, u) {
    need(u, ADMIN);
    const i = (await allInvites()).find(x => x.id === b.id); if (!i) throw fail(404, 'Invitation introuvable ou expirée.');
    if (!canAssign(u, i.role)) throw fail(403, ONLY_OWNER);
    const token = newToken(), key = i.key; delete i.key;
    i.expires = new Date(Date.now() + INVITE_DAYS * 864e5).toISOString();
    await pipe([['HDEL', P + 'invites', key], ['HSET', P + 'invites', tokenHash(token), JSON.stringify(i)]]);
    return { ok: true, invite: invPub(i), token };
  },
  async inviteRevoke(req, b, ctx, u) {
    need(u, ADMIN);
    const i = (await allInvites()).find(x => x.id === b.id); if (!i) return { ok: true };
    if (!canAssign(u, i.role)) throw fail(403, ONLY_OWNER);
    await one('HDEL', P + 'invites', i.key);
    return { ok: true };
  },
  async inviteInfo(req, b) {
    await limit('invinfo:' + ipOf(req), 40, 900);
    const i = await inviteByToken(b.token);
    if (!i) throw fail(404, 'Cette invitation n\'est plus valable : elle a expiré, a été révoquée ou a déjà servi. Demandez un nouveau lien.');
    const settings = JSON.parse(await one('GET', P + 'settings') || '{}');
    return { invite: { role: i.role, name: i.name || '', email: i.email || '', byName: i.byName || '', expires: i.expires, agency: settings.agency || 'VAYNORA House' } };
  },
  async inviteAccept(req, b, ctx) {
    await limit('invacc:' + ipOf(req), 15, 3600);
    const i = await inviteByToken(b.token);
    if (!i) throw fail(404, 'Cette invitation n\'est plus valable : elle a expiré, a été révoquée ou a déjà servi. Demandez un nouveau lien.');
    const name = str(b.name, 60), email = i.email || str(b.email, 120).toLowerCase(), pw = String(b.password || '');
    if (!name || !validEmail(email)) throw fail(400, 'Nom et email valides requis.');
    if (pw.length < 10) throw fail(400, 'Mot de passe : 10 caractères minimum.');
    if (await one('HEXISTS', P + 'useridx', email)) throw fail(409, 'Cet email a déjà un compte : connectez-vous, ou utilisez une autre adresse.');
    const key = tokenHash(str(b.token, 100));
    // Usage unique : seule la requête qui supprime l'invitation crée le compte.
    if (!await one('HDEL', P + 'invites', key)) throw fail(404, 'Cette invitation vient déjà de servir.');
    const x = Object.assign({ id: uid(), name, email, role: i.role, chatterId: i.chatterId || '', sv: 0, invitedBy: i.by, created: new Date().toISOString() }, hashPw(pw));
    if (!await one('HSETNX', P + 'useridx', email, x.id)) { await one('HSET', P + 'invites', key, JSON.stringify(i)); throw fail(409, 'Cet email a déjà un compte.'); }
    await one('HSET', P + 'users', x.id, JSON.stringify(x));
    ctx.headers['Set-Cookie'] = sessionCookie(x);
    return { ok: true, user: pub(x) };
  }
};
const PUBLIC_POST = ['setup', 'login', 'logout', 'submit', 'inviteInfo', 'inviteAccept'];

module.exports = async (req, res) => {
  const a = String((req.query && req.query.a) || new URL(req.url, 'http://x').searchParams.get('a') || '');
  if (!redisEnv()) return send(res, a === 'submit' ? 503 : 200, a === 'submit' ? { error: 'nodb' } : { db: false });
  const fn = actions[a];
  if (!fn) return send(res, 404, { error: 'Action inconnue.' });
  const isGet = ['status', 'data', 'users', 'subs', 'invites'].includes(a);
  if (isGet ? req.method !== 'GET' : req.method !== 'POST') return send(res, 405, { error: 'Méthode non autorisée.' });
  if (!isGet && a !== 'submit' && req.headers['x-requested-with'] !== 'vaynora') return send(res, 403, { error: 'Requête refusée.' });
  const ctx = { headers: {} };
  try {
    const body = isGet ? {} : await readBody(req);
    const u = PUBLIC_POST.includes(a) || a === 'status' ? null : await currentUser(req);
    const out = await fn(req, body, ctx, u);
    send(res, 200, out, ctx.headers);
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error('[vaynora]', a, e);
    send(res, status, { error: status === 500 ? 'Erreur serveur. Réessayez dans un instant.' : e.message }, ctx.headers);
  }
};

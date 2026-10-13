import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const SQLITE_PATH = path.join(DATA_DIR, 'leaderboard.sqlite');
const JSON_PATH = path.join(DATA_DIR, 'leaderboard.json');

const VALID_MODES = new Set(['EASY', 'HACKER', 'CODE']);
const VALID_DURATIONS = new Set([30, 60]);

const DEMO_RECORDS = [
  {
    id: 'demo-cyber-kamil',
    nickname: 'CYBER_KAMIL',
    mode: 'HACKER',
    duration: 30,
    wpm: 94,
    accuracy: 98.4,
    errors: 4,
    correctChars: 235,
    totalChars: 239,
    score: 9102,
    createdAt: '2026-10-13T08:15:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-root-ania',
    nickname: 'ROOT_ANIA',
    mode: 'CODE',
    duration: 30,
    wpm: 82,
    accuracy: 97.2,
    errors: 6,
    correctChars: 205,
    totalChars: 211,
    score: 8523,
    createdAt: '2026-10-13T08:22:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-neo-bartek',
    nickname: 'NEO_BARTEK',
    mode: 'EASY',
    duration: 30,
    wpm: 88,
    accuracy: 96.5,
    errors: 8,
    correctChars: 220,
    totalChars: 228,
    score: 8195,
    createdAt: '2026-10-13T08:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-zero-marta',
    nickname: 'ZERO_MARTA',
    mode: 'HACKER',
    duration: 60,
    wpm: 79,
    accuracy: 99.1,
    errors: 4,
    correctChars: 395,
    totalChars: 399,
    score: 7758,
    createdAt: '2026-10-13T08:40:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-byte-tomek',
    nickname: 'BYTE_TOMEK',
    mode: 'EASY',
    duration: 60,
    wpm: 71,
    accuracy: 95.0,
    errors: 18,
    correctChars: 355,
    totalChars: 373,
    score: 6408,
    createdAt: '2026-10-13T08:45:00.000Z',
    isDemo: true,
  },
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Validates and sanitizes an incoming score submission on the server.
 */
export function validateScorePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload object' };
  }

  const id = typeof payload.id === 'string' ? payload.id.trim().slice(0, 64) : '';
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { valid: false, error: 'Invalid session ID' };
  }

  // Strip control characters and trim nickname
  const rawNick = typeof payload.nickname === 'string' ? payload.nickname : '';
  const cleanedNick = rawNick.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
  if (!cleanedNick || cleanedNick.length > 16) {
    return { valid: false, error: 'Invalid nickname (must be 1-16 chars without control chars)' };
  }

  const mode = payload.mode;
  if (!VALID_MODES.has(mode)) {
    return { valid: false, error: 'Invalid game mode' };
  }

  const duration = Number(payload.duration);
  if (!VALID_DURATIONS.has(duration)) {
    return { valid: false, error: 'Invalid duration' };
  }

  const wpm = Number(payload.wpm);
  const accuracy = Number(payload.accuracy);
  const errors = Number(payload.errors);
  const correctChars = Number(payload.correctChars);
  const totalChars = Number(payload.totalChars);
  const score = Number(payload.score);

  if (
    !Number.isFinite(wpm) || wpm < 0 || wpm > 350 ||
    !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100 ||
    !Number.isFinite(errors) || errors < 0 || errors > 10000 ||
    !Number.isFinite(correctChars) || correctChars < 0 || correctChars > 10000 ||
    !Number.isFinite(totalChars) || totalChars < 0 || totalChars > 20000 ||
    !Number.isFinite(score) || score < 0 || score > 100000
  ) {
    return { valid: false, error: 'Metrics out of valid bounds' };
  }

  if (correctChars > totalChars) {
    return { valid: false, error: 'correctChars cannot exceed totalChars' };
  }

  const createdAt =
    typeof payload.createdAt === 'string' && !Number.isNaN(Date.parse(payload.createdAt))
      ? new Date(payload.createdAt).toISOString()
      : new Date().toISOString();

  return {
    valid: true,
    record: {
      id,
      nickname: cleanedNick,
      mode,
      duration,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy * 10) / 10,
      errors: Math.round(errors),
      correctChars: Math.round(correctChars),
      totalChars: Math.round(totalChars),
      score: Math.round(score),
      createdAt,
      isDemo: Boolean(payload.isDemo),
    },
  };
}

class LeaderboardDatabase {
  constructor() {
    this.db = null;
    this.engine = 'json-file';
    this.init();
  }

  init() {
    ensureDataDir();
    try {
      // Node 22.5+ / Node 24 built-in SQLite support
      // Loaded dynamically or synchronously via createRequire to remain compatible
      import('node:sqlite')
        .then((sqliteModule) => {
          if (sqliteModule && sqliteModule.DatabaseSync) {
            this.db = new sqliteModule.DatabaseSync(SQLITE_PATH);
            this.db.exec(`
              CREATE TABLE IF NOT EXISTS scores (
                id TEXT PRIMARY KEY,
                nickname TEXT NOT NULL,
                mode TEXT NOT NULL,
                duration INTEGER NOT NULL,
                wpm INTEGER NOT NULL,
                accuracy REAL NOT NULL,
                errors INTEGER NOT NULL,
                correctChars INTEGER NOT NULL,
                totalChars INTEGER NOT NULL,
                score INTEGER NOT NULL,
                createdAt TEXT NOT NULL,
                isDemo INTEGER NOT NULL DEFAULT 0
              );
            `);
            this.engine = 'sqlite';
            // Migrate any existing JSON records into SQLite if SQLite is empty
            this.syncJsonToSqlite();
          }
        })
        .catch(() => {
          this.engine = 'json-file';
        });
    } catch {
      this.engine = 'json-file';
    }

    if (!fs.existsSync(JSON_PATH)) {
      fs.writeFileSync(JSON_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  readJsonRecords() {
    try {
      ensureDataDir();
      if (!fs.existsSync(JSON_PATH)) return [];
      const raw = fs.readFileSync(JSON_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  writeJsonRecords(records) {
    ensureDataDir();
    fs.writeFileSync(JSON_PATH, JSON.stringify(records, null, 2), 'utf-8');
  }

  syncJsonToSqlite() {
    if (!this.db) return;
    try {
      const countRow = this.db.prepare('SELECT COUNT(*) as cnt FROM scores').get();
      if (countRow && countRow.cnt === 0) {
        const jsonRecords = this.readJsonRecords();
        for (const rec of jsonRecords) {
          this.insertSqlite(rec);
        }
      }
    } catch {
      // Ignore migration errors
    }
  }

  insertSqlite(rec) {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO scores (
        id, nickname, mode, duration, wpm, accuracy, errors, correctChars, totalChars, score, createdAt, isDemo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      rec.id,
      rec.nickname,
      rec.mode,
      rec.duration,
      rec.wpm,
      rec.accuracy,
      rec.errors,
      rec.correctChars,
      rec.totalChars,
      rec.score,
      rec.createdAt,
      rec.isDemo ? 1 : 0
    );
  }

  getAllScores(includeDemo = false) {
    let records = [];
    if (this.db && this.engine === 'sqlite') {
      try {
        const query = includeDemo
          ? 'SELECT * FROM scores'
          : 'SELECT * FROM scores WHERE isDemo = 0';
        const rows = this.db.prepare(query).all();
        records = rows.map((r) => ({
          ...r,
          isDemo: Boolean(r.isDemo),
        }));
      } catch {
        records = this.readJsonRecords();
      }
    } else {
      records = this.readJsonRecords();
    }

    if (!includeDemo) {
      records = records.filter((r) => !r.isDemo);
    }

    // Sort deterministically: score DESC -> accuracy DESC -> wpm DESC -> createdAt ASC
    return records.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }

  addScore(record) {
    // Always keep JSON mirror updated for easy backup and inspection
    const jsonRecords = this.readJsonRecords();
    const existingIdx = jsonRecords.findIndex((r) => r.id === record.id);
    if (existingIdx === -1) {
      jsonRecords.push(record);
      this.writeJsonRecords(jsonRecords);
    }

    if (this.db && this.engine === 'sqlite') {
      this.insertSqlite(record);
    }
    return record;
  }

  seedDemoRecords() {
    for (const demo of DEMO_RECORDS) {
      this.addScore(demo);
    }
    return this.getAllScores(true);
  }

  clearDemoRecords() {
    const jsonRecords = this.readJsonRecords().filter((r) => !r.isDemo);
    this.writeJsonRecords(jsonRecords);

    if (this.db && this.engine === 'sqlite') {
      this.db.prepare('DELETE FROM scores WHERE isDemo = 1').run();
    }
    return this.getAllScores(false);
  }

  resetAllScores() {
    this.writeJsonRecords([]);
    if (this.db && this.engine === 'sqlite') {
      this.db.prepare('DELETE FROM scores').run();
    }
    return [];
  }
}

export const leaderboardDb = new LeaderboardDatabase();

/**
 * Connect-compatible HTTP middleware for /api/* routes.
 */
export function createApiMiddleware() {
  return (req, res, next) => {
    if (!req.url || !req.url.startsWith('/api/')) {
      return next();
    }

    const urlObj = new URL(req.url, 'http://localhost');
    const pathname = urlObj.pathname;

    const sendJson = (status, data) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
    };

    const readBody = () =>
      new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
          if (body.length > 100_000) {
            reject(new Error('Payload too large'));
          }
        });
        req.on('end', () => {
          if (!body) return resolve({});
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
        req.on('error', reject);
      });

    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(200, {
        status: 'ok',
        engine: leaderboardDb.engine,
      });
    }

    if (pathname === '/api/scores' && req.method === 'GET') {
      const includeDemo = urlObj.searchParams.get('includeDemo') === 'true';
      const scores = leaderboardDb.getAllScores(includeDemo);
      return sendJson(200, {
        scores,
        engine: leaderboardDb.engine,
      });
    }

    if (pathname === '/api/scores' && req.method === 'POST') {
      readBody()
        .then((body) => {
          const validation = validateScorePayload(body);
          if (!validation.valid) {
            return sendJson(400, { error: validation.error });
          }
          const saved = leaderboardDb.addScore(validation.record);
          return sendJson(201, {
            score: saved,
            engine: leaderboardDb.engine,
          });
        })
        .catch(() => sendJson(400, { error: 'Malformed JSON body' }));
      return;
    }

    if (pathname === '/api/scores/demo' && req.method === 'POST') {
      const scores = leaderboardDb.seedDemoRecords();
      return sendJson(200, { scores, engine: leaderboardDb.engine });
    }

    if (pathname === '/api/scores/demo' && req.method === 'DELETE') {
      const confirmHeader = req.headers['x-organizer-action'];
      if (confirmHeader !== 'confirm-clear-demo') {
        return sendJson(403, { error: 'Brak nagłówka potwierdzenia organizatora' });
      }
      const scores = leaderboardDb.clearDemoRecords();
      return sendJson(200, { scores, engine: leaderboardDb.engine });
    }

    if (pathname === '/api/scores/reset' && req.method === 'DELETE') {
      const confirmHeader = req.headers['x-organizer-action'];
      if (confirmHeader !== 'confirm-reset-all') {
        return sendJson(403, { error: 'Brak nagłówka potwierdzenia resetu' });
      }
      const scores = leaderboardDb.resetAllScores();
      return sendJson(200, { scores, engine: leaderboardDb.engine });
    }

    return sendJson(404, { error: 'Not found' });
  };
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function userFile(prefix, email) {
  const safe = String(email).trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
  return path.join(DATA_DIR, `${prefix}_${safe}.json`);
}

export function readUserJson(prefix, email, fallback) {
  ensureDataDir();
  const file = userFile(prefix, email);
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeUserJson(prefix, email, data) {
  ensureDataDir();
  fs.writeFileSync(userFile(prefix, email), JSON.stringify(data, null, 2), 'utf8');
}

export function deleteUserJson(prefix, email) {
  ensureDataDir();
  const file = userFile(prefix, email);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function listUserJsonByPrefix(prefix) {
  ensureDataDir();
  const needle = `${prefix}_`;
  return fs
    .readdirSync(DATA_DIR)
    .filter((name) => name.startsWith(needle) && name.endsWith('.json'))
    .map((name) => {
      const file = path.join(DATA_DIR, name);
      try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

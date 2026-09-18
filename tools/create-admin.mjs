import crypto from 'node:crypto';

const [emailArg, nameArg, passwordArg] = process.argv.slice(2);
if (!emailArg || !nameArg || !passwordArg) {
  console.error('Usage: node tools/create-admin.mjs <email> <name> <password>');
  process.exit(1);
}
if (passwordArg.length < 12) {
  console.error('Password must be at least 12 characters.');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const name = nameArg.trim();
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(passwordArg, salt, 210000, 32, 'sha256');
const id = crypto.randomUUID();
const esc = value => String(value).replaceAll("'", "''");

console.log(`INSERT INTO users (id, email, name, role, password_hash, password_salt) VALUES ('${esc(id)}','${esc(email)}','${esc(name)}','admin','${hash.toString('base64')}','${salt.toString('base64')}');`);

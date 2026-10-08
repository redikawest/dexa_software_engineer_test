// Creates the RSA key pair used to sign (private) and verify (public) login tokens.
// Run: npm run keys:generate   (add --force to replace existing keys, which logs everyone out)
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const dir = new URL('../keys/', import.meta.url);
const privatePath = new URL('jwt-private.pem', dir);
const publicPath = new URL('jwt-public.pem', dir);

if ((existsSync(privatePath) || existsSync(publicPath)) && !process.argv.includes('--force')) {
  console.log('keys/ already has a key pair. Use --force to replace it.');
  process.exit(0);
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

mkdirSync(dir, { recursive: true });
writeFileSync(privatePath, privateKey, { mode: 0o600 });
writeFileSync(publicPath, publicKey);
console.log('Created keys/jwt-private.pem and keys/jwt-public.pem');

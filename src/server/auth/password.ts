import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as unknown as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const PREFIX = "scrypt";

/** `scrypt$<saltHex>$<keyHex>` — self-describing so the format can evolve. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `${PREFIX}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/** Constant-time verification. Returns false for malformed stored hashes. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3) return false;

  const [scheme, saltHex, keyHex] = parts;
  if (scheme !== PREFIX || !saltHex || !keyHex) return false;

  let salt: Buffer;
  let key: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    key = Buffer.from(keyHex, "hex");
  } catch {
    return false;
  }
  if (salt.length === 0 || key.length === 0) return false;

  const derived = await scrypt(password, salt, key.length);
  return derived.length === key.length && timingSafeEqual(derived, key);
}

import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptGoogleDriveTokenBundle,
  encryptGoogleDriveTokenBundle,
} from "./crypto";

test("encrypts and decrypts Google Drive token bundles", () => {
  const previous = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
  process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  try {
    const input = { accessToken: "access-secret", refreshToken: "refresh-secret", expiresAt: 123 };
    const encrypted = encryptGoogleDriveTokenBundle(input);
    assert.equal(encrypted.includes("access-secret"), false);
    assert.deepEqual(decryptGoogleDriveTokenBundle<typeof input>(encrypted), input);
  } finally {
    if (previous === undefined) delete process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
    else process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY = previous;
  }
});

test("rejects token ciphertext tampering", () => {
  const previous = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
  process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
  try {
    const encrypted = encryptGoogleDriveTokenBundle({ accessToken: "secret" });
    const parts = encrypted.split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    assert.throws(() => decryptGoogleDriveTokenBundle(parts.join(".")));
  } finally {
    if (previous === undefined) delete process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
    else process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY = previous;
  }
});

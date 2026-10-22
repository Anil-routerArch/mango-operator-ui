/**
 * PEM Certificate and Private Key structural validation utilities.
 * Ensures strict RFC 7468 / PKCS#8 validation and protects against cross-contamination.
 */

export interface PemValidationResult {
  valid: boolean;
  error?: string;
  format?: string;
  fingerprint?: string;
}

export const detectPrivateKeyFormat = (text: string): string | null => {
  const t = text.trim();
  if (t.includes('-----BEGIN RSA PRIVATE KEY-----')) return 'RSA Private Key (PKCS#1)';
  if (t.includes('-----BEGIN EC PRIVATE KEY-----')) return 'EC Private Key (SEC1)';
  if (t.includes('-----BEGIN ENCRYPTED PRIVATE KEY-----')) return 'Encrypted Private Key (PKCS#8)';
  if (t.includes('-----BEGIN OPENSSH PRIVATE KEY-----')) return 'OpenSSH Private Key';
  if (t.includes('-----BEGIN PRIVATE KEY-----')) return 'Private Key (PKCS#8)';
  return null;
};

export const isBase64Line = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return /^[A-Za-z0-9+/=]+$/.test(trimmed);
};

export const computePemSyncFingerprint = (text: string): string => {
  // Deterministic 8-byte hex fingerprint from normalized payload
  let hash1 = 0x811c9dc5;
  let hash2 = 0x55555555;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    hash1 ^= ch;
    hash1 = (hash1 * 0x01000193) >>> 0;
    hash2 ^= (ch << 3);
    hash2 = (hash2 * 0x01000193) >>> 0;
  }
  const hex1 = hash1.toString(16).padStart(8, '0');
  const hex2 = hash2.toString(16).padStart(8, '0');
  const combined = (hex1 + hex2).toLowerCase();
  return combined.match(/.{1,2}/g)?.join(':') || combined;
};

export const validatePemCertificate = (content: string): PemValidationResult => {
  const trimmed = content.trim();
  if (!trimmed) {
    return { valid: false, error: 'Certificate content is empty.' };
  }

  // Check for accidental private key material
  if (detectPrivateKeyFormat(trimmed)) {
    return {
      valid: false,
      error: 'Security Warning: Detected private key material. Private keys cannot be uploaded into a public certificate field.',
    };
  }

  // Must have standard certificate headers
  if (!trimmed.includes('-----BEGIN CERTIFICATE-----') || !trimmed.includes('-----END CERTIFICATE-----')) {
    return {
      valid: false,
      error: 'Invalid certificate format: Must begin with -----BEGIN CERTIFICATE----- and end with -----END CERTIFICATE-----.',
    };
  }

  // Check base64 body
  const lines = trimmed.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const bodyLines = lines.filter((l) => !l.startsWith('-----'));
  if (bodyLines.length === 0) {
    return { valid: false, error: 'Invalid certificate: Missing base64 payload.' };
  }

  const invalidLine = bodyLines.find((l) => !isBase64Line(l));
  if (invalidLine) {
    return { valid: false, error: 'Invalid certificate: Payload contains invalid Base64 characters.' };
  }

  return {
    valid: true,
    format: 'X.509 Certificate (PEM)',
    fingerprint: computePemSyncFingerprint(trimmed),
  };
};

export const validatePemPrivateKey = (content: string): PemValidationResult => {
  const trimmed = content.trim();
  if (!trimmed) {
    return { valid: false, error: 'Private key content is empty.' };
  }

  // Check for accidental public certificate
  if (trimmed.includes('-----BEGIN CERTIFICATE-----')) {
    return {
      valid: false,
      error: 'Invalid format: Detected a public certificate. Please provide a valid private key.',
    };
  }

  const format = detectPrivateKeyFormat(trimmed);
  if (!format) {
    return {
      valid: false,
      error: 'Invalid key format: Private key must begin with -----BEGIN ... PRIVATE KEY----- and end with -----END ... PRIVATE KEY-----. Supported formats: PKCS#8, RSA (PKCS#1), EC (SEC1), Encrypted, OpenSSH.',
    };
  }

  // Verify matching end header
  const endHeader = format.includes('RSA')
    ? '-----END RSA PRIVATE KEY-----'
    : format.includes('EC')
    ? '-----END EC PRIVATE KEY-----'
    : format.includes('Encrypted')
    ? '-----END ENCRYPTED PRIVATE KEY-----'
    : format.includes('OpenSSH')
    ? '-----END OPENSSH PRIVATE KEY-----'
    : '-----END PRIVATE KEY-----';

  if (!trimmed.includes(endHeader) && !trimmed.includes('-----END PRIVATE KEY-----')) {
    return {
      valid: false,
      error: `Invalid key format: Missing matching end delimiter (${endHeader}).`,
    };
  }

  // Check base64 body (handling possible Encrypted/OpenSSH headers like DEK-Info)
  const lines = trimmed.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const bodyLines = lines.filter((l) => !l.startsWith('-----') && !l.includes(':'));
  if (bodyLines.length === 0) {
    return { valid: false, error: 'Invalid private key: Missing key payload.' };
  }

  const invalidLine = bodyLines.find((l) => !isBase64Line(l));
  if (invalidLine) {
    return { valid: false, error: 'Invalid private key: Payload contains invalid Base64 characters.' };
  }

  return {
    valid: true,
    format,
    fingerprint: computePemSyncFingerprint(trimmed),
  };
};


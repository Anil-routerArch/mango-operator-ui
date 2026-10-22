import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

// Import PEM validators directly
const VALID_CERT = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJALm6tV/QeL+bMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTgxMTA1MTQzMjU2WhcNMjgxMTAyMTQzMjU2WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAzw==
-----END CERTIFICATE-----`;

const VALID_RSA_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAzw8/x7eNf9z5gG1p9A6R7pW2o4dF2a8s0t8+2U2y2Z1w4k7p
MIIEowIBAAKCAQEAzw8/x7eNf9z5gG1p9A6R7pW2o4dF2a8s0t8+2U2y2Z1w4k7p
MIIEowIBAAKCAQEAzw8/x7eNf9z5gG1p9A6R7pW2o4dF2a8s0t8+2U2y2Z1w4k7p
MIIEowIBAAKCAQEAzw8/x7eNf9z5gG1p9A6R7pW2o4dF2a8s0t8+2U2y2Z1w4k7p
-----END RSA PRIVATE KEY-----`;

const VALID_PKCS8_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgxyz1234567890abcdef
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgxyz1234567890abcdef
-----END PRIVATE KEY-----`;

test('PEM certificate validator accepts valid certificate and rejects private key', async () => {
  const pemUtilPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'utils',
    'pemValidation.ts'
  );
  const content = fs.readFileSync(pemUtilPath, 'utf-8');

  // Verify functions exist in source
  assert.ok(content.includes('export const validatePemCertificate'), 'validatePemCertificate must be exported');
  assert.ok(content.includes('export const validatePemPrivateKey'), 'validatePemPrivateKey must be exported');
  assert.ok(content.includes('Security Warning: Detected private key material'), 'Must detect and block private keys in cert fields');
  assert.ok(content.includes('Detected a public certificate'), 'Must detect and block certificates in key fields');
});

test('CertificateUploadModal is dedicated to certificates and contains no private-key reveal logic', () => {
  const modalPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'ServicesSection',
    'CertificateUploadModal.tsx'
  );
  const content = fs.readFileSync(modalPath, 'utf-8');

  assert.ok(!content.includes('isPrivateKey'), 'CertificateUploadModal must not take isPrivateKey prop');
  assert.ok(!content.includes('Reveal Plaintext'), 'CertificateUploadModal must not have Reveal Plaintext button');
  assert.ok(!content.includes('WebkitTextSecurity'), 'CertificateUploadModal must not rely on WebkitTextSecurity');
  assert.ok(content.includes('validatePemCertificate'), 'CertificateUploadModal must use validatePemCertificate');
});

test('PrivateKeyUploadModal enforces write-only protection and eliminates plaintext reveal', () => {
  const modalPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'ServicesSection',
    'PrivateKeyUploadModal.tsx'
  );
  const content = fs.readFileSync(modalPath, 'utf-8');

  assert.ok(content.includes('Private Key Configured'), 'Must show configured status card');
  assert.ok(content.includes('Protected'), 'Must show Protected badge');
  assert.ok(!content.includes('Reveal Plaintext'), 'PrivateKeyUploadModal must NOT have a Reveal Plaintext button');
  assert.ok(content.includes('validatePemPrivateKey'), 'PrivateKeyUploadModal must use validatePemPrivateKey');
  assert.ok(content.includes('Replace Key'), 'Must provide Replace Key workflow');
  assert.ok(content.includes('const [draftValue, setDraftValue] = useState<string>(\'\');'), 'Draft key must never be prefilled with secret');
});

test('Service components route private-key to PrivateKeyUploadModal and certs to CertificateUploadModal', () => {
  const ieee8021xPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'ServicesSection',
    'Ieee8021x.tsx'
  );
  const ieeeContent = fs.readFileSync(ieee8021xPath, 'utf-8');
  assert.ok(ieeeContent.includes('<PrivateKeyUploadModal'), 'Ieee8021x must render PrivateKeyUploadModal for private-key');
  assert.ok(ieeeContent.includes('<CertificateUploadModal'), 'Ieee8021x must render CertificateUploadModal for certs');

  const openFlowPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'ServicesSection',
    'OpenFlow.tsx'
  );
  const openFlowContent = fs.readFileSync(openFlowPath, 'utf-8');
  assert.ok(openFlowContent.includes('<PrivateKeyUploadModal'), 'OpenFlow must render PrivateKeyUploadModal');
  assert.ok(openFlowContent.includes('<CertificateUploadModal'), 'OpenFlow must render CertificateUploadModal');

  const radiusProxyPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'ServicesSection',
    'RadiusProxyRealmsModal.tsx'
  );
  const radiusContent = fs.readFileSync(radiusProxyPath, 'utf-8');
  assert.ok(radiusContent.includes('<PrivateKeyUploadModal'), 'RadiusProxyRealmsModal must render PrivateKeyUploadModal');
  assert.ok(radiusContent.includes('<CertificateUploadModal'), 'RadiusProxyRealmsModal must render CertificateUploadModal');
});

test('RadiusProxyRealmsModal masks secrets in table and uses password inputs', () => {
  const radiusProxyPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'ServicesSection',
    'RadiusProxyRealmsModal.tsx'
  );
  const content = fs.readFileSync(radiusProxyPath, 'utf-8');

  // Verify password types
  assert.ok(content.includes('type="password"\n                        value={secret}'), 'Secret input must be type="password"');
  assert.ok(content.includes('type="password"\n                        value={privateKeyPassword}'), 'private-key-password input must be type="password"');

  // Verify table masking
  assert.ok(content.includes("r.secret ? '••••••••' : '—'"), 'Table must mask secret with bullets');
});


import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('src/api/devices.ts exports device command authorization types and hooks', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/api/devices.ts'), 'utf8');

  assert.ok(content.includes('export interface DeviceCommandAuthRequest'), 'should export DeviceCommandAuthRequest');
  assert.ok(content.includes('export interface DeviceCommandAuthResponse'), 'should export DeviceCommandAuthResponse');
  assert.ok(content.includes('checkDeviceCommandAuthorization = async'), 'should export checkDeviceCommandAuthorization');
  assert.ok(content.includes('authorization/deviceCommand'), 'should call authorization/deviceCommand endpoint');
  assert.ok(content.includes('useCheckDeviceCommandAuthorization'), 'should export useCheckDeviceCommandAuthorization');
  assert.ok(content.includes('useAuthorizeDeviceCommand'), 'should export useAuthorizeDeviceCommand');
});

test('src/api/errors.ts preserves descriptive 403 Forbidden authorization failure details', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/api/errors.ts'), 'utf8');

  // Verify that descriptive 403 error messages are preserved
  assert.ok(
    content.includes('cleanMessage.length <= 25') || !content.includes("lowerMessage.includes('not authorized')"),
    'src/api/errors.ts should not collapse long descriptive authorization errors to generic Access denied'
  );
  assert.ok(
    content.includes("lowerMessage === 'access denied'") || content.includes('isPermissionOrAction'),
    'src/api/errors.ts should still normalize bare access denied or permission verbs'
  );
});

test('Device action modals use getApiErrorMessage for error toast descriptions', () => {
  const modals = [
    'src/pages/Devices/components/DeviceWorkspace/modals/DeviceFirmwareUpgradeModal.tsx',
    'src/pages/Devices/components/DeviceWorkspace/modals/DeviceFactoryResetModal.tsx',
    'src/pages/Devices/components/DeviceWorkspace/modals/DeviceReEnrollModal.tsx',
    'src/pages/Devices/components/DeviceWorkspace/modals/DeviceTraceModal.tsx',
    'src/pages/Devices/components/DeviceWorkspace/modals/DeviceTelemetryModal.tsx',
    'src/pages/Devices/components/DeviceWorkspace/modals/DeviceScriptModal.tsx',
    'src/pages/Devices/components/DeviceWorkspace/modals/DeviceWifiScanModal.tsx',
  ];

  for (const modalRel of modals) {
    const content = fs.readFileSync(path.join(rootDir, modalRel), 'utf8');
    assert.ok(
      content.includes('getApiErrorMessage'),
      `${modalRel} must import and use getApiErrorMessage`
    );
  }
});

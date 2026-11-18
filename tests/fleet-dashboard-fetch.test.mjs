import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Compile the production fetcher with an injected HTTP client; exercise its actual pagination.
const source = fs.readFileSync(new URL('../src/api/devices.ts', import.meta.url), 'utf8');
const fetchSource = source.slice(source.indexOf('export const getFleetDevices ='), source.indexOf('export const useFleetDashboard ='));
const compiled = ts.transpileModule(fetchSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
}).outputText;
const loadFetcher = (axiosMdu) => {
  const exports = {};
  new Function('exports', 'axiosMdu', compiled)(exports, axiosMdu);
  return exports.getFleetDevices;
};

for (const totalCount of [0, 501, 10000, 50000, 55000]) {
  test(`fetches ${totalCount} devices up to the 50,000 cap without losing pages`, async () => {
    const pages = [];
    let active = 0;
    let peak = 0;
    const fetch = loadFetcher({
      get: async (url, { params }) => {
        assert.equal(url, 'devices');
        assert.equal(params.pageSize, 500);
        assert.equal(params.unassignedOnly, true);
        pages.push(params.pageIndex);
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setImmediate(resolve));
        active--;
        const offset = params.pageIndex * params.pageSize;
        return { data: {
          totalCount,
          totalPages: Math.ceil(totalCount / params.pageSize),
          devices: Array.from({ length: Math.min(params.pageSize, totalCount - offset) }, (_, i) => ({
            serialNumber: String(offset + i), connected: true,
          })),
        } };
      },
    });
    const result = await fetch({ unassignedOnly: true });
    assert.equal(result.totalCount, totalCount);
    assert.equal(result.devices.length, Math.min(totalCount, 50000));
    assert.equal(result.devices.filter((d) => d.connected).length, result.devices.length);
    assert.equal(new Set(result.devices.map((d) => d.serialNumber)).size, result.devices.length);
    assert.deepEqual(pages, Array.from({ length: Math.max(1, Math.min(100, Math.ceil(totalCount / 500))) }, (_, i) => i));
    assert.ok(peak <= 10, 'page requests must have bounded concurrency');
  });
}

for (const failingPage of [0, 3, 99]) {
  test(`page ${failingPage} failure rejects the fleet fetch instead of returning incomplete success`, async () => {
    const failure = new Error(`Page ${failingPage} unavailable`);
    const fetch = loadFetcher({ get: async (_, { params }) => {
      if (params.pageIndex === failingPage) throw failure;
      return { data: { devices: [], totalCount: 50000, totalPages: 100 } };
    } });
    await assert.rejects(fetch(), (err) => err === failure);
  });
}

// Render the production dashboard using lightweight JSX and hook mocks.
const dashboardSource = fs.readFileSync(new URL('../src/pages/Devices/components/DeviceDashboard/DeviceDashboardTab.tsx', import.meta.url), 'utf8');
const dashboardCode = ts.transpileModule(dashboardSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const renderDashboard = (data) => {
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const require = (name) => {
    if (name === 'react') return { useMemo: (fn) => fn() };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === '@/api/devices') return { useUnifiedFleetDevices: () => ({ data }) };
    if (name === '@/theme') return { themeColors: { brand: {}, panel: {}, text: {} } };
    return new Proxy({}, { get: (_, key) => String(key) });
  };
  new Function('require', 'exports', dashboardCode)(require, exports);
  return exports.DeviceDashboardTab();
};
const textOf = (node) => {
  if (node == null) return '';
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (typeof node === 'object') return textOf(node.props?.children);
  return String(node);
};
const cardsOf = (tree) => tree.props.children[1].props.children;

test('10,000 loaded online devices produce zero offline devices', () => {
  const tree = renderDashboard({ totalCount: 10000, devices: Array.from({ length: 10000 }, () => ({ connected: true })) });
  const cards = cardsOf(tree);
  assert.match(textOf(cards[1]), /10000/);
  assert.match(textOf(cards[2]), /Offline \/ Critical 0 /);
  assert.doesNotMatch(textOf(tree), /Partial fleet data/);
});

test('partial fleet counts use loaded devices and display an explicit warning', () => {
  const tree = renderDashboard({ totalCount: 55000, devices: [{ connected: true }, { connected: false }] });
  const cards = cardsOf(tree);
  assert.match(textOf(cards[0]), /55000/);
  assert.match(textOf(cards[1]), /Connected \(Online\) 1 .*50% loaded device availability/);
  assert.match(textOf(cards[2]), /Offline \/ Critical 1 /);
  assert.match(textOf(tree), /Partial fleet data: loaded  2  of  55,000/);
});

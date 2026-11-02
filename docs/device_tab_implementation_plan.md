# MDU Operator UI — Device Management Architecture & Implementation Plan

This document provides the exhaustive, deeply researched architectural blueprint and implementation plan for the **Devices** section in `mango-operator-ui`. It incorporates the complete feature set from `owprov-ui` and `owgw-ui`, aligned with the modern **MangoCloud visual card design** (featuring 24h Availability timelines, Sparkline Telemetry, Attention Conditions, and the 5 refined master tabs).

---

## 1. Executive Summary & Design Hierarchy

The Devices interface in `mango-operator-ui` is structured into two core layers:
1. **Fleet View (`/devices`)**:
   * **All Devices**: Unified fleet table merging OWPROV inventory metadata (Property, Venue, Subscriber, Config assignment) and OWGW real-time telemetry (Online/Offline, Sanity %, IP, Load, Memory, Uptime, Tx/Rx).
   * **Dashboard**: Fleet analytics (`GET /api/v1/deviceDashboard`) with sanity distribution, memory utilization, online/offline split, vendor breakdown, client associations, and command activity.
   * **Blacklist**: Dedicated management of barred hardware MAC addresses (`/api/v1/blacklist`).

2. **Device Master View (`/devices/:serialNumber`)**:
   When any device (e.g. `AP-B-204`) is selected, the interface opens the dedicated device console with:
   * **Breadcrumb**: `Properties / {Property Name} / {Venue Name} / {Device Name}`
   * **Header Bar**: Device friendly name (`AP-B-204`), status badges (`[Offline]`, `[Critical]`), hardware subtitle (`Edgecore EAP104 · Access Point · Last seen 8 min ago`), and quick actions (`Refresh`, `Reboot`, `Configure`, `Diagnostics`, `···`).
   * **Alert Banner**: Appears when a device is offline (*"Device is offline. No heartbeat received for 8 minutes. Live telemetry may be stale."* with `[Open Diagnostics]` button).
   * **The 5 Master Tabs**:
     1. **`Overview`**
     2. **`Radios`**
     3. **`Configuration`**
     4. **`Activity`**
     5. **`Diagnostics`**

---

## 2. Deep Tab & Feature Specifications

```
/devices/:serialNumber
│
├── Top Breadcrumb & Header
│   ├── Properties / {Property} / {Venue} / {Device Name}
│   ├── Badges: [Online / Offline] [Critical / Healthy / Warning]
│   ├── Subtitle: {Manufacturer} {Model} · {Device Type} · Last seen {time}
│   └── Actions: [Refresh] [Reboot] [Configure] [Diagnostics] [···]
│
├── Conditional Alert Banner (e.g. "Device is offline", "No heartbeat received...")
│
└── 5 Master Tabs:
    │
    ├── 1. Overview Tab
    │   ├── [Card 1] Device Health (Big Sanity %, Connectivity dot, Memory %, Cert status)
    │   ├── [Card 2] Live Telemetry (CPU Load, Memory %, Uptime, Local Time + mini sparklines)
    │   ├── [Card 3] Identity & Location (Serial Number, MAC, Model, Revision, Property, Venue)
    │   ├── [Card 4] Availability — Last 24 Hours (Uptime continuity timeline graph)
    │   ├── [Card 5] Certificate (Valid shield, expiration date, days remaining)
    │   ├── [Card 6] Attention Conditions (Root-cause checklist: Connectivity, Stale telemetry, Cert)
    │   └── [Card 7] Recent Activity (Health checks, heartbeats, config pushes)
    │
    ├── 2. Radios & Clients Tab (APs only)
    │   ├── Historical Time Slider (Step through last 30 recorded telemetry frames)
    │   ├── Radios Table (Band, Channel, Width, Tx Power, Noise dBm, Active/Busy/Rx/Tx ms, Temp)
    │   └── Connected Client Stations Table (Station MAC, Vendor OUI, SSID, IP, RSSI, Mode, PHY Rates)
    │
    ├── 3. Configuration Tab (The Complete OWPROV Model)
    │   ├── Sub-tab 3.1: Main (Name, description, device type, parent entity/venue, devClass, device rules, ignore overrides)
    │   ├── Sub-tab 3.2: Device-Specific Config (Globals, Unit, Metrics, Services, NAT, Radios, Ethernet, Interfaces)
    │   ├── Sub-tab 3.3: Computed Configuration (Resolved JSON + Visual Inheritance Accordion: 🟢 Overridden / 🟡 Inherited)
    │   ├── Sub-tab 3.4: Configuration Overrides (Parameter-level overrides manager)
    │   ├── Sub-tab 3.5: Notes (Chronological provisioning notes + Add Note form)
    │   └── Sub-tab 3.6: State (Runtime JSON state document)
    │
    ├── 4. Activity Tab
    │   ├── Commands History Table (Command type, submitted, status, duration, error code, inspect payload)
    │   ├── Reboot History (Historical reboot events and recorded reasons)
    │   └── Configuration Push History (Timestamps, applied UUIDs)
    │
    └── 5. Diagnostics Tab
        ├── Health Checks Timeline & Raw Payload Inspector
        ├── System Syslogs (`logType=0`, severity filters)
        ├── Crash Logs (`logType=1`, panic backtraces)
        ├── Interactive Web Shell (RTTY Terminal)
        ├── Wi-Fi Environment Scan (On-demand RF survey)
        ├── Switch Port Diagnostics & TDR Cable Diagnostics (for switches)
        ├── Live Telemetry Stream Trigger
        └── Packet Trace (PCAP capture)
```

---

## 3. Overview Tab Card Specifications & APIs

### 3.1 Card 1: Device Health
* **Visuals**: Large health percentage badge (e.g. `42% Critical` or `100% Healthy`).
* **Breakdown Metrics**:
  * Connectivity: `• Online` (green) or `• Offline` (red).
  * Memory: `Last value XX%`.
  * Certificate: `• Valid` (green) or `• Expired` (red).
* **Underlying APIs**:
  * `GET /api/v1/device/{serial}/status`
  * `GET /api/v1/device/{serial}/healthchecks?limit=1`

### 3.2 Card 2: Live Telemetry & Sparklines
* **Header**: Live Telemetry with relative update time and `[Stale]` tag if `now - lastContact > threshold`.
* **Four KPI Tiles**:
  1. `CPU Load`: Current % + mini SVG sparkline of last 10 points.
  2. `Memory`: Current % + mini SVG sparkline of last 10 points.
  3. `Uptime`: Humanized elapsed uptime (e.g. `12d 7h`) + mini SVG sparkline.
  4. `Local Time`: Local timezone clock (e.g. `10:22 EST`).
* **Underlying APIs**:
  * `GET /api/v1/device/{serial}/statistics?lastOnly=true`
  * `GET /api/v1/device/{serial}/statistics?newest=true&limit=10` (for sparklines)

### 3.3 Card 3: Identity & Location
* **Fields**:
  * `Serial Number`: e.g. `EC104-B204` (normalized uppercase).
  * `MAC Address`: e.g. `84:16:F9:2A:B2:04`.
  * `Model / Revision`: e.g. `EAP104 · R2`.
  * `Property (Entity)`: Link to property page.
  * `Venue`: Assigned venue name.
* **Underlying APIs**:
  * `GET /api/v1/inventory/{serial}?withExtendedInfo=true`
  * `GET /api/v1/device/{serial}`

### 3.4 Card 4: Availability — Last 24 Hours
* **Visuals**: Continuous availability timeline chart showing uptime percentage over the last 24 hours. When an outage occurs, the line smoothly drops from green (100%) to red (0%), annotating the outage duration (e.g. `Offline · 8 min`).
* **Underlying APIs**:
  * Computed from healthcheck and connection history:
  * `GET /api/v1/device/{serial}/healthchecks?startDate={now-86400}&endDate={now}&limit=100`

### 3.5 Card 5: Certificate
* **Visuals**: Shield icon with status (`Valid` green or `Expired` red). Displays exact expiration date (e.g. `Expires 18 Mar 2027`) and days remaining (e.g. `196 days remaining`).
* **Underlying APIs**:
  * `GET /api/v1/device/{serial}` (`certificateExpiryDate`).

### 3.6 Card 6: Attention Conditions
* **Visuals**: Automated diagnostic checklist highlighting operational risks:
  * ❌ `Connectivity lost`: Detected X min ago.
  * ⚠️ `Telemetry is stale`: Last update X min ago.
  * ✅ `Certificate valid`: Expires in X days.
* **Underlying Logic**: Dynamically computed from status, telemetry timestamp, and certificate expiration.

### 3.7 Card 7: Recent Activity
* **Visuals**: Event feed showing recent operational transactions:
  * `Health check failed` (8 min ago — `Failed` red).
  * `Heartbeat received` (9 min ago — `Success` green).
  * `Configuration applied` (2h ago — `Applied` blue).
* **Underlying APIs**:
  * `GET /api/v1/commands?serialNumber={serial}&newest=true&limit=5`
  * `GET /api/v1/device/{serial}/logs?newest=true&limit=5`

---

## 4. Complete REST API Catalog (32 Endpoints)

### 4.1 OWPROV APIs (Inventory & Configuration)

| # | Action | Method & Path | Client | Query Parameters | Request Body | Response Body |
|---|--------|---------------|--------|------------------|--------------|---------------|
| 1 | List Inventory Tags | `GET /api/v1/inventory` | `axiosProv` | `limit`, `offset`, `unassigned`, `withExtendedInfo=true`, `countOnly` | None | `{ "tagList": [ { "serialNumber": "...", "name": "...", "venue": "...", ... } ] }` |
| 2 | Get Inventory Tag | `GET /api/v1/inventory/{serial}` | `axiosProv` | `firmwareOptions`, `rrmSettings` | None | `{ "serialNumber": "...", "name": "...", "deviceConfiguration": "...", ... }` |
| 3 | Get Computed Config | `GET /api/v1/inventory/{serial}?config=true&explain=true` | `axiosProv` | `config=true`, `explain=true` | None | `{ "config": { ... }, "explanation": [ { "action": "inherited", "from-name": "...", "reason": "..." } ] }` |
| 4 | Push Configuration | `GET /api/v1/inventory/{serial}?applyConfiguration=true` | `axiosProv` | `applyConfiguration=true` | None | `{ "applied": true, "UUID": 123456 }` |
| 5 | Create Device Tag | `POST /api/v1/inventory/{serial}` | `axiosProv` | None | `{ "serialNumber": "...", "name": "...", "deviceType": "...", "venue": "...", "deviceRules": { ... } }` | `{ "serialNumber": "...", ... }` |
| 6 | Update Device Tag | `PUT /api/v1/inventory/{serial}` | `axiosProv` | None | `{ "name": "...", "description": "...", "deviceType": "...", "venue": "...", ... }` | `{ "serialNumber": "...", ... }` |
| 7 | Delete Device Tag | `DELETE /api/v1/inventory/{serial}` | `axiosProv` | None | None | `{}` |
| 8 | Get Overrides | `GET /api/v1/configurationOverrides/{serial}` | `axiosProv` | None | None | `{ "serialNumber": "...", "overrides": [ { "parameterName": "...", "parameterValue": "...", "parameterType": "..." } ] }` |
| 9 | Update Overrides | `PUT /api/v1/configurationOverrides/{serial}?source={src}` | `axiosProv` | `source=device` | `{ "serialNumber": "...", "overrides": [ ... ] }` | `{ "serialNumber": "...", "overrides": [ ... ] }` |
| 10 | Delete Overrides | `DELETE /api/v1/configurationOverrides/{serial}?source={src}` | `axiosProv` | `source=device` | None | `{}` |

---

### 4.2 OWGW APIs (Telemetry, Status, Dashboard & Commands)

| # | Action | Method & Path | Client | Query Parameters | Request Body | Response Body |
|---|--------|---------------|--------|------------------|--------------|---------------|
| 1 | List Devices with Status | `GET /api/v1/devices` | `axiosGw` | `deviceWithStatus=true`, `limit`, `offset`, `platform` | None | `{ "devicesWithStatus": [ { "serialNumber": "...", "connected": true, "sanity": 100, ... } ] }` |
| 2 | Fleet Connection Stats | `GET /api/v1/devices?connectionStatistics=true` | `axiosGw` | `connectionStatistics=true` | None | `{ "connectedDevices": 4, "averageUptime": 142000, "rx": 1024000, "tx": 512000 }` |
| 3 | Controller Dashboard | `GET /api/v1/deviceDashboard` | `axiosGw` | None | None | `{ "snapshot": 1729..., "numberOfDevices": 4, "healths": { ... }, "memoryUsed": { ... } }` |
| 4 | List Blacklist | `GET /api/v1/blacklist` | `axiosGw` | `limit`, `offset`, `countOnly` | None | `{ "devices": [ { "serialNumber": "...", "reason": "...", "created": 1729... } ] }` |
| 5 | Add to Blacklist | `POST /api/v1/blacklist/{serial}` | `axiosGw` | None | `{ "serialNumber": "...", "reason": "Rogue AP" }` | `{ "serialNumber": "...", "reason": "..." }` |
| 6 | Remove from Blacklist | `DELETE /api/v1/blacklist/{serial}` | `axiosGw` | None | None | `{}` |
| 7 | Get Device Status | `GET /api/v1/device/{serial}/status` | `axiosGw` | None | None | `{ "connected": true, "sanity": 100, "uptime": 142000, "memory": { ... } }` |
| 8 | Get Capabilities | `GET /api/v1/device/{serial}/capabilities` | `axiosGw` | None | None | `{ "capabilities": { "compatible": "...", "model": "...", "platform": "..." } }` |
| 9 | Get Latest Statistics | `GET /api/v1/device/{serial}/statistics?lastOnly=true` | `axiosGw` | `lastOnly=true` | None | `{ "unit": { ... }, "radios": [ ... ], "interfaces": [ ... ] }` |
| 10 | Get Recent Statistics | `GET /api/v1/device/{serial}/statistics?newest=true&limit=30` | `axiosGw` | `newest=true`, `limit=30` | None | `{ "data": [ { "data": { ... }, "recorded": 1729... } ] }` |
| 11 | Historical Statistics | `GET /api/v1/device/{serial}/statistics?startDate=X&endDate=Y` | `axiosGw` | `startDate`, `endDate`, `offset`, `limit` | None | `{ "data": [ { "data": { ... }, "recorded": ... } ] }` |
| 12 | Get Commands History | `GET /api/v1/commands?serialNumber={serial}&newest=true` | `axiosGw` | `serialNumber`, `newest=true`, `limit` | None | `{ "commands": [ { "UUID": "...", "command": "reboot", "status": "Completed" } ] }` |
| 13 | Delete Command | `DELETE /api/v1/command/{id}` | `axiosGw` | None | None | `{}` |
| 14 | Get Health Checks | `GET /api/v1/device/{serial}/healthchecks?newest=true` | `axiosGw` | `newest=true`, `limit` | None | `{ "values": [ { "recorded": 1729..., "sanity": 100, "values": { ... } } ] }` |
| 15 | Get System Logs | `GET /api/v1/device/{serial}/logs?logType=0&newest=true` | `axiosGw` | `logType=0`, `newest=true`, `limit` | None | `{ "values": [ { "recorded": 1729..., "severity": 6, "log": "..." } ] }` |
| 16 | Get Crash Logs | `GET /api/v1/device/{serial}/logs?logType=1&newest=true` | `axiosGw` | `logType=1`, `newest=true`, `limit` | None | `{ "values": [ { "recorded": 1729..., "log": "Kernel panic..." } ] }` |
| 17 | Get Reboot Logs | `GET /api/v1/device/{serial}/logs?logType=2&newest=true` | `axiosGw` | `logType=2`, `newest=true`, `limit` | None | `{ "values": [ { "recorded": 1729..., "log": "Reboot: Watchdog" } ] }` |
| 18 | Reboot Device | `POST /api/v1/device/{serial}/reboot` | `axiosGw` | None | `{ "serialNumber": "...", "when": 0 }` | `{ "UUID": "...", "status": "pending" }` |
| 19 | Blink LEDs | `POST /api/v1/device/{serial}/leds` | `axiosGw` | None | `{ "serialNumber": "...", "when": 0, "pattern": "blink", "duration": 30 }` | `{ "UUID": "...", "status": "pending" }` |
| 20 | Wi-Fi Scan | `POST /api/v1/device/{serial}/wifiscan` | `axiosGw` | None | `{ "serialNumber": "...", "verbose": true, "activeScan": false }` | `{ "UUID": "...", "status": "pending" }` |
| 21 | Firmware Upgrade | `POST /api/v1/device/{serial}/upgrade` | `axiosGw` | None | `{ "serialNumber": "...", "uri": "...", "keepRedirector": true, "when": 0 }` | `{ "UUID": "...", "status": "pending" }` |
| 22 | Factory Reset | `POST /api/v1/device/{serial}/factory` | `axiosGw` | None | `{ "serialNumber": "...", "keepRedirector": true }` | `{ "UUID": "...", "status": "pending" }` |
| 23 | Raw Configure | `POST /api/v1/device/{serial}/configure` | `axiosGw` | None | `{ "serialNumber": "...", "when": 0, "UUID": 1, "configuration": { ... } }` | `{ "UUID": "...", "status": "pending" }` |
| 24 | Packet Trace | `POST /api/v1/device/{serial}/trace` | `axiosGw` | None | `{ "serialNumber": "...", "duration": 60, "packets": 1000, "network": "all" }` | `{ "UUID": "...", "status": "pending" }` |
| 25 | Live Telemetry | `POST /api/v1/device/{serial}/telemetry` | `axiosGw` | None | `{ "serialNumber": "...", "interval": 10, "types": ["wifi-frames"] }` | `{ "UUID": "...", "status": "pending" }` |
| 26 | Run Script | `POST /api/v1/device/{serial}/script` | `axiosGw` | None | `{ "serialNumber": "...", "script": "...", "type": "shell", "timeout": 30 }` | `{ "UUID": "...", "status": "pending" }` |
| 27 | Web Shell RTTY | `GET /api/v1/device/{serial}/rtty` | `axiosGw` | None | None | `{ "server": "rtty.wlan.local", "viewport": "16003", "connectionId": "..." }` |
| 28 | Cable Diagnostics | `POST /api/v1/device/{serial}/cablediagnostics` | `axiosGw` | None | `{ "serialNumber": "...", "port": 1 }` | `{ "UUID": "...", "status": "pending" }` |
| 29 | Re-enroll Device | `POST /api/v1/device/{serial}/reregister` | `axiosGw` | None | `{ "serialNumber": "..." }` | `{ "UUID": "...", "status": "pending" }` |
| 30 | Active RADIUS Sessions | `GET /api/v1/radiusSessions/{serial}` | `axiosGw` | None | None | `{ "sessions": [ { "userName": "...", "callingStationId": "...", ... } ] }` |
| 31 | Disconnect RADIUS (CoA)| `PUT /api/v1/radiusSessions/{serial}?operation=coadm` | `axiosGw` | `operation=coadm` | `{ "accountingSessionId": "...", "callingStationId": "..." }` | `{}` |
| 32 | IEEE OUI Lookup | `GET /api/v1/ouis?macList={macs}` | `axiosGw` | `macList` | None | `{ "tagList": [ { "tag": "60cf84", "value": "ASUSTek Computer Inc." } ] }` |

---

## 5. Phased Tranches for Implementation

* **Tranche 1: API Layer & Data Models** (`src/api/devices.ts`, `src/types/device.ts`): Typed API clients for all 32 endpoints, React Query hooks, and data models.
* **Tranche 2: Store & Route Wiring** (`src/stores/devicesUiStore.ts`, `src/router/index.tsx`): Zustand state management supporting URL params `/devices/:serialNumber` and tabs.
* **Tranche 3: Top-Level Fleet Screen** (`src/pages/Devices/DevicesPage.tsx`, `DevicesTable.tsx`, `DevicesDashboard.tsx`, `BlacklistTab.tsx`): Fleet overview with status pills, platform filters, KPI dashboard, and blacklist management.
* **Tranche 4: Device Master View Header & Overview Tab** (`DeviceOverviewTab.tsx`):
  * Breadcrumb & top actions bar (`Refresh`, `Reboot`, `Configure`, `Diagnostics`, `···`).
  * Offline alert banner (`Device is offline...`).
  * Device Health card (`42% Critical`).
  * Live Telemetry card with sparklines.
  * Identity & Location card.
  * Availability — Last 24 Hours timeline graph.
  * Certificate card.
  * Attention Conditions & Recent Activity cards.
* **Tranche 5: Radios & Wi-Fi Analysis Tab** (`DeviceRadiosTab.tsx`): Historical time-slider, radio spectrum channels, and client stations with OUI vendor lookup.
* **Tranche 6: Complete Configuration Tab (OWPROV 6-Tab Model)** (`DeviceConfigTab.tsx`): Main, Special Config, Computed Config with visual inheritance accordion (🟢 Overridden / 🟡 Inherited), Overrides, Notes, and State.
* **Tranche 7: Activity, Diagnostics & Action Modals** (`DeviceActivityTab.tsx`, `DeviceDiagnosticsTab.tsx`): Commands history, healthchecks, syslogs, crash logs, RTTY Web Shell, and reboot/blink modals.

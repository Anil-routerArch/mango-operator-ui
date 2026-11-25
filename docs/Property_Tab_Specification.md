# Mango Cloud MDU UI — Property Tab Technical Specification

## Document Metadata

| Attribute | Value |
|---|---|
| Document version | 0.2.0 |
| Status | Phase 1 implementation-aligned draft |
| Date | 19 November 2026 |
| Target UI | `mango-operator-ui` |
| Aggregation service | `mango-mdu-service` |
| Authoritative hierarchy/configuration service | OWPROV |
| Authoritative current Device-state service | OWGW |
| Companion product document | `Property_Tab_Requirement.md` |

---

## 1. Purpose and Normative Language

This document specifies the implemented Phase 1 Property module and distinguishes current contracts from remaining requirements. Its approved content is also consolidated into `Phase_1_Specification.md`; this focused copy is retained for module-level review.

The terms **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative. Every API in this document is labeled as one of:

- **Existing:** verified in the current service implementation.
- **Proposed:** must be added before the dependent experience is considered complete.
- **Workaround:** possible using existing APIs, but not the preferred fleet-scale contract.
- **Deferred:** requires a new data model or persistent capability.

---

## 2. Architecture and Ownership

```text
                         +-------------------------+
                         | mango-operator-ui       |
                         | Property workspace      |
                         +-----------+-------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               | combined operational reads                | authorized metadata,
               |                                           | CRUD and configurations
               v                                           v
   +-------------------------+                 +-------------------------+
   | mango-mdu-service       |---------------->| OWPROV                  |
   | hierarchy normalization |                 | Entity/Venue hierarchy  |
   | scope aggregation       |                 | Contacts/Locations      |
   | paging/data quality     |                 | Inventory/Configurations|
   +------------+------------+                 +-------------------------+
                |
                | current device status
                v
   +-------------------------+
   | OWGW                    |
   | Connection/device state |
   | Sanity/health signals   |
   +-------------------------+
```

### 2.1 Source-of-Truth Rules

1. OWPROV MUST remain authoritative for Entity/Property, Venue, Contact, Location, Inventory ownership, and scoped Configuration data.
2. OWGW MUST remain authoritative for the current Device connection and operational state it owns.
3. MDU MUST aggregate but MUST NOT create a parallel Property hierarchy store.
4. MDU MAY persist derived time-series snapshots in a dedicated table or analytics store when historical aggregation is implemented.
5. The UI MUST consume MDU for reads that combine OWPROV hierarchy/inventory with OWGW operational state. It MUST NOT independently join OWPROV and OWGW at fleet scale.
6. Phase 1 uses direct authenticated UI-to-OWPROV calls for Property/Venue details and lifecycle, Contact/Location operations, available Venue Locations, and scoped Configuration reads. OWPROV remains responsible for authorization.
7. A future MDU mutation façade MAY replace direct calls, but it MUST preserve OWPROV authorization and wire semantics.
8. **Decoupled Structural Tree and Operational State:** MDU MUST use OWPROV's hierarchy tree endpoint (`GET /api/v1/entity?getTree=true`) solely to discover authorized scopes (Entities and Venues). MDU MUST discard/ignore embedded `devices` arrays in the OWPROV tree payload. MDU's `/properties/tree` endpoint MUST return hierarchy structure only, never enumerate Devices, and never contact OWGW. Structurally usable tree rendering MUST NOT wait for Device inventory enumeration or OWGW operational reads.
9. **Separate Paginated Device Retrieval:** Inventory Devices MUST be retrieved separately through paginated OWPROV inventory calls (`GET /api/v1/inventory`) rather than embedded in the hierarchy tree.
10. **Upstream OWPROV Tree Limitation:** In the current OWPROV implementation, `GET /api/v1/entity?getTree=true` embeds Device serial numbers in Entity and Venue records, incurring upstream database serialization overhead. While MDU strips these arrays before presenting `/properties/tree`, OWPROV SHOULD add a lightweight tree option (e.g., `&includeDevices=false`) to eliminate upstream serialization costs at 50,000-Device scale.

---

## 3. Backend Domain Mapping

| Product concept | Backend object | Cardinality/relationship |
|---|---|---|
| Property | Every authorized OWPROV Entity | UI label is independent of root, operator, normal, parent, or child backend classification. |
| Child Property | OWPROV Entity with an Entity parent | Recursively represented as another Property. |
| Venue | Every authorized OWPROV Venue | Exactly one direct Entity or parent Venue binding on creation. |
| Nested Venue / Area | OWPROV Venue with a Venue parent | Recursive `parent`/`children[]` relationship; still labeled Venue. |
| Property Contacts | OWPROV Contact IDs | Multiple |
| Property Locations | OWPROV Location IDs | Multiple |
| Venue Contacts | OWPROV Contact IDs | Multiple |
| Venue Location | OWPROV Location ID | Single |
| Property/Venue notes | OWPROV ObjectInfo notes | Append/preserve backend metadata |
| Scoped Configuration | OWPROV Configuration | Entity or Venue scope |
| Device ownership | OWPROV InventoryTag | Entity XOR Venue binding |

The UI and MDU MUST NOT map root/operator Entities to a separate Organization product type. Synthetic discovery wrappers such as `Assigned Scopes` are not domain objects and MUST be flattened before presentation.

### 3.1 Critical Inventory Rule

An Inventory Device assigned to a Venue is not also stored as directly assigned to its parent Entity. Therefore:

```http
GET /api/v1/inventory?entity={propertyId}
```

returns only Devices directly bound to the Entity. It does not represent every Device beneath the Property. Property-wide results MUST include:

```text
direct Entity Devices
+ Devices in every included descendant Entity/Property
+ Devices in every included top-level Venue
+ Devices in every included descendant Venue
```

---

## 4. Existing OWPROV Contracts

The following contracts exist in the current OWPROV service. Exact authorization remains backend-controlled.

### 4.1 Hierarchy and Lifecycle

| Capability | Existing endpoint | Notes |
|---|---|---|
| Authorized hierarchy | `GET /api/v1/entity?getTree=true` | Returns Entity/Venue tree filtered by authorization. |
| List Entities | `GET /api/v1/entity` | Supports standard list parameters. |
| Entity detail | `GET /api/v1/entity/{uuid}` | Property detail source. |
| Create Entity | `POST /api/v1/entity/0` | Parent must satisfy OWPROV hierarchy rules. |
| Update Entity | `PUT /api/v1/entity/{uuid}` | Preserve fields not owned by the form. |
| Delete Entity | `DELETE /api/v1/entity/{uuid}` | Dependency validation is authoritative. |
| List Venues | `GET /api/v1/venue` | Can retrieve extended Venue records. |
| Venue detail | `GET /api/v1/venue/{uuid}` | Supports Venue detail options. |
| Create Venue | `POST /api/v1/venue/0` | Supply `entity` for top-level or `parent` for child, not both. |
| Update Venue | `PUT /api/v1/venue/{uuid}` | Preserve unmanaged fields. |
| Delete Venue | `DELETE /api/v1/venue/{uuid}` | Dependency validation is authoritative. |

Detail reads use `withExtendedInfo=true` where extended associations and metadata are required.

### 4.2 Contacts and Locations

| Capability | Existing endpoint |
|---|---|
| List/Create Contacts | `GET /api/v1/contact`, `POST /api/v1/contact/0` |
| Contact CRUD | `GET/PUT/DELETE /api/v1/contact/{uuid}` |
| List/Create Locations | `GET /api/v1/location`, `POST /api/v1/location/0` |
| Location CRUD | `GET/PUT/DELETE /api/v1/location/{uuid}` |
| Locations eligible for a Venue | `GET /api/v1/venue?locationsForVenue={venueId}` |

No verified primary-contact field exists. The UI MUST NOT persist a fake primary designation in local state and present it as authoritative.

### 4.3 Inventory

| Capability | Existing endpoint | Limitation |
|---|---|---|
| Direct Entity inventory | `GET /api/v1/inventory?entity={uuid}` | Does not automatically include Venue Devices. |
| Direct Venue inventory | `GET /api/v1/inventory?venue={uuid}` | Exact Venue query; recursive hierarchy result is not guaranteed. |
| Count | `countOnly=true` | Count applies to the selected exact query. |
| Serial-only result | `serialOnly=true` | Useful for status batching. |
| Pagination | `offset`, `limit` | Cannot by itself page a union of all descendant scopes. |
| Ordering | `orderBy` | Limited to supported OWPROV fields. |

### 4.4 Configurations

| Capability | Existing endpoint | Notes |
|---|---|---|
| List Configurations | `GET /api/v1/configuration` | Supports Entity/Venue scope filtering. |
| Configuration detail | `GET /api/v1/configuration/{uuid}` | Existing Configuration object. |
| Affected Devices | `GET /api/v1/configuration/{uuid}?computedAffected=true` | Backend-computed affected serial numbers. |
| Expanded usage | `GET /api/v1/configuration/{uuid}?expandInUse=true` | Used to understand assignments/dependencies. |
| Configuration CRUD | `POST /0`, `PUT/DELETE /{uuid}` | Existing dependency and authorization semantics apply. |

The current Configuration object does not provide an authoritative product lifecycle (`draft`, `active`, `archived`), semantic category, or complete version-history contract.

---

## 5. Existing OWGW Capabilities

OWGW can provide current Device information for selected serial numbers through its Device APIs. Available data includes connection/current-state fields and sanity/health-related values.

Current limitations for this feature:

1. There is no verified single Property/Venue aggregation contract returning authoritative Total, Online, Offline, Unknown, and health rollups.
2. There is no verified Property/Venue historical time-series contract.
3. Per-Device health-history calls are not an acceptable Property-scale aggregation strategy.
4. Current OWGW filtering does not provide the required complete OWPROV descendant-scope semantics.

MDU MUST translate missing or failed OWGW status into Unknown. It MUST NOT infer Offline solely from absence in a partial OWGW response.

---

## 6. Current MDU Implementation and Remaining Gaps

MDU now provides authorized hierarchy normalization, portfolio aggregation, Property/Venue overview aggregation, and scoped Device queries. These reads combine OWPROV scope/inventory data with OWGW current status and expose data-quality metadata.

Remaining gaps are:

- no server-side Device ordering contract;
- Venue and Device-type filters exist in the MDU query model but are not yet exposed in the scoped Devices UI;
- descendant scope aggregation uses a bounded MDU fan-out workaround rather than a single descendant-aware OWPROV query;
- no Property/Venue historical time-series contract;
- no MDU scoped-Configuration endpoint; Phase 1 reads OWPROV Configurations directly and filters them in the UI;
- no authoritative capability-discovery response for mutation-control visibility; and
- current health thresholds are provisional and are not exposed with a calculation version.

---

## 7. Public MDU APIs

Sections 7.1 through 7.3 describe **Existing** endpoints. Sections explicitly labeled Proposed or Deferred are not implemented contracts.

### 7.1 Property Tree

```http
GET /api/v1/properties/tree
```

Purpose:

- Return the authorized Entity/Property and Venue tree normalized to `property` and `venue` node types.
- Avoid exposing unauthorized ancestors.
- Provide a fast, lightweight structural hierarchy. The endpoint MUST NEVER enumerate Devices or query OWGW.
- Node `devices` arrays are stripped/empty (`[]`) to ensure the tree renders immediately and independently of fleet size.

Example response:

```json
{
  "nodes": [
    {
      "id": "entity-uuid",
      "type": "property",
      "name": "Sunrise Apartments",
      "devices": [],
      "children": []
    }
  ]
}
```

The hierarchy endpoint is strictly metadata-first. Operational portfolio statistics are returned by the separate endpoint:

```http
GET /api/v1/properties/portfolio
```

The portfolio response contains `nodes`, aggregate `summary`, `dataQuality`, `propertyCount`, `venueCount`, and `nestedVenueCount`.

**Portfolio Execution and Snapshot Caching Strategy:**
1. **Short-Lived Aggregate Snapshot:** MDU caches operational summaries in a short-lived in-memory snapshot keyed by the caller's authorized principal and scope projection (default TTL: 30s).
2. **Request Coalescing (Single-Flight):** When a cache miss occurs, concurrent requests for the same scope projection coalesce on a single downstream scan worker so only one fleet scan runs simultaneously.
3. **Asynchronous Stale-While-Revalidate:** While a background refresh executes, MDU serves the previous snapshot marked with `dataQuality.state = "stale"` and the existing `asOf` timestamp (up to a maximum stale age of 120s).
4. **Overall Aggregation Deadline:** A hard deadline (default 10s) applies to portfolio aggregation. If downstream calls (OWPROV inventory or OWGW batches) do not complete within this budget, MDU returns a partial result with `dataQuality.state = "partial"`, sets incomplete counts to Unknown, and reports `STATUS_BATCH_INCOMPLETE` rather than blocking the client.
5. **Decoupled Loading in UI:** The UI MUST fetch `/properties/tree` and `/properties/portfolio` in parallel or sequentially without blocking tree rendering on the portfolio response. Tree nodes render immediately; status pills/summaries fill in once the portfolio/overview loads.

### 7.2 Property/Venue Overview

```http
GET /api/v1/properties/{propertyId}/overview
GET /api/v1/venues/{venueId}/overview
```

The normalized response MUST include:

- scope identity and type;
- Total, Online, Offline, and Unknown Device counts;
- backend-normalized health;
- Devices Needing Attention count;
- direct child Property and/or Venue summaries in `children` as applicable;
- `asOf` and `dataQuality`;
- the primary health/attention reason when available.

Overview endpoints reuse the short-lived scope status snapshot generated for portfolio reads to avoid redundant fleet-wide OWGW scans.

### 7.3 Scoped Devices

```http
GET /api/v1/properties/{propertyId}/devices
GET /api/v1/venues/{venueId}/devices
```

Supported query parameters:

| Parameter | Type | Meaning |
|---|---|---|
| `pageIndex` | integer >= 0 | Zero-based page index; defaults to `0`. |
| `pageSize` | bounded integer | Requested page size |
| `search` | string | Name or normalized serial search |
| `venue` | UUID | Limit a Property query to an authorized descendant Venue |
| `includeDescendants` | boolean | Include nested Venue Devices |
| `availability` | enum | `online`, `offline`, `unknown` |
| `health` | enum | `healthy`, `warning`, `critical`, `unknown` |
| `type` | string | Supported Device type/class |

`orderBy` and `direction` are not implemented and must not be sent until the backend contract is added.

**Execution and Bounded Cost Rules:**
1. **Search and Filtering Before Pagination:** Filtering (name/serial search, venue, device type, availability, and health) MUST execute before pagination so `totalCount` and `totalPages` reflect the entire filtered scope.
2. **Snapshot Reuse:** Availability and health filters MUST evaluate against a reusable OWGW status snapshot (or server-side aggregate) rather than re-querying OWGW for all 50,000 Devices on each page interaction.
3. **Bounded Downstream Pagination:** MDU retrieves inventory records from OWPROV using deterministic offset/limit chunks, enforcing a strict request-wide deadline and serial deduplication.
4. **Client Cancellation:** When the client disconnects or aborts the request, in-flight downstream inventory and status calls MUST be cancelled immediately via context propagation.
| `type` | string | Supported Device type/class |

`orderBy` and `direction` are not implemented and must not be sent until the backend contract is added.

Filtering and search MUST execute before pagination.

Example response:

```json
{
  "devices": [],
  "pageIndex": 0,
  "pageSize": 25,
  "totalCount": 12540,
  "totalPages": 502,
  "summary": {
    "totalDevices": 12540,
    "onlineDevices": 12001,
    "offlineDevices": 421,
    "unknownDevices": 118,
    "needsAttention": 604,
    "healthyDevices": 11780,
    "warningDevices": 200,
    "criticalDevices": 20,
    "unknownHealth": 540,
    "health": "warning",
    "statusMeasuredFor": 12422
  },
  "dataQuality": {
    "state": "partial",
    "partial": true,
    "unknownDeviceCount": 118,
    "asOf": "2026-11-19T10:30:00Z",
    "errors": [
      {
        "source": "owgw",
        "code": "STATUS_BATCH_INCOMPLETE",
        "retryable": true
      }
    ]
  }
}
```

### 7.4 Scoped Configurations — Current Direct OWPROV Workaround

```http
GET /api/v1/configuration
```

The UI currently retrieves authorized modular Configurations from OWPROV and filters them against the selected scope and descendant IDs. It displays only authoritative fields. It MUST NOT create version, lifecycle, or semantic category values that OWPROV did not return.

This is not a fleet-scale server-paginated scope contract. The following MDU endpoints remain **Proposed**:

```http
GET /api/v1/properties/{propertyId}/configurations
GET /api/v1/venues/{venueId}/configurations?includeDescendants=true
```

If implemented, the response SHOULD normalize:

- Configuration ID, name, description, and exact assigned scope;
- last modification information available from OWPROV;
- computed affected Device count when requested;
- dependency/use information when requested;
- data quality.

It MUST preserve OWPROV authorization and must not fabricate unsupported metadata.

### 7.5 Historical Health

```http
GET /api/v1/properties/{propertyId}/health?range=24h&interval=5m
GET /api/v1/venues/{venueId}/health?range=24h&interval=5m
```

Status: **Deferred/proposed.** This endpoint MUST NOT be implemented as a fan-out call to every Device's health history. It requires persisted aggregate snapshots or an analytics backend.

---

## 8. Proposed OWPROV Enhancement

For correct and scalable Property inventory, OWPROV SHOULD add a descendant-aware query equivalent to:

```http
GET /api/v1/inventory
  ?entity={propertyId}
  &includeVenues=true
  &includeDescendants=true
  &search={text}
  &offset={offset}
  &limit={limit}
  &orderBy={field}
```

The implementation MUST:

1. Build one authorization-safe scope condition.
2. Include direct Entity Devices and eligible descendant Venue Devices.
3. Apply search/filter before `offset` and `limit`.
4. Return an authoritative total count for the same filtered scope.
5. Respect explicit Venue-level denial/shadowing semantics.
6. Avoid leaking identifiers or counts from unauthorized descendants.

### 8.1 Temporary MDU Workaround

Until the OWPROV enhancement exists, MDU MAY:

1. Fetch the authorized hierarchy via `GET /api/v1/entity?getTree=true`.
2. Resolve included Venue IDs across the authorized hierarchy.
3. Fetch serials for the direct Entity and each included Venue via paginated calls (`GET /api/v1/inventory?entity={id}&offset={offset}&limit={limit}` and `GET /api/v1/inventory?venue={id}&offset={offset}&limit={limit}`).
4. Deduplicate serials into an in-memory set.
5. Batch status requests to OWGW in bounded slices.
6. Normalize and filter the result in MDU.

This workaround MUST have explicit limits, timeouts, bounded concurrency, deduplication, and partial-data reporting. It is not the target design for 10,000–50,000 Device scopes because it cannot provide efficient database-level pagination.

### 8.2 Inventory Mutation Handling During Multi-Page Scans

When scanning multi-page inventory from OWPROV using offset pagination, concurrent mutations (such as device reassignment, deletion, or adoption) can shift offset boundaries between successive page requests. Because OWPROV does not provide a transaction snapshot or stable pagination cursor, MDU MUST enforce the following reconciliation rules:

1. **Before-and-After Reconciliation:** MDU MUST call `GET /api/v1/inventory?entity={id}&countOnly=true` (or venue equivalent) immediately before starting pagination and again immediately after completing pagination.
2. **Consistency Verification:** MDU verifies that:
   - `countBefore === countAfter`, and
   - `retrievedUniqueSerials.length === countBefore`.
3. **Conservative Fallback on Mismatch:**
   - If `countBefore !== countAfter`, or if the count of unique retrieved records does not match, or if any page request fails or the aggregation deadline is reached:
   - MDU MUST treat the result as **partial and non-authoritative**.
   - MDU MUST NOT present the retrieved unique serial count as the authoritative `totalDevices` or `totalCount`. The total MUST be rendered as `null` or marked partial.
   - `dataQuality.state` MUST be set to `"partial"`, `partial: true`, and an error item with `source: "owprov"` and `code: "INVENTORY_MUTATION_DETECTED"` (or `"PAGE_SCAN_INCOMPLETE"`) MUST be included.
   - If no usable inventory records could be retrieved at all, MDU MUST return HTTP 503 (`Service Unavailable`).
4. **Future Revision/Cursor Contract:** To achieve strict snapshot consistency without conservative partial-data degradation, OWPROV SHOULD expose a revision token or cursor-based pagination API (e.g., `&cursor={token}` or `&asOfRevision={rev}`).

### 8.3 Upstream OWPROV Lightweight Tree Enhancement

To ensure that the structural tree can scale cleanly to 50,000 Devices without unnecessary upstream memory and serialization load:
1. OWPROV's `GET /api/v1/entity?getTree=true` currently embeds all device serials inside each Entity and Venue node.
2. MDU strips these device serials and returns `devices: []` in `/properties/tree`.
3. However, OWPROV still incurs database read and JSON serialization overhead for 50,000 serial strings on every tree fetch.
4. OWPROV SHOULD introduce a query parameter:
   ```http
   GET /api/v1/entity?getTree=true&includeDevices=false
   ```
   When `includeDevices=false` is supplied, OWPROV omits device arrays, returning a pure structural hierarchy in < 200 ms.

---

## 9. High-Scale Status Aggregation and Minimum Phase 1 Scale Contract

Architecture evaluates three long-term options for status aggregation:

### Option A — MDU Aggregation, Snapshot Caching, and Bounded Fan-Out (Phase 1 Baseline)

- MDU discovers hierarchy from OWPROV and retrieves inventory using bounded paginated queries.
- MDU maintains a short-lived operational aggregate snapshot keyed by authorized principal and scope projection.
- MDU computes overview and paginated filters.
- **Advantages:** Works with existing OWPROV and OWGW APIs without waiting for new backend services; maintains a single, unified public UI boundary.
- **Trade-off:** MDU owns snapshot lifecycle, concurrency limits, and conservative partial-state handling.

### Option B — OWGW Ownership-Aware Aggregation (Future Optimization)

- OWGW exposes Entity/Venue-aware aggregate/filter endpoints using known ownership.
- MDU combines OWPROV hierarchy with OWGW aggregate results.
- **Advantages:** Computation close to live status; eliminates fan-out across hundreds of OWGW batches.
- **Trade-off:** Requires OWGW changes and high-fidelity real-time ownership synchronization.

### Option C — Analytics/Read Model (Future Optimization for Historical Trends)

- Events populate a dedicated query model keyed by Property/Venue/Device.
- Current and historical queries use that read model.
- **Advantages:** Sub-100ms dashboard queries; native support for historical time-series trends.
- **Trade-off:** Requires streaming event infrastructure and eventual-consistency rules.

For the initial implementation, **Option A** is adopted with strict operational bounds. Option C is preferred when historical charts become mandatory.

### 9.1 Minimum Phase 1 Scale Contract (Option A Specification)

To ensure predictable system performance and prevent backend exhaustion at 10,000–50,000 Devices, MDU MUST implement the following bounded execution contract:

| Dimension | Phase 1 Contract Ceiling | Description & Enforcement |
|---|---|---|
| **OWGW Batch Size** | `100` serials | Maximum serial numbers sent in a single `POST /api/v1/devices/status` batch. |
| **OWGW Downstream Concurrency** | `6` concurrent requests | Semaphore cap on simultaneous active OWGW batch HTTP requests. |
| **OWPROV Inventory Page Concurrency** | `4` concurrent requests | Semaphore cap on simultaneous active OWPROV inventory page requests. |
| **OWPROV Inventory Chunk Size** | `500` records | Limit per page when enumerating inventory across scopes. |
| **Overall Portfolio Aggregation Deadline** | `10.0` seconds | Request-wide timeout for `GET /properties/portfolio`. If unfinished, returns partial snapshot with Unknown status for incomplete batches. |
| **Scoped Device Query Deadline** | `5.0` seconds | Request-wide timeout for `GET /properties/{id}/devices`. |
| **Structural Tree Deadline** | `2.0` seconds | Strict timeout for `GET /properties/tree`. Never waits for inventory or OWGW. |
| **Per-Request Downstream Timeout** | `2.5` seconds | HTTP client timeout for individual calls to OWGW or OWPROV. |
| **Operational Aggregate Cache TTL** | `30` seconds | In-memory cache lifetime of computed scope status rollups keyed by `(principal, scopeProjection)`. |
| **Maximum Stale Age** | `120` seconds | Maximum age for which a stale snapshot can be returned with `dataQuality.state = 'stale'` while an asynchronous background refresh is running. |
| **Request Coalescing** | Single-flight per scope | Simultaneous requests for the same scope share a single in-flight refresh worker. |
| **Memory Ceiling per Aggregation** | `<= 50 MB` | In-memory allocation cap in MDU for a 50,000-Device scope aggregation (enforced via streaming serial deduplication and compact status maps). |

### 9.2 Numerical Latency Targets (p95 Ceilings)

The following p95 latency targets define the operational envelope. Final targets will be benchmarked and calibrated during 10k/50k load testing:

| Endpoint / Operation | 10,000 Devices (p95) | 50,000 Devices (p95) | Fallback / Quality Behavior |
|---|---|---|---|
| `GET /api/v1/properties/tree` | `< 500 ms` | `< 800 ms` | Independent structural load; never blocked by device/status work. |
| `GET /api/v1/properties/portfolio` (Cached) | `< 100 ms` | `< 150 ms` | Served directly from MDU snapshot cache. |
| `GET /api/v1/properties/portfolio` (Cold / Refresh) | `< 3.5 s` | `< 8.0 s` | Coalesced background aggregation; returns stale if available or partial if deadline (10s) reached. |
| `GET /api/v1/properties/{id}/devices` (Page query) | `< 800 ms` | `< 1.5 s` | Evaluates filters against reusable status snapshot; pages bounded inventory. |

---

## 10. Historical Data Model

Historical availability and health require new persistence. A possible aggregate record is:

```text
scope_health_snapshot
  scope_type            property | venue
  scope_id              UUID
  bucket_start          timestamp
  total_devices         integer
  online_devices        integer
  offline_devices       integer
  unknown_devices       integer
  healthy_devices       integer
  warning_devices       integer
  critical_devices      integer
  unknown_health        integer
  needs_attention       integer
  calculation_version   string
  complete              boolean
```

Snapshots MAY be generated from platform events or periodic evaluation. Every time-series response MUST identify incomplete buckets; missing buckets MUST NOT be rendered as zero.

---

## 11. Health and Availability Normalization

### 11.1 Availability Algorithm

MDU MUST use the authoritative current status and accepted freshness window:

```text
if current connection/report proves active:
    ONLINE
else if current data authoritatively proves disconnected/stale beyond threshold:
    OFFLINE
else:
    UNKNOWN
```

A missing serial in an incomplete OWGW response MUST be `UNKNOWN`, not `OFFLINE`.

### 11.2 Health Algorithm

The current implementation derives Device health from the OWGW sanity value (`>= 80` Healthy, `>= 50` Warning, otherwise Critical) and rolls scope health up using current Device results, including a Critical result for any Critical Device or an offline ratio of at least 10 percent. These thresholds are **provisional**, are not yet returned with a calculation version, and MUST be calibrated against the authoritative Phase 1 health policy before being treated as final.

The UI MUST consume MDU's normalized result and MUST NOT independently recalculate it. The target contract SHOULD expose a `calculationVersion` when the policy is approved.

### 11.3 Scope Rollup

Scope rollups MUST:

- deduplicate Devices;
- include only authorized Devices in the requested scope;
- evaluate Critical before Warning before Healthy;
- preserve Unknown when sufficient evidence is unavailable;
- return Unknown/Empty for a zero-Device scope rather than Healthy;
- provide the primary contributing reason where possible.

---

## 12. Data-Quality Contract

Every combined MDU response MUST include:

```ts
type DataQualityState = 'complete' | 'partial' | 'stale' | 'unavailable';

interface DataQuality {
  state: DataQualityState;
  partial: boolean;
  asOf?: string;
  unknownDeviceCount?: number;
  errors: Array<{
    source: 'owprov' | 'owgw' | 'analytics';
    code: string;
    retryable: boolean;
  }>;
}
```

Rules:

1. `complete` means all required downstream contributions were obtained for the stated scope.
2. `partial` permits known values but requires Unknown counts and a visible UI warning.
3. `stale` requires the last successful `asOf` value.
4. `unavailable` means the requested operational result cannot be safely represented.
5. HTTP 200 MAY carry a partial result only when `dataQuality.state` clearly reports it.
6. Complete request failure MUST use an appropriate non-2xx response.
7. Internal downstream details and credentials MUST not be exposed to the browser.

---

## 13. UI Routing and Component Structure

Implemented routes:

```text
/properties
/properties/:scopeType/:scopeId/:tab
```

`scopeType` is `property` or `venue`. Supported tab values are `overview`, the scope-children tab, `devices`, `configuration`, and `details`. The UI must normalize unknown tab values to a safe supported tab.

Implemented component structure:

```text
PropertiesPage
├── PropertyPortfolio
│   ├── summary cards and filters
│   ├── hierarchy/list view and map placeholder
│   └── selected-scope drawer
├── PropertyWorkspace
│   ├── ScopeHeader and ScopeTabs
│   ├── ScopeOverviewTab
│   ├── ScopeChildrenTab
│   ├── ScopeDevicesTab
│   ├── ScopeConfigurationsTab
│   └── ScopeDetailsTab
│       ├── metadata/behavior/notes
│       ├── Contacts and ContactEditorModal
│       └── Locations and LocationEditorModal
└── ScopeEditorModal
```

The implementation SHOULD reuse existing Device table/workspace and Configuration components. It MUST NOT fork their command, permission, or Configuration-editing semantics.

---

## 14. Frontend Types

```ts
type ScopeType = 'property' | 'venue';
type Availability = 'online' | 'offline' | 'unknown';
type Health = 'healthy' | 'warning' | 'critical' | 'unknown';

interface ScopeIdentity {
  id: string;
  type: ScopeType;
  name: string;
  parentId?: string;
}

interface ScopeSummary {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  unknownDevices: number;
  needsAttention: number;
  health: Health;
  primaryReason?: string;
  asOf?: string;
}

interface HierarchyNode extends ScopeIdentity {
  children: HierarchyNode[];
  summary?: ScopeSummary;
}
```

Raw OWPROV Entity and Venue types SHOULD remain separate from normalized UI view models so backend terminology and optional fields are not accidentally flattened or lost during updates.

---

## 15. Query and Cache Strategy

Suggested query keys:

```text
['property-tree']
['property-portfolio']
['scope-overview', scopeType, scopeId]
['scope-details', scopeType, scopeId]
['scope-contacts', sortedContactIds]
['scope-locations', sortedLocationIds]
['available-venue-locations', venueId]
['scope-devices', scopeType, scopeId, filters, page]
['scope-configurations', sortedScopeIds]
['scope-health-history', scopeType, scopeId, range]
```

Rules:

1. Hierarchy metadata and live statistics MUST use separate cache lifetimes.
2. Selecting a scope loads its overview; portfolio aggregation is cached separately from hierarchy metadata.
3. The current portfolio call aggregates all authorized row summaries. A future implementation MAY fetch child statistics lazily if required by scale testing.
4. Mutations MUST invalidate hierarchy metadata, selected details, and affected overview queries.
5. A transient status refresh failure MUST retain previous data as stale when safe and display its age.
6. Polling MUST be paused or reduced when the page is not visible.

---

## 16. CRUD Serialization Rules

### 16.1 Property Create

Minimum payload:

```json
{
  "name": "Sunrise Apartments",
  "parent": "authorized-parent-entity-uuid",
  "description": "Optional description",
  "notes": [{ "note": "Optional note" }],
  "sourceIP": [],
  "deviceRules": {
    "rrm": "inherit",
    "rcOnly": "inherit",
    "firmwareUpgrade": "inherit"
  }
}
```

The parent MUST be selected or fixed by launch context. The UI MUST not submit a context-free Property create request.

### 16.2 Venue Create

Top-level Venue:

```json
{
  "name": "Tower A",
  "entity": "property-uuid",
  "description": "Optional description",
  "notes": [{ "note": "Optional note" }],
  "sourceIP": [],
  "deviceRules": {},
  "location": "optional-location-uuid"
}
```

Child Venue:

```json
{
  "name": "Floor 1",
  "parent": "parent-venue-uuid",
  "description": "Optional description",
  "notes": [{ "note": "Optional note" }],
  "sourceIP": [],
  "deviceRules": {},
  "location": "optional-location-uuid"
}
```

The UI MUST submit exactly one of `entity` or `parent`.

### 16.3 Updates

Update forms MUST use one of these safe strategies:

1. Read the complete object, apply a targeted field delta, and send the preserved object expected by OWPROV; or
2. Use a backend-supported patch contract if one is introduced.

Forms MUST preserve unknown Device Rules, associations, and fields not owned by the form.

### 16.4 Contact and Location Association

Contact and Location create/edit operations call OWPROV directly. Entity-owned records carry the owning Entity. When a Contact is created for a Venue, the UI creates the Contact and then updates the Venue's `contacts` collection. When a Location is created for a Venue, the UI creates the Location and then updates the Venue's single `location` reference. `GET /api/v1/venue?locationsForVenue={venueId}` supplies eligible Venue locations.

The UI currently supports creation and editing. Contact/Location deletion and appending or editing existing scope notes are not implemented in the new Property workspace and MUST NOT be documented as completed behavior.

---

## 17. Unsupported Design Fields

| Design field | Current status | Required implementation |
|---|---|---|
| Property image | Unsupported | Media storage plus Entity image reference/API |
| Property type | Unsupported | Structured Entity metadata field and migration |
| Explicit owner/manager | Unsupported | Relationship or structured metadata contract |
| Primary Contact | Unsupported | Primary reference/flag with validation |
| Property boundary | Unsupported | Geometry schema and map contract |
| Configuration version | Unsupported | Versioned Configuration model/history API |
| Draft/Active/Archived | Unsupported | Lifecycle state and transition API |
| Configuration category | Unsupported | Typed metadata field |
| 24-hour Property trend | Unsupported | Persisted aggregate time-series API |
| Historical comparison | Unsupported | Retention and comparison query contract |

These fields MUST be omitted in the initial implementation unless their supporting contract is approved and implemented.

---

## 18. Error Handling

| Condition | Required behavior |
|---|---|
| Hierarchy unavailable | Full workspace error with retry; do not render fabricated scopes. |
| Overview status partial | Render known metadata and values with Unknown counts and warning. |
| Property/Venue forbidden | Permission-denied state without revealing resource details. |
| Scope not found | Not-found state and safe navigation back to authorized tree. |
| Mutation validation failure | Preserve input and show field/general backend message. |
| Dependency-protected delete | Explain that dependencies must be detached; do not claim deletion succeeded. |
| Status refresh fails after success | Keep last known state as stale with timestamp and retry. |
| Config affected-count fails | Show Configuration metadata; mark affected count unavailable. |

---

## 19. Testing Requirements

### 19.1 MDU Unit and Integration Tests

- Authorized hierarchy is preserved without unauthorized ancestors.
- Direct Entity and descendant Venue Devices are deduplicated.
- Search/filter executes before pagination.
- Partial OWGW batches create Unknown, not Offline.
- Empty scope produces Unknown/Empty health.
- Overview rollups match normalized Device results.
- Venue-only requests do not expose parent metadata.
- Downstream timeouts produce the documented data-quality contract.
- Configuration results do not invent lifecycle/version/category fields.
- Correlation/request identifiers are propagated to downstream calls.

### 19.2 UI Tests

- URL retains selected scope and tab.
- Hierarchy supports recursive expansion and keyboard navigation.
- Contextual Create Property supplies a parent.
- Create Venue submits `entity` XOR `parent`.
- Unknown and partial states are visible and not rendered as Offline.
- Availability and health are visually and semantically separate.
- Unsupported fields are absent.
- Mutation success invalidates affected queries.
- Permission-denied and venue-only experiences do not expose ancestor data.
- Tables use server-provided totals and pagination.

### 19.3 Scale Tests

Before fleet-scale approval, test at minimum:

- 10,000 Devices in one Property;
- 50,000 Devices in one Property;
- deep recursive Venue hierarchy;
- concurrent overview, portfolio, and scoped Device-list requests under high concurrent user load;
- concurrent portfolio aggregation + scoped device search executing simultaneously, verifying request coalescing and bounded thread pool usage;
- one or more failed or timed-out OWGW status batches, verifying graceful degradation to `dataQuality.state = "partial"` with Unknown status and without marking missing devices Offline;
- concurrent inventory mutations (devices reassigned, added, or deleted between pages during multi-page scans), verifying detection via before/after `countOnly` comparison, fallback to conservative partial state, and null total counts;
- independent structural tree responsiveness: verifying `GET /api/v1/properties/tree` returns within budget (< 800ms) without waiting for background 50,000-Device operational reads;
- search/filter on the last logical page of the full scope;
- p95 latency and memory profiling under 50,000 Devices verifying compliance with Section 9.1 and Section 9.2 ceilings.

---

## 20. Delivery Phases

### Phase A — Current Existing-API Foundation

- Authorized normalized hierarchy and portfolio aggregation
- Property/Venue details and direct OWPROV CRUD
- Contact/Location create and edit, details/notes display, and supported behaviors
- Scoped Configurations through the direct OWPROV workaround without fabricated lifecycle fields
- Current Device snapshot through the bounded MDU workaround
- Explicit Unknown/partial handling

### Phase B — Accuracy and Scale

- Descendant-aware OWPROV inventory query
- Server-side Property search/filter/pagination
- Selected high-scale current-status aggregation architecture
- Efficient overview and tree statistics
- Validated 10,000/50,000 Device behavior

### Phase C — Historical and Extended Metadata

- Persisted availability/health snapshots
- Historical trends and comparisons
- Approved Property image/type/owner model
- Primary Contact contract
- Configuration versioning, lifecycle, and category if approved
- Map geometry if approved

---

## 21. Definition of Done

The Property tab is complete for its approved phase when:

1. Every displayed field is backed by an authoritative source or explicitly marked unavailable.
2. Property scope includes direct and authorized descendant Venue Devices.
3. Search/filter/pagination semantics are correct for the complete selected scope.
4. Unknown and partial data cannot be mistaken for Offline, Healthy, or zero.
5. Authorization prevents ancestor and cross-scope disclosure.
6. CRUD preserves fields not owned by the active form.
7. Existing Device and Configuration workflows are reused consistently.
8. Required unit, integration, UI, and agreed scale tests pass.
9. Existing, workaround, proposed, and deferred APIs are explicitly distinguished.

---

## 22. Merge Note

This module specification is consolidated into `Phase_1_Specification.md`. Future changes must keep both copies aligned; the consolidated Phase 1 document is authoritative if the two copies diverge. Existing, workaround, proposed, and deferred capabilities must remain explicitly distinguished.

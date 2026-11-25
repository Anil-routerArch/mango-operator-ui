# Mango Cloud MDU UI — Property Tab Requirements

**Document status:** Phase 1 implementation-aligned draft  
**Version:** 0.2  
**Date:** 19 November 2026  
**Phase:** Phase 1  
**Companion document:** `Property_Tab_Specification.md`

---

## 1. Purpose

This document defines the product and functional requirements for the Mango Cloud **Properties** module. Its approved content is also consolidated into `Phase_1_Requirement.md`; this focused copy is retained for module-level review.

The Properties module provides a hierarchy-first operational workspace in which authorized users can:

1. Navigate through Properties and their Venues, including recursively nested Venues, Devices, and Configurations.
2. Understand current availability and health without confusing unavailable data with an offline or healthy state.
3. Manage Property and Venue metadata using OWPROV as the authoritative source.
4. Inspect Devices and Configurations within the selected hierarchy scope.

Implementation contracts and required API additions are defined in the companion technical specification.

---

## 2. Scope

### 2.1 In Scope

- Authorized Property and Venue hierarchy
- Recursive nested Venues
- Property and Venue selection and navigation
- Current Property and Venue overview statistics
- Property and Venue detail views
- Property and Venue create, update, and dependency-safe delete workflows
- Contacts, locations, notes, and supported behavior settings
- Devices scoped to a Property, Venue, or nested Venue hierarchy
- Configurations scoped to a Property or Venue hierarchy
- Current Device availability and health presentation
- Loading, empty, permission-denied, stale, partial-data, and error states
- Desktop and responsive navigation behavior

### 2.2 Deferred or Dependent on New Platform Capabilities

The following experiences must not be represented as complete until the required backend capability exists:

- Property- and Venue-level historical availability trends
- Property- and Venue-level historical health trends
- Configuration version history
- Configuration lifecycle states such as Draft, Active, and Archived
- Typed Configuration categories such as Wi-Fi, Network, and Security
- Property image/media management
- Structured Property type, owner, and manager metadata
- A backend-authoritative primary-contact designation
- Property boundaries or guaranteed map-ready geometry
- Persistent operational issue management

### 2.3 Out of Scope

- Subscribers and resident self-service workflows
- MPSK/PPSK management
- Billing and service classes
- Firmware catalog and rollout management
- Global audit log
- Client inventory and client troubleshooting
- Replacing OWPROV as the authority for Property, Venue, Contact, Location, or Configuration data

---

## 3. Terminology and Domain Model

| UI term | Backend representation | Meaning |
|---|---|---|
| Property | OWPROV Entity | UI term for every OWPROV Entity, regardless of its hierarchy level or backend classification. |
| Venue | OWPROV Venue | UI term for every OWPROV Venue, including a Venue nested beneath another Venue. A Venue may represent a building, floor, wing, suite, room, or other physical or organizational subdivision. |
| Availability | OWGW connection/current-state data | Whether current Device reachability can be established. |
| Health | Backend-normalized operational condition | Healthy, Warning, Critical, or Unknown based on available signals. |
| Partial data | Incomplete downstream result | Some requested data could not be obtained and must not be interpreted as zero, offline, or healthy. |

The hierarchy is:

```text
Property
├── Property
│   └── Venue
│       └── Venue
│           └── Device(s)
└── Venue
```

The UI must use **Property** for every OWPROV Entity and **Venue** for every OWPROV Venue. Root, Operator, Normal, parent, and child classifications must not introduce different user-facing object names. API and diagnostic contexts may expose backend types where technically necessary.

---

## 4. Product Principles

- **PTR-001:** OWPROV must remain the source of truth for hierarchy and Property/Venue metadata.
- **PTR-002:** OWGW must remain the source of truth for current Device connection and health-related state it owns.
- **PTR-003:** MDU must provide combined operational views when information is required from more than one downstream service.
- **PTR-004:** The browser must not calculate authoritative fleet-scale rollups by recursively downloading every Device.
- **PTR-005:** Availability and health must be presented as separate concepts.
- **PTR-006:** Unknown or unavailable state must never be converted into Offline, Healthy, or zero.
- **PTR-007:** UI action visibility is not a security boundary; backend services must enforce authorization.
- **PTR-008:** The module must not expose unauthorized parent names, identifiers, counts, or hierarchy paths.
- **PTR-009:** Existing OWPROV and OWGW concepts must be reused rather than introducing a duplicate Property data store.
- **PTR-010:** Fields not backed by authoritative platform data must be omitted or clearly labeled as unavailable; the UI must not fabricate version, lifecycle, trend, or health data.

---

## 5. Information Architecture and Navigation

### 5.1 Module Entry

- **PTR-011:** Selecting **Properties** in the main navigation must open the Property hierarchy workspace.
- **PTR-012:** The workspace must show only Properties and Venues authorized for the current user.
- **PTR-013:** The selected Property or Venue must be represented in the URL so refresh, browser history, and direct links preserve context.
- **PTR-014:** When no scope is selected, the UI may select the first authorized scope or show an explicit selection state.
- **PTR-015:** When no Property or Venue is authorized, the UI must display a permission-safe empty state.

### 5.2 Hierarchy Tree

- **PTR-016:** The hierarchy must support Properties at any Entity hierarchy level and recursive Venue nesting while consistently labeling them Property and Venue.
- **PTR-017:** Users must be able to expand and collapse hierarchy nodes.
- **PTR-018:** Hierarchy search must match authorized Property and Venue names.
- **PTR-019:** The structural Property/Venue tree must load independently without waiting for Device inventory enumeration or OWGW operational aggregation. The structural tree must become immediately usable (< 800ms) even for fleets of 10,000–50,000 Devices.
- **PTR-020:** Selecting a Property or Venue must update the workspace without opening a new browser tab.
- **PTR-021:** Venue-only users must be able to start at an authorized Venue without being shown an unauthorized parent Property.

### 5.3 Workspace Tabs

The selected scope may expose the following tabs where authorized and applicable:

- Overview
- Properties & Venues for a Property, or Nested Venues for a Venue
- Details
- Devices
- Configurations

- **PTR-022:** The active tab must be encoded in the URL.
- **PTR-023:** A tab must be hidden or disabled when the user lacks the required permission, without relying on that state for backend security.
- **PTR-024:** Switching tabs must preserve the selected scope and applicable filters where practical.

---

## 6. Property Overview Requirements

- **PTR-025:** The Property header must show its name, hierarchy context, current health state, data freshness, and available actions.
- **PTR-026:** The summary must show, when supported:
  - Direct child Properties
  - Total Venues
  - Total Devices
  - Online Devices
  - Offline Devices
  - Devices with Unknown availability
  - Devices Needing Attention
- **PTR-027:** The overview must distinguish Device availability from Device health.
- **PTR-028:** The overview must provide separate direct-child Property and direct-Venue breakdowns containing:
  - Property or Venue name
  - Hierarchy relationship
  - Health state
  - Total Devices
  - Online Devices
  - Offline Devices
  - Unknown Devices
  - Last status update
- **PTR-029:** Selecting a child Property or Venue must open it in the same workspace.
- **PTR-030:** The Property view must provide a path to Devices requiring attention.
- **PTR-031:** Empty Properties must show zero inventory and an Unknown/Empty health state, not Healthy.
- **PTR-032:** Historical charts must only be shown when a backend-authoritative time-series is available. Until then, the UI must show the current snapshot without a simulated trend.
- **PTR-033:** If any downstream contribution is incomplete, affected statistics must display an Unknown or partial-data indication and the page must identify that the result is incomplete.

---

## 7. Venue Overview Requirements

- **PTR-034:** The Venue header must show its name, authorized hierarchy context, current health state, data freshness, and available actions.
- **PTR-035:** The summary must show Total, Online, Offline, Unknown, and Needing Attention Device counts when supported.
- **PTR-036:** A Venue overview must include its directly assigned Devices and, where the selected scope requests recursive results, Devices assigned to descendant Venues.
- **PTR-037:** The UI must clearly identify whether metrics apply only to the selected Venue or include descendants.
- **PTR-038:** Users must be able to navigate to authorized nested Venues and Devices.
- **PTR-039:** A Venue with no Devices must display an explicit empty state.
- **PTR-040:** A user without access to the parent Property must not see the parent Property in breadcrumbs, links, selectors, or statistics.

---

## 8. Property and Venue Details

### 8.1 Common Information

- **PTR-041:** Details must display supported name, identifier, description, notes, contacts, locations, and behavior settings. Phase 1 create/edit support must use the corresponding OWPROV contracts. Contact/Location deletion and appending or editing an existing scope note remain deferred until explicitly implemented.
- **PTR-042:** Internal identifiers must be copyable but visually secondary to friendly names.
- **PTR-043:** Notes must retain the author/timestamp information provided by the backend.
- **PTR-044:** Unsupported conceptual fields from the design reference—such as Property image, Property type, explicit owner, or Configuration lifecycle—must not be silently synthesized from unrelated data.

### 8.2 Contacts

- **PTR-045:** Authorized users must be able to view, create, and edit Contacts associated with a Property or Venue using supported OWPROV fields. Contact deletion remains deferred in the new Property workspace.
- **PTR-046:** The UI may display the first Contact prominently, but must not label it Primary unless a backend-authoritative primary designation exists.

### 8.3 Locations

- **PTR-047:** A Property may display, create, and edit multiple associated Locations. Location deletion remains deferred in the new Property workspace.
- **PTR-048:** A Venue may display, select, create, and edit its single supported Location.
- **PTR-049:** A map view must be conditional on valid geospatial data and must have a non-map alternative.

### 8.4 Behavior Settings

- **PTR-050:** Supported settings must map losslessly to OWPROV fields, including source-IP behavior and applicable Device Rules such as RRM, firmware upgrade, and release-candidate behavior.
- **PTR-051:** Editing supported fields must preserve unknown backend fields and collections not owned by the current form.

---

## 9. Lifecycle Requirements

### 9.1 Property Lifecycle

- **PTR-052:** Authorized users must be able to create a Property with a required name and parent Property where the backend hierarchy requires a parent.
- **PTR-053:** The parent Property must be visible in the create form or fixed by the context from which creation was initiated.
- **PTR-054:** Authorized users must be able to update supported Property metadata.
- **PTR-055:** Property deletion must require explicit confirmation and respect backend dependency validation.
- **PTR-056:** The UI must not imply that deleting a Property will automatically delete its Venues, Devices, Contacts, Locations, or Configurations.

### 9.2 Venue Lifecycle

- **PTR-057:** Creating a top-level Venue must bind it to exactly one Property.
- **PTR-058:** Creating a nested Venue must bind it to exactly one parent Venue.
- **PTR-059:** The form must not submit both a Property binding and parent-Venue binding.
- **PTR-060:** Authorized users must be able to update supported Venue metadata.
- **PTR-061:** Venue deletion must require explicit confirmation and respect backend dependency validation.

### 9.3 Mutation Feedback

- **PTR-062:** Mutation controls must prevent duplicate submission while a request is in progress.
- **PTR-063:** Successful mutations must refresh affected hierarchy and detail data.
- **PTR-064:** Failed mutations must preserve user input where safe and show the authoritative backend error.
- **PTR-065:** Unsaved-form navigation warnings are required before Phase 1 completion; until implemented, forms must not claim this protection.

---

## 10. Scoped Devices Requirements

- **PTR-066:** The Devices tab must list Devices belonging to the selected Property or Venue scope, including descendants when the view is explicitly recursive.
- **PTR-067:** Property scope must include both Devices assigned directly to the Property and Devices assigned to any descendant Venue.
- **PTR-068:** Device results must support server-side pagination and search at fleet scale. Server-side sorting is required before Phase 1 completion and must not be represented as available until implemented.
- **PTR-069:** Availability, health, and search filters are required in the initial UI. Venue and Device-type filters are required before Phase 1 completion and must be added to the UI and public query contract.
- **PTR-070:** Filtering and search must occur before pagination so counts and pages represent the full selected scope.
- **PTR-071:** Search must support at least Device name and normalized serial number.
- **PTR-072:** Selecting a Device must open the existing Device workspace.
- **PTR-073:** A downstream status failure must not cause affected Devices to be marked Offline.
- **PTR-074:** The list and counters must expose Unknown status and partial result metadata.
- **PTR-075:** The browser must not fetch a fixed maximum number of pages and infer remaining Devices as Offline.

---

## 11. Scoped Configurations Requirements

- **PTR-076:** The Configurations tab must display Configurations associated with the selected Property and applicable Venue hierarchy. The current Phase 1 implementation may read authorized OWPROV Configurations directly and filter them by scope in the UI; a fleet-scale server-paginated MDU contract is deferred.
- **PTR-077:** The selected scope and Configuration assignment relationship must be clear.
- **PTR-078:** Users must be able to open the existing Configuration workflow for an authorized Configuration.
- **PTR-079:** Affected Device counts may be displayed only when obtained from the backend's computed affected-Device result.
- **PTR-080:** Configuration version, category, and lifecycle status must be omitted until those fields are authoritative backend data.
- **PTR-081:** OWGW Gateway Default Configurations must not be mixed into a Property-scoped list as if they were Property assignments; if displayed, they must be presented in a separately labeled global/default context.

---

## 12. Availability, Health, and Data Quality

### 12.1 Availability

| State | Meaning |
|---|---|
| Online | Current platform data confirms an active/recent Device connection. |
| Offline | Current platform data confirms the Device is not connected within the accepted window. |
| Unknown | Current data is missing, stale, never reported, or could not be retrieved. |

### 12.2 Health

| State | Meaning |
|---|---|
| Healthy | No evaluated condition currently requires attention. |
| Warning | One or more evaluated conditions require review. |
| Critical | An evaluated condition indicates significant impairment. |
| Unknown | Sufficient health data is unavailable. |

- **PTR-082:** Health thresholds and rollup rules must be computed by the backend and remain consistent with the main Phase 1 requirements.
- **PTR-083:** The UI must not reimplement or independently calibrate authoritative health rules.
- **PTR-084:** Responses that combine downstream services must indicate whether they are complete, partial, stale, or unavailable.
- **PTR-085:** When data is partial, known counts may be shown only alongside Unknown counts and an explicit partial-data warning.
- **PTR-086:** Zero must mean an authoritative zero, not a timeout, omitted page, or failed downstream call.
- **PTR-087:** The UI must provide retry behavior for unavailable sections without discarding successfully loaded sections.

---

## 13. Authorization and Security

- **PTR-088:** Every read and mutation must be authorized by the responsible backend service.
- **PTR-089:** MDU must forward the authenticated user context and required service identity when calling internal services.
- **PTR-090:** Venue-only authorization must not reveal unauthorized ancestor information.
- **PTR-091:** Search, totals, pagination metadata, and error messages must not disclose unauthorized resources.
- **PTR-092:** Backend authorization is mandatory for every mutation. When an authoritative capability result is available, the UI must use it to hide or disable unavailable actions. Until such a result is integrated, visible controls must handle `403 Forbidden` safely and must not be treated as proof of permission.
- **PTR-093:** Logs and user-facing errors must not expose tokens, service keys, or sensitive Configuration values.

---

## 14. Non-Functional Requirements

- **PTR-094:** The hierarchy shell must become usable without waiting for every operational statistic or fleet Device enumeration.
- **PTR-095:** Tables must remain accurate for deployments containing tens of thousands of Devices, using bounded pagination chunks (e.g. 500 items) and strict execution deadlines.
- **PTR-096:** Device lists must use server-side pagination rather than fixed client-side page-fetch limits. Configuration listing currently uses direct OWPROV retrieval and client-side scope filtering and must be replaced by server-side pagination before fleet-scale approval.
- **PTR-097:** Hierarchy metadata must load independently from operational statistics. MDU retrieves the structural tree without Device serial arrays. Portfolio and overview statistics must use short-lived aggregate snapshots, single-flight request coalescing, and stale-while-revalidate serving to prevent redundant downstream fleet scans.
- **PTR-098:** The UI must support keyboard navigation, visible focus, labeled controls, and status indicators that do not rely on color alone.
- **PTR-099:** Desktop may use a detail drawer; small viewports must provide an accessible full-page or full-width detail experience.
- **PTR-100:** Primary failures must be observable through structured backend logging and correlation identifiers.
- **PTR-101:** Downstream aggregation must observe bounded concurrency (max 100 OWGW batch size, max 6 concurrent OWGW requests, max 4 concurrent inventory page requests) and a hard overall deadline (10s). If inventory mutations (reassignments/deletions) are detected during multi-page scans, MDU must conservatively report partial state with null/unknown totals rather than authoritative numbers.

---

## 15. Acceptance Criteria

1. An authorized user can navigate Property → Property and/or Property → Venue → Venue hierarchies without seeing unauthorized scopes or backend Entity terminology.
2. A Venue-only user can open an authorized Venue without learning the name or statistics of an unauthorized parent Property.
3. An authorized user can create, edit, and dependency-safely delete a Property or Venue using OWPROV-backed workflows.
4. Property and Venue Details accurately preserve supported contacts, locations, notes, and behavior fields.
5. A Property Device list includes directly assigned Devices and Devices assigned to all included descendant Venues.
6. Device search and filters operate over the complete selected scope before pagination.
7. Failed or incomplete OWGW status retrieval produces Unknown/partial state rather than false Offline counts.
8. Availability and health are displayed independently.
9. Empty scopes are displayed as Empty/Unknown rather than Healthy.
10. Scoped Configurations are displayed without fabricated version, lifecycle, or category values.
11. Historical charts are absent or explicitly unavailable until an authoritative time-series API exists.
12. All active tabs and selected hierarchy scope survive page refresh through URL state.
13. Loading, empty, permission-denied, stale, partial-data, and error states are implemented for every primary view.
14. The structural hierarchy tree renders independently and quickly (< 800ms at 50,000 Devices) without waiting for operational status aggregation or Device enumeration.
15. Fleet portfolio operational reads reuse coalesced short-lived snapshots and enforce bounded fan-out and timeouts; inventory mutations detected during multi-page enumeration conservatively degrade to partial data with null totals.

---

## 16. Open Product and Architecture Decisions

1. Whether the first release includes only current snapshot metrics or waits for historical trend support.
2. Final backend health thresholds and Device-sanity interpretation.
3. Whether direct OWPROV Property/Venue CRUD should later be replaced by an MDU façade. Phase 1 uses direct OWPROV calls.
4. Whether Property image, type, owner, and primary contact are required structured fields.
5. Whether Configuration versioning and lifecycle are Phase 1 requirements or later extensions.
6. Whether high-scale live aggregation is implemented in MDU, OWGW, or a dedicated analytics service.
7. Exact performance targets for 10,000- and 50,000-Device Properties.

---

## 17. Merge Note

This module document is consolidated into the Property and Venue section of `Phase_1_Requirement.md`. Future changes must keep both copies aligned; the consolidated Phase 1 document is authoritative if the two copies diverge.

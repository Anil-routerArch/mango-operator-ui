# Mango Cloud MDU UI --- Phase 1 Requirements

**Document status:** Ready for Product and Architecture Review
**Version:** 1.4.1
**Date:** 23 November 2026

------------------------------------------------------------------------

## 1. Purpose

This document defines the product and functional requirements for Phase
1 of the Mango Cloud MDU operator interface.

Phase 1 provides the operational experience required to monitor
Properties, inspect and manage Devices, manage hierarchical
Configuration, and administer Users and Policies.

The interface must be organized around operator workflows rather than
exposing backend service modules directly.

Low-level API endpoints, service communication schemas, and detailed
implementation specifications will be defined in companion technical
documentation, while the core backend capabilities and operational models
outlined in this document are aligned with authoritative platform services.

------------------------------------------------------------------------

## 2. Phase 1 Objectives

Phase 1 must enable authorized users to:

1.  Identify Properties and Devices that need attention.
2.  Navigate consistently from Property to Venue to Device.
3.  Search and inspect the managed Device fleet.
4.  Review Device health, telemetry, configuration, and operational information.
5.  Create and manage reusable Configuration Profiles and
    Configurations.
6.  Assign Configuration at Property, Venue, or Device scope.
7.  Understand the effective Configuration applied to a Device.
8.  View and manage Users.
9.  View and manage Policies and their assignments.
10. View the scope associated with a Policy assignment.
11. Manage Operators where authorized.

------------------------------------------------------------------------

## 3. Scope

### 3.1 In Scope

-   Global operational Dashboard
-   Property and Venue hierarchy (including recursive child Venues)
-   Property overview
-   Venue overview
-   Fleet-level Device management
-   Individual Device operations
-   Configuration Profiles
-   Configuration creation and editing
-   Hierarchical Configuration assignment
-   Effective Configuration and configuration provenance
-   User management
-   User-to-Policy assignment
-   Policy management
-   Policy permissions
-   Assignment Scope for Management Role Assignments
-   Operator administration

### 3.2 Deferred to Phase 2

The following are explicitly outside Phase 1:

-   Global audit logs
-   Firmware management and firmware upgrade workflows
-   Client inventory and client troubleshooting
-   Subscriber management and onboarding
-   MPSK/PPSK subscriber workflows
-   Billing and service-class management
-   Dedicated issue assignment, acknowledgement, and resolution workflow

While multi-level Venue hierarchy (including child Venues representing buildings, floors, or suites) is supported in Phase 1 for device association and configuration assignment, resident tenant identity (Subscribers), MPSK/PPSK credentials, and resident portals remain strictly deferred to Phase 2.

Aggregate client KPIs, client lists, client trends, client association
tables, and subscriber-related workflows must not be included in Phase
1.

Device health indicators may identify conditions that need attention,
but Phase 1 does not introduce a persistent issue-management workflow.

------------------------------------------------------------------------

## 4. Terminology

| UI Term | Meaning |
|---|---|
| **Operator** | A business/provisioning object used to bind subscribers. Creating an Operator automatically creates its corresponding Operator Entity. An Operator is not a loginable User. |
| **Property** | UI term for every authorized OWPROV Entity, regardless of root, operator, normal, parent, or child backend classification. A Property may contain child Properties and/or Venues. |
| **Venue** | UI term for every authorized OWPROV Venue, including a Venue nested beneath another Venue. A Venue may represent a building, floor, common area, suite, room, or another physical or organizational subdivision. |
| **Configuration Profile** | A reusable section-level Configuration component representing the product-facing UI model of an OWPROV **`VariableBlock`**. When referenced by a Configuration section (`{"__variableBlock": ["<uuid>"]}`, with backward compatibility for legacy string format `{"__variableBlock": "<uuid>"}`), the Configuration retains a live reference in `variables[]`. Profile-provided values are resolved dynamically on-demand and are read-only within that Configuration section. |
| **Configuration** | The actual named configuration assembled from supported settings and, where applicable, Configuration Profile values. |
| **Assignment** | Association of a Configuration with a Property, Venue, or Device. |
| **Effective Configuration** | The resulting configuration applicable to a Device after applicable assignments and supported overrides/resolution. |
| **User** | A person with access to Mango Cloud. |
| **User Role** | A management classification associated with a User, such as Admin, CSR, NOC, or Installer. User Role is distinct from a Management Role Assignment. |
| **Management Role Assignment** | A scope-specific assignment object connecting a User to an Entity, one or more Venues, and a Policy. It determines which Policy applies to that User within that scope. |
| **Policy** | A set of resource/action permissions that can be associated with a User through a Management Role Assignment. |
| **Assignment Scope** | The Property and/or Venue associated with a Management Role Assignment. A Policy defines resource/action permissions but does not independently contain an operational scope. |

The conceptual relationship is:

```text
User
 ├── User Role: Admin / CSR / NOC / Installer / ...
 │
 └── Management Role Assignment(s)
      ├── Assignment Scope
      │    ├── Property
      │    └── Venue(s)
      └── Policy
           └── Resource/action permissions
```

The authorization relationship is:

```text
Management Role Assignment
    = User + Assignment Scope + Policy

Backend authorization service
    → evaluates the resulting permissions
```
User Role is an administrative classification only. MDU must not derive or calculate permissions from User Role.

MDU must display and manage these concepts where supported by the backend, but must not implement its own authorization algorithm.

The UI must use **Property** instead of **Entity** for every user-facing OWPROV Entity. Backend/API diagnostics may retain the technical Entity term where necessary.

------------------------------------------------------------------------

## 4.1 Phase 1 Operational Personas and Top Workflows

Phase 1 organizes user experiences around four key operational personas. These personas represent operational archetypes and design targets for workflow efficiency, screen organization, and interaction density.

### Policy-Driven Authorization Principle

These personas describe operational archetypes and typical user journeys, but **the UI must never hard-code, hard-bind, or statically enforce permissions based on persona or User Role labels.**

All operational capabilities (resource visibility, page access, command triggers, configuration editing, and delegation) are governed dynamically by the **Policy** assigned to the user's **Management Role Assignment** and evaluated by the authoritative backend authorization service.

If an organization customizes or modifies policies later (e.g., granting a CSR permission to trigger diagnostic tests, or restricting an Installer's view), the MDU UI must dynamically adapt available navigation, actions, and fields based solely on backend policy evaluation without requiring UI redesign or hard-bound role coupling.

### 1. Admin (Property / Operator Administrator)
* **Scope:** Property-wide, multi-Property, or Operator Entity scope.
* **Operational Focus:** Comprehensive oversight of tenant configuration, scope delegation, access control, and network provisioning.
* **Top Workflows:**
  1. **User & Access Provisioning:** Creating users, defining Management Role Assignments (MRAs), and binding users to Assignment Scopes (Property/Venues) and Policies.
  2. **Configuration Profile & Configuration Management:** Creating and maintaining reusable Configuration Profiles (OWPROV `VariableBlock`s) and named Configurations.
  3. **Hierarchical Assignment & Deployment:** Assigning Configurations to Properties, Venues, or Devices and managing deployment executions.
  4. **Operator Administration:** Managing Operator objects and viewing linked customer properties where authorized.

### 2. NOC (Network Operations Center / Tier 2–3 Support)
* **Scope:** Fleet-wide, regional, or multi-Property operational scope.
* **Operational Focus:** Proactive fleet monitoring, rapid anomaly detection, performance optimization, and operational triage.
* **Top Workflows:**
  1. **Cross-Property Health & Availability Monitoring:** Identifying offline devices, degraded venues, and attention-needing alerts via the operational Dashboard.
  2. **Telemetry & Radio Inspection:** Analyzing radio channel utilization, interference, transmit power, and device uptime across impacted venues.
  3. **Diagnostic Execution:** Running operational diagnostic commands (*Blink, Event Queue, Trace, Script, Re-enroll*) to investigate anomalies.
  4. **Deployment Oversight & Remediation:** Monitoring configuration deployment command states (Completed, Failed, Timed Out) and retrying failed devices.

### 3. Installer (Field Deployment Technician)
* **Scope:** Scoped to a specific Venue or Property during rollout or physical site maintenance.
* **Operational Focus:** Rapid physical device onboarding, location verification, and validating that newly installed hardware successfully receives its effective configuration (optimized for tablet/mobile viewport).
* **Top Workflows:**
  1. **Device Identification & Search:** Quickly locating physical hardware via serial number, device name, or venue filter.
  2. **Physical Location Verification:** Triggering *Blink LED* on a target device to visually confirm physical installation location during on-site deployment.
  3. **Connectivity & Radio Verification:** Confirming immediate device link state, radio channel assignment, and telemetry freshness on-site.
  4. **Effective Configuration Inspection:** Verifying that the device has successfully received its intended configuration and provenance values.
  5. **Hardware Replacement & Recovery:** Performing factory reset or re-enrollment when replacing or servicing hardware.

### 4. CSR (Customer Service Representative / Tier 1 Support)
* **Scope:** Scoped to a specific Property or customer Venue.
* **Operational Focus:** Rapid response to resident or property manager service inquiries by checking local network health without access to deep configuration or destructive actions.
* **Top Workflows:**
  1. **Local Connectivity Triage:** Checking Property or Venue operational status in response to customer connectivity complaints.
  2. **Device State Verification:** Inspecting whether specific APs or gateways serving a tenant are *Online* and *Healthy*.
  3. **Activity & Reboot Review:** Reviewing recent device uptime and reboot history to identify transient issues.
  4. **Structured Escalation:** Escalating verified hardware or connectivity failures to NOC or Admin teams with accurate state and identifier details.

------------------------------------------------------------------------

## 5. Information Architecture

The Phase 1 sidebar should use the following structure:

``` text
OPERATIONS
  Dashboard
  Properties
  Devices

NETWORK
  Configuration
    Configuration Profiles
    Configurations

ADMINISTRATION
  Users & Access
    Users
    Policies
  Operators
```

### Requirements

-   **IA-001:** Selecting **Properties** must open the Property/Venue
    hierarchy.
-   **IA-002:** The application must preserve the selected authorized Property and Venue context while the user moves between related pages. Operator context may be preserved only for users authorized to access Operator administration.
-   **IA-003:** Pages below the Property level must provide breadcrumbs.
-   **IA-004:** Empty, loading, permission-denied, partial-data, and
    error states must be defined for every primary page.
-   **IA-005:** Navigation and available actions must reflect the user's
    authorized access as evaluated by the platform.
-   **IA-006:** MDU must not derive operational authorization or resource visibility from a particular User Role.
-   **IA-007:** Workflow experiences must be optimized for the primary operational personas (Admin, NOC, Installer, CSR) while keeping all functional capabilities dynamically driven by backend Policy evaluation rather than hard-bound to persona classifications.

------------------------------------------------------------------------

## 6. Global Requirements

-   **GLB-001:** Users must only be able to view and act on resources
    for which they have authorization.
-   **GLB-002:** The UI must not expose unauthorized resource
    information.
-   **GLB-003:** Destructive actions must require confirmation and
    clearly identify the target.
-   **GLB-004:** Mutating actions must show progress and a final success
    or failure state.
-   **GLB-005:** Tables must support pagination, sorting, search, and
    filtering where applicable.
-   **GLB-006:** Status labels must not rely on color alone.
-   **GLB-007:** User-facing errors must describe what failed and
    whether the user can retry.
-   **GLB-008:** Duplicate submissions must be prevented while a
    mutation is in progress.
-   **GLB-009:** Pages displaying operational data must provide an
    appropriate refresh or automatic update mechanism.
-   **GLB-010:** The UI must clearly distinguish current, stale,
    unavailable, and failed data.
-   **GLB-011:** Configuration Profile, Configuration, User, and Policy editors must warn the user before navigating away when unsaved changes exist.

------------------------------------------------------------------------

# 7. Dashboard Requirements

## 7.1 Purpose

The Dashboard is the cross-Property operational starting point.

It must answer:

**What needs attention now, and where should the operator go next?**

## 7.2 Functional Requirements

-   **DASH-001:** The Dashboard must support appropriate scope and
    time-range filters.
-   **DASH-002:** It must display:
    -   Total Properties
    -   Properties Needing Attention
    -   Devices Offline
    -   Devices Needing Attention
-   **DASH-003:** It must display Property Health using:
    -   Healthy
    -   Warning
    -   Critical
    -   Unknown
-   **DASH-004:** It must display Device Availability using:
    -   Online
    -   Offline
    -   Unknown
-   **DASH-005:** It must display availability trends when historical
    telemetry is available.
-   **DASH-006:** The Dashboard must provide:
    - an **All Properties** view for users authorized to view Properties; and
    - an **Authorized Venues** view for users whose highest authorized scope is a Venue.

    The applicable view must show, at minimum:
    - Scope name
    - Health status
    - Total Devices
    - Online Devices
    - Offline Devices
    - Devices Needing Attention
    - Last status update
-   **DASH-007:** Users must only see Properties and Venues available
    within their authorized scope.
-   **DASH-008:** Users whose authorized scope contains Venues but does not include the parent Property must receive an **Authorized Venues** view instead of an unauthorized Property view.

-   **DASH-009:** The Dashboard must not expose the name, identifier, health, counts, or other information of a parent Property that the user is not authorized to view.

-   **DASH-010:** Selecting an authorized Venue must open that Venue directly.

-   **DASH-011:** Property-level KPIs must not be calculated, inferred, or displayed for a user who does not have access to that Property.

-   **DASH-012:** Breadcrumbs and scope selectors must not expose unauthorized hierarchy information.
-   **DASH-013:** Selecting a Property or Venue must open its overview.
-   **DASH-014:** Selecting a Device count or attention indicator must
    open the relevant Device view with the appropriate scope/filter
    applied.
-   **DASH-015:** Health information shown on the Dashboard must be
    consistent with Property, Venue, and Device views.

## 7.3 Health and Availability

**Availability** represents whether the platform can currently communicate with or obtain state from a Device.

**Health** represents the operational condition of the Device based on available health indicators.

Health and Availability are separate concepts. An Online Device may have Warning or Critical Health.

| Availability | Meaning |
|---|---|
| Online | The Device is currently reachable or reporting available state. |
| Offline | The Device is not currently reachable or reporting. |
| Unknown | Sufficient current information is unavailable. |

| Health | Meaning |
|---|---|
| Healthy | No monitored condition currently requires attention. |
| Warning | One or more conditions require review. |
| Critical | Conditions indicate significant impairment. |
| Unknown | Current or sufficient health data is unavailable. |

All heavy computational tasks—including device health evaluation, trigger condition determination, and large-scope recursive rollups across Properties and Venues—are performed by the MDU backend rather than in the browser. The MDU UI consumes normalized health results and server-aggregated scope summaries directly via server-side APIs.

-   **DASH-016:** The MDU backend must compute and provide normalized "Needs Attention" and health states for the UI to display across Dashboard, Property, Venue, and Device views.
-   **DASH-017:** A Device must be categorized as Needing Attention when it meets any defined attention trigger condition, including being Offline, in a Warning or Critical health state, or having a failed, timed out, or expired configuration deployment.
-   **DASH-018:** Property and Venue health rollups across large scopes must be calculated on the MDU backend and delivered via server-side APIs, rather than aggregated recursively in the browser.
-   **DASH-019:** When inspecting a Device, Venue, or Property flagged as Warning, Critical, or Needing Attention, the UI must display the primary contributing factor or trigger condition.

### 7.3.1 Baseline Health and Needs Attention Semantics

To establish a consistent operational model for Phase 1 interface development, the platform defines the following baseline conditions for Device Health, Needs Attention triggers, and Scope Rollup.

#### Device Availability States
* **Online:** The Device has established an active management session and has reported telemetry within the expected reporting interval.
* **Offline:** The Device has lost its management connection or has failed to report telemetry within the expected reporting window.
* **Unknown:** The Device has never connected, or telemetry data is insufficient to ascertain connectivity state.

#### "Needs Attention" Trigger Conditions
A Device is flagged as **Needing Attention** if it satisfies any of the following conditions:
* **Connectivity Impairment:** Device Availability is `Offline`.
* **Health Impairment:** Device Health is `Critical` or `Warning`.
* **Configuration Deployment Failure:** The most recent configuration deployment state is `Failed`, `Timed Out`, or `Expired`.
* **Critical System Alarms:** The Device reports unacknowledged operational alarms (e.g., persistent crash reboot loop, storage exhaustion, or security certificate expiration).

#### Device Health Classification

* **Critical Health:** Indicates severe operational degradation, service interruption, or imminent hardware/software failure:
  * **Crash Reboot Loop:** Device experienced repeated unexpected reboots (e.g., more than 3 reboots within a rolling 60-minute window).
  * **Memory Exhaustion:** System RAM utilization exceeds critical threshold (e.g., >90% sustained).
  * **CPU Saturation:** System CPU load exceeds critical threshold (e.g., >95% sustained over 10 minutes).
  * **Uplink Failure:** WAN interface is physically down or unable to resolve default gateway connectivity.
  * **Security / Certificate Failure:** Device management certificate is expired or invalid.

* **Warning Health:** Indicates degraded performance, impending resource stress, or configuration drift:
  * **Elevated Memory Utilization:** System RAM utilization is elevated (e.g., sustained between 75% and 90%).
  * **Elevated CPU Utilization:** System CPU load is elevated (e.g., sustained between 80% and 95%).
  * **RF Degradation:** Radio channel utilization exceeds threshold (e.g., >75% channel utilization or excessive noise/interference).
  * **Certificate Expiration Approaching:** Device management certificate is due to expire within 30 days.
  * **Configuration Out of Sync:** Device running configuration differs from its target assigned configuration, or synchronization is pending.
  * **Radio Interface Degraded:** One or more wireless radios are disabled or reporting anomalous interface errors.

* **Healthy:** All monitored operational metrics (CPU, memory, uptime, radio state, uplink connectivity) are within normal operational limits, and no active warnings, errors, or deployment failures exist.

* **Unknown:** Telemetry data is absent, stale beyond the allowable window, or the device has never reported operational metrics.

#### Property and Venue Health Rollup Semantics
Health states roll up hierarchically from Devices and child Venues to their parent Venue and Property following a deterministic evaluation order (Precedence: **Critical > Warning > Healthy > Unknown / Empty**):

1. **Critical:** Evaluated first. A scope is **Critical** if any of the following apply:
   * At least one assigned Device within the scope has a Health state of `Critical`; OR
   * The percentage of `Offline` Devices within the scope meets or exceeds 10% of total assigned Devices; OR
   * At least one child Venue within the scope has a Health state of `Critical`.

2. **Warning:** Evaluated second (only when not Critical). A scope is **Warning** if any of the following apply:
   * At least one assigned Device within the scope has a Health state of `Warning`; OR
   * At least one assigned Device is `Offline` (and total offline devices remain under the 10% critical threshold); OR
   * At least one child Venue within the scope has a Health state of `Warning`.

3. **Healthy:** Evaluated third (only when neither Critical nor Warning). A scope is **Healthy** if:
   * The scope contains at least one assigned Device or child Venue; AND
   * All assigned Devices within the scope are `Online` and `Healthy`, and all child Venues are `Healthy`.

4. **Unknown / Empty Scopes:**
   * **Empty Scopes (Zero Devices):** When a Property or Venue has 0 assigned Devices (and no reporting child Venues), its health status is displayed as **Unknown** (or empty). Telemetry charts and health visualizations display standard empty states with no data, and the Device table displays an empty state with 0 devices.
   * **Insufficient Telemetry:** If devices exist but report absent or stale telemetry beyond allowable reporting windows, the scope health status is **Unknown**.

The total **Devices Needing Attention** count for a Property or Venue represents the deduplicated count of all assigned Devices (including Devices assigned to descendant child Venues) that meet any "Needs Attention" trigger condition. For empty scopes with 0 devices, this count is 0.

#### Policy and Calibration Note
These baseline indicators, trigger conditions, rollup formulas, and numerical thresholds provide the initial operational definition for Phase 1 interface development. Because real-world deployments and operational profiles vary, specific trigger conditions, thresholds, and categorical classifications may be adjusted, refined, or driven by platform policy in subsequent iterations prior to final implementation freeze.


------------------------------------------------------------------------

# 8. Property and Venue Requirements

## 8.1 Legacy Identifier Continuity and Revised Contracts

The identifiers below are retained so existing tests, tickets, approvals, and implementation plans can be traced to the revised requirements. Their wording is a **versioned revision that supersedes the earlier contract**; this document does not claim that every original meaning remains unchanged. References that depend on the earlier wording should cite the earlier document version, while new implementation and validation must use this version.

Notable intentional extensions include:

| Identifier | Revision in this version |
|---|---|
| `PROP-008` | Expands the Venue-only list into a child-scope list that can include child Properties and Venues. |
| `PROP-009` | Extends navigation from Venue selection to child Property or Venue selection. |
| `PROP-012` | Extends the hierarchy relationship from Property→Venue to Property→Property and Property→Venue. |
| `VEN-005` | Clarifies that a Venue Device list may cover the explicitly selected recursive Venue scope. |

Requirements introduced by this revision use the `PVT-*` namespace so they do not silently reuse a legacy identifier.

- **PROP-001:** The Properties module must show only Properties and Venues available to the current user.
- **PROP-002:** The current scope must be clearly visible.
- **PROP-003:** Users must be able to move between available Properties.
- **PROP-004:** The hierarchy must support access beginning at an authorized Venue where applicable.
- **PROP-005:** The Property header must show its name, health state, authorized breadcrumb, and scope context where applicable.
- **PROP-006:** The Property summary must show Total Devices, Online Devices, Offline Devices, Devices Needing Attention, Total Venues, and impacted scopes when authoritative values are available.
- **PROP-007:** The Property page must provide Property health and Device availability as separate concepts.
- **PROP-008:** The Property page must provide a child-scope list containing name, relationship, health, Total Devices, Online Devices, Offline Devices, and freshness where available.
- **PROP-009:** Selecting an authorized child Property or Venue must open its overview.
- **PROP-010:** The Property view must provide access to Devices requiring attention.
- **PROP-011:** Child-scope presentation must support health/availability inspection and navigation.
- **PROP-012:** The Property page must clearly represent parent-child relationships between Properties and Venues.
- **PROP-013:** Authorized users must be able to create a child Property with a required name, contextual parent, and supported optional metadata.
- **PROP-014:** Authorized users must be able to update supported Property metadata.
- **PROP-015:** Property deletion must require confirmation and must display any returned dependency error without reporting false success.
- **PROP-016:** The UI must refresh Property lifecycle state from its authenticated data source and must not maintain a conflicting browser-only Property record.

- **VEN-001:** The Venue header must identify the Venue and show only authorized hierarchy context.
- **VEN-002:** The Venue summary must show Total, Online, Offline, Unknown, and Devices Needing Attention when authoritative values are available.
- **VEN-003:** The Venue page must provide Device availability and available health information.
- **VEN-004:** The Venue page must identify Devices requiring attention.
- **VEN-005:** The Venue page must list Devices within its selected recursive scope with supported search and filtering.
- **VEN-006:** Selecting a Device must open the existing Device workspace.
- **VEN-007:** The hierarchy must support recursive Venues representing physical or organizational subdivisions.
- **VEN-008:** Nested physical spaces must use the Venue representation rather than a separate Unit data type.
- **VEN-009:** Authorized users must be able to navigate nested Venues, inspect their Devices, and work with Configurations at Venue scope.
- **VEN-010:** Venue operations must not depend on Phase 2 Subscriber or PPSK capabilities.
- **VEN-011:** Authorized users must be able to create a top-level Venue using an `entity` binding.
- **VEN-012:** Authorized users must be able to create a nested Venue using a `parent` Venue binding.
- **VEN-013:** Authorized users must be able to update supported Venue metadata.
- **VEN-014:** Venue deletion must require confirmation and must display any returned dependency error without reporting false success.
- **VEN-015:** The UI must refresh Venue lifecycle and recursive hierarchy state from its authenticated data source.

## 8.2 UI Domain Model

The UI term **Property** represents every authorized OWPROV Entity, regardless of whether OWPROV classifies it as root, operator, normal, parent, or child. The UI term **Venue** represents every authorized OWPROV Venue, including recursively nested Venues. Synthetic discovery wrappers and Operator objects are not user-facing Property nodes.

```text
Property
├── Property
│   └── Venue
│       └── Venue
│           └── Device(s)
└── Venue
```

- **PVT-004:** Unknown or incomplete downstream state must never be converted into Offline, Healthy, or an authoritative zero.

## 8.3 Portfolio and Navigation

- **PVT-005:** The Properties module must show only authorized Properties and Venues and must not reveal unauthorized ancestors, counts, identifiers, or paths.
- **PVT-069:** The UI must render the hierarchy exactly as supplied by its authorized hierarchy data source and must not infer additional parent, child, or sibling scopes.
- **PVT-070:** A Venue returned without a visible ancestor must be rendered as an available root. The UI must not invent a parent Property or Venue to complete its breadcrumb.
- **PVT-006:** The portfolio must support recursive expansion, hierarchy search, selection, and navigation for Property → Property, Property → Venue, and Venue → Venue relationships.
- **PVT-007:** The portfolio must provide authoritative counts for Properties, Venues, nested Venues, Devices, availability, and health when those values are available. Each real authorized Entity node rendered as a Property contributes exactly once to the Property count, including authorized root or Operator-classified Entities. Synthetic hierarchy wrappers and separate Operator business records do not contribute to the Property count.
- **PVT-008:** The selected scope and active tab must be encoded in the URL and survive refresh and browser navigation.
- **PVT-009:** The portfolio may provide a map only when valid geospatial data exists; otherwise it must provide a usable non-map hierarchy/list view and identify the map as unavailable.
- **PVT-010:** The selected-scope drawer must provide Overview, child scopes, Devices, and Details without fabricating unsupported trends or metadata.
- **PVT-011:** A Venue-only user must be able to begin at an authorized Venue without seeing an unauthorized parent Property.
- **PVT-053:** The hierarchy UI must consume structural Property and Venue metadata only and must ignore embedded Device collections if received from a legacy response.
- **PVT-054:** The UI must obtain Device counts from operational summaries and Device identities from the scoped Device query, not from the hierarchy structure.

## 8.4 Scope Workspace

The selected scope exposes the following tabs where applicable: Overview; **Properties & Venues** for a Property or **Nested Venues** for a Venue; Devices; Configuration; and Details.

- **PVT-012:** A Property overview must separately report direct child Properties and direct Venues, plus recursive Device totals, Online, Offline, Unknown, Needs Attention, and normalized health.
- **PVT-013:** A Venue overview must report direct nested Venues and the selected recursive Device scope.
- **PVT-014:** Property and Venue health must be shown separately from Device availability.
- **PVT-015:** Empty scopes must be represented as Empty/Unknown rather than Healthy.
- **PVT-016:** Historical charts must remain absent or explicitly unavailable until an authoritative time-series API exists.
- **PVT-017:** Child breakdowns must include name, relationship, health, Device totals, Online, Offline, Unknown, and freshness where supported.
- **PVT-018:** Selecting a child Property, Venue, or Device must open the corresponding existing workspace.

## 8.5 Details, Contacts, Locations, and Behaviors

- **PVT-019:** Details must display authoritative name, identifier, description, notes, Contacts, Locations, and supported behavior fields.
- **PVT-020:** Contact creation and editing must support visual/name fields, type, email, phones/mobiles, access PIN, description, and notes where applicable.
- **PVT-021:** Location creation and editing must support type, contact numbers, timezone, address, country, building, geocode, description, and notes where applicable.
- **PVT-022:** A Property may manage multiple Locations; a Venue may select its single Location and may launch the same Create Location workflow from its Location selector.
- **PVT-023:** The UI may emphasize a Contact but must not persist or claim a primary designation unless that field is supplied by the data contract.
- **PVT-024:** Supported behavior fields such as source-IP behavior, RRM, firmware upgrade, and release-candidate behavior must map losslessly between loaded values and submitted form payloads.
- **PVT-025:** Updates must preserve unknown fields, Device Rules, associations, and collections not owned by the active form.
- **PVT-026:** The Phase 1 Property workspace must support Contact/Location creation and editing. Contact/Location deletion and editing/appending existing scope notes are not part of the initial implementation increment unless separately approved.
- **PVT-071:** The UI must display only Contact and Location records returned by authenticated data sources and must not use browser-side filtering as an authorization mechanism.
- **PVT-072:** Contact and Location selectors must use the records returned for the selected scope without inferring records from hidden parent or sibling scopes.
- **PVT-073:** The Venue Location selector must consume a consistent `locations` collection for every authenticated user type.
- **PVT-074:** Failed Contact or Location association must preserve the form state and display the returned error without presenting the association as saved.

## 8.6 Property and Venue Lifecycle

- **PVT-027:** An authorized user may create a child Property with required `name` and contextual `parent`, plus supported description, note, source-IP, and Device Rule fields.
- **PVT-028:** An authorized user may create a top-level Venue using exactly one `entity` binding or a nested Venue using exactly one `parent` Venue binding.
- **PVT-029:** Venue creation may include supported description, note, source-IP, Device Rules, and Location.
- **PVT-030:** Create, update, and delete actions must use the authenticated Property API adapters and must treat the returned success or error as authoritative.
- **PVT-031:** Deletion must require explicit confirmation and must not imply cascading deletion of children, Devices, Contacts, Locations, or Configurations.
- **PVT-032:** Mutation controls must prevent duplicate submission, preserve safe user input on failure, surface the authoritative error, and refresh affected hierarchy/detail data on success.
- **PVT-033:** Unsaved-form navigation warnings are required before Phase 1 completion and must not be claimed until implemented.

## 8.7 Scoped Devices

- **PVT-034:** Property Device scope must include Devices directly assigned to the Property and Devices assigned to every descendant independently present in the caller's effective authorized hierarchy, with serial-number deduplication. Child Entities are not included merely because their parent Entity is authorized.
- **PVT-035:** Venue Device scope must include the selected Venue and every nested Venue independently present in the caller's effective authorized hierarchy. Recursive traversal is fixed Phase 1 behavior, not an authorization grant: an exact Venue role contributes only that Venue unless another effective role independently authorizes a child Venue.
- **PVT-036:** Search and supported availability/health filters must apply to the complete scoped result before zero-based pagination.
- **PVT-037:** Venue and Device-type filters are required before Phase 1 completion. Interactive Device result sorting is deferred; Phase 1 uses the stable default order returned by the scoped Device data source.
- **PVT-038:** Missing or partial Device status must be presented as Unknown, not falsely converted to Offline.
- **PVT-039:** The browser must not fetch a fixed number of pages and infer all remaining Devices as Offline.
- **PVT-040:** Device tables must use returned totals rather than inferring fleet size in the browser. Numeric totals and pagination may be shown only when the response identifies them as available.
- **PVT-075:** The UI must request a scoped Device list only after the user selects a Property or Venue and opens its Devices tab. It must reuse established Device presentation and workspace-navigation behavior where compatible and must not preload Device lists for every hierarchy node.

## 8.8 Scoped Configurations

- **PVT-041:** The Configuration tab must display authorized Configurations associated with the selected Property/Venue hierarchy and make the assignment relationship clear.
- **PVT-042:** The initial Phase 1 UI may filter an already-authorized Configuration list by visible scope; it must not fabricate version, category, or Draft/Active/Archived values.
- **PVT-043:** Affected Device counts may be shown only when supplied by the computed-affected result.
- **PVT-044:** Gateway Default Configurations must not be mixed into scoped provisioned assignments as if they were equivalent records.
- **PVT-060:** The UI must not independently reconstruct Configuration inheritance, precedence, Profile/VariableBlock expansion, or effective per-Device configuration from list records.
- **PVT-061:** The scoped Configuration view must distinguish Configurations assigned directly to the selected scope from assignments on descendant scopes. A descendant assignment must not be presented as effective at the selected parent scope.
- **PVT-062:** An inherited Configuration or its source metadata may be displayed only when supplied by the authenticated response. Hidden ancestor names, identifiers, Configuration metadata, and contents must not be inferred.
- **PVT-063:** Effective intended configuration must be presented at Device scope only when a compiled result is supplied. Assignment, compiled intended configuration, deployment progress, and currently running Device state are distinct concepts and must be labeled separately.

## 8.9 Data Quality, Authorization, and Accessibility

- **PVT-046:** Combined responses must distinguish complete, partial, stale, and unavailable data and provide an `asOf` value where available.
- **PVT-048:** UI action visibility is not a security boundary. Capability metadata should hide or disable unavailable controls when available; otherwise controls must safely handle `403 Forbidden`.
- **PVT-049:** The hierarchy shell must become usable independently of operational aggregation, and portfolio statistics must be optimized or lazily loaded if scale testing requires it.
- **PVT-050:** The UI must provide keyboard navigation, visible focus, labeled controls, and status indicators that do not rely on color alone.
- **PVT-051:** Loading, empty, permission-denied, stale, partial-data, and error states must exist for each primary view.
- **PVT-052:** Logs and user-facing errors must not expose tokens, service keys, or sensitive Configuration values.
- **PVT-055:** The UI must render the supplied Device health classification and reasons without recalculating or overriding them from a single signal.
- **PVT-056:** Missing health evidence must be displayed as Unknown rather than Healthy.
- **PVT-057:** The UI must label response time and source measurement time distinctly when both are available and must not fabricate a source timestamp.
- **PVT-058:** When scoped inventory is unavailable, the UI must show an unavailable state with Retry and must not render a partial table as an authoritative empty fleet.
- **PVT-059:** The UI must treat query keys as cache identifiers rather than authorization boundaries and must clear all authenticated queries and mutations on logout, login/MFA identity changes, failed session restoration, invalid or expired tokens, and known authorization-context changes. An ordinary RBAC denial must remove affected protected data without terminating an otherwise valid session.

## 8.10 Deferred Platform Capabilities

The following must not be represented as complete until corresponding UI data is available: Property/Venue historical trends, Configuration version/lifecycle/category, Property media/type/owner/manager metadata, persisted primary Contact, reliable map geometry, and persistent operational issue management.

------------------------------------------------------------------------

# 9. Device Management Requirements

## 9.1 Fleet View

-   **DEV-001:** The Devices page must show Devices available within the
    user's authorized scope.
-   **DEV-002:** Fleet information must provide visibility into:
    -   Total Devices
    -   Online
    -   Offline
    -   Warning
    -   Critical
    -   High Memory
    -   Certificate Warning
-   **DEV-003:** Client counts and client association information must
    not be displayed in Phase 1.
-   **DEV-004:** Fleet views must provide Device status, health, type,
    vendor, uptime, memory, and operational-result information.
-   **DEV-005:** Users must be able to search by Device name, Serial Number, Property, or Venue. Searching by Serial Number must match regardless of delimiter formatting (e.g., matching entries with or without colons or hyphens).
-   **DEV-006:** Users must be able to filter by available Device and
    scope attributes.
-   **DEV-007:** The Device table must provide, at minimum:
    -   Name
    -   Serial number
    -   Device type
    -   Property
    -   Venue
    -   Status
    -   Health
    -   Model
    -   Uptime/last seen
    -   Certificate state
-   **DEV-008:** Selecting a Device must open the individual Device
    page.

## 9.2 Individual Device Page

The Device page must provide the following tabs:

1.  Overview
2.  Radios
3.  Configuration
4.  Activity

-   **DEV-009:** The Device header must show key identity, connection,
    health, scope, and last-seen information.
-   **DEV-010:** Primary Device actions supported in the Phase 1 UI are Blink, Event Queue, Factory Reset Device, Re-enroll, Telemetry, Script, Trace, and Export Device Data.
-   **DEV-011:** Destructive Device actions must require confirmation.
-   **DEV-012:** While device firmware upgrades are supported by the underlying backend platform, Firmware Upgrade actions and workflows are deferred to Phase 2 and must not be exposed as active interactive workflows in the Phase 1 UI.
-   **DEV-013:** Device deletion must be exposed to authorized users within the individual Device view.

-   **DEV-014:** Device deletion must require explicit confirmation identifying the target Device.

-   **DEV-015:** The UI must display the final backend result of the deletion request and must not imply success before the backend confirms it.

### Overview

-   **DEV-016:** The Overview must provide key Device identity,
    connectivity, operational health, and provisioning information.
-   **DEV-017:** The latest health state and current attention
    conditions must be visible.
-   **DEV-018:** Missing or stale information must be explicitly
    identified.

### Radios

-   **DEV-019:** The Radios tab must show supported and active radios.
-   **DEV-020:** Radio information must include operational
    information such as enabled state, channel, width, TX power,
    utilization, and temperature.
-   **DEV-021:** Client association information is deferred to Phase 2.

### Configuration

-   **DEV-022:** The Configuration tab must distinguish:
    -   Assigned Configuration (inherited from parent Property or Venue scope)
    -   Device-Specific Configuration and Runtime Parameter Overrides (e.g., Radio Channel, TX Power)
    -   Effective / Computed Configuration (compiled on-demand via APConfig, with provenance indicating the origin of each setting)
-   **DEV-023:** Users must be able to inspect the computed configuration provenance to understand where each effective value originates (Property, Venue, Profile, or local Device override).
-   **DEV-024:** Authorized users must be able to modify supported
    Device-specific overrides.
-   **DEV-025:** The UI must preview relevant changes before saving or
    applying an override.
-   **DEV-026:** Saving a configuration assignment or override must not
    be presented as equivalent to applying it to a live Device.

### Activity

-   **DEV-027:** The Activity tab must show relevant Device operational
    activity.
-   **DEV-028:** The Activity tab must include command history, configuration
    activity, and reboot history.
-   **DEV-029:** Activity is separate from the future global audit-log
    workflow.
-   **DEV-030:** Operational activities must show available status,
    time, and result information.

## 9.3 Device Onboarding and Lifecycle Management

Physical network devices (APs, switches, gateways) are claimed and onboarded into the fleet via the MDU interface, registering the device directly into OWPROV inventory and binding it to an operational Property or Venue.

### Device Serial Number Specification
To ensure unambiguous validation, uniqueness enforcement, searchability, and backend mapping:
* **Primary Identifier (`serialNumber`):** Every physical device is identified across the platform by its **Serial Number** (`serialNumber`), which is a unique 12-character hexadecimal string (e.g., `24f5a201ab34`).
* **Input Flexibility & Normalization:** Hardware stickers and barcode scans commonly format the serial number as a continuous string or with standard delimiters (such as colons or hyphens). The onboarding interface accepts the serial number formatted either way and automatically normalizes it into a clean 12-character lowercase hexadecimal string before submitting to inventory.
* **Validation & Uniqueness:** The Serial Number must be unique across the platform inventory. While downstream OpenAPI schemas define serial numbers generically as strings, the authoritative backend runtime strictly enforces 12-character hexadecimal formatting and normalization; the UI validates and normalizes inputs prior to submission, rejecting duplicate or invalid serial numbers with immediate, actionable error feedback.

### Supported Fields
* `serialNumber` (string, required): Unique 12-character hexadecimal Serial Number of the device.
* `name` (string, required): Friendly device name.
* `deviceType` (string, required): Supported hardware device category or model type (e.g., AP, switch).
* **Scope Binding** (mutually exclusive):
  * `entity` (UUID): Property identifier, specified when the device is assigned directly to the Property.
  * `venue` (UUID): Venue identifier, specified when the device is assigned to a specific Venue within the Property hierarchy.
* `description` (string, optional): Explanatory hardware description, asset tag, or location notes.
* `deviceConfiguration` (UUID, optional): Specific Configuration assigned directly to the Device during onboarding.

### Lifecycle Operations
* **Scope Reassignment:** Authorized users can move a device between Venues within an authorized Property by updating its scope binding.
* **Decommissioning & Deletion:** Unclaiming or deleting a device removes its inventory record and associations from OWPROV upon explicit confirmation.

### Requirements

-   **DEV-031:** Authorized users must be able to onboard (claim) a new Device into the managed fleet via a dedicated onboarding workflow.
-   **DEV-032:** The Device onboarding workflow must collect the Device `serialNumber`, friendly `name`, `deviceType`, and the target scope binding (`entity` or `venue`).
-   **DEV-033:** The Serial Number input field must accept both continuous 12-character strings and delimited formats (with colons or hyphens), automatically normalizing the input to 12 lowercase hexadecimal characters.
-   **DEV-034:** Device onboarding must enforce format validation (rejecting non-hexadecimal characters and invalid lengths) and inventory uniqueness validation, displaying actionable error messages if the Serial Number is invalid or already registered.
-   **DEV-035:** Authorized users must be able to reassign an existing device between Venues within an authorized Property by updating its scope binding.
-   **DEV-036:** Device decommissioning/deletion must remove the device from OWPROV inventory and verify the final backend operation result.

------------------------------------------------------------------------

# 10. Configuration Requirements

## 10.1 Configuration Model

Phase 1 supports configuration across a multi-tier inheritance hierarchy:

``` text
Default (Gateway Hardware Baseline)
   ↓
Property (Entity-level Configuration)
   ↓
Venue (Hierarchical Venue Configuration)
   ↓
Device (Device-Specific Configuration)
   ↓
Runtime Overrides (Parameter-level tuning)
```

The resulting Device configuration compiled across this hierarchy is the **Effective Configuration**.

### Target Scope and Storage Selection Semantics

Downstream Mango Cloud services maintain different configuration capabilities depending on where the configuration is stored:

1. **Property and Venue Scopes (OWPROV):** Configurations assigned at Property, Venue, or nested child Venue levels are stored in OWPROV. These scopes fully support hierarchical inheritance, Configuration Profiles (OWPROV `VariableBlock` objects), and dynamic on-demand compilation via OWPROV `APConfig`.
2. **Gateway Defaults (OWGW `default_configurations`):** Default configurations stored in OWGW provide hardware-model baselines when a device has no scope-specific configuration. OWGW does not maintain VariableBlock entities and does not possess variable compilation logic.
3. **Selective UI Adaptation:** To ensure valid payloads and prevent downstream deployment errors, the MDU UI adapts its configuration editor based on the chosen destination target:
   - When creating or editing a Configuration targeted at **Property or Venue scopes (OWPROV)**, the UI enables the **Configuration Profile** selector across supported sections (e.g., Radios, Interfaces), allowing operators to link reusable profiles or configure sections manually.
   - When creating or editing a Configuration targeted as a **Gateway Default (OWGW)**, the UI selectively hides or disables Configuration Profile dropdowns and presents direct configuration input fields only, ensuring the resulting payload is completely self-contained and flat without unresolved variable references.

### Requirements

-   **CFG-001:** Users must be able to understand which configuration
    applies to a Device.
-   **CFG-002:** The UI must identify inherited and Device-specific
    values.
-   **CFG-003:** Users must be able to preview relevant configuration
    changes before applying them.
-   **CFG-004:** Invalid or incomplete configurations must provide a
    clear validation error.

## 10.2 Configuration Profiles

Configuration Profiles are reusable section-level Configuration components.

### Product-to-Backend Mapping
Configuration Profiles in the MDU UI are explicitly defined as the product-facing representation of OWPROV **`VariableBlock`** objects (`/api/v1/variable`). The MDU UI does not introduce or require a separate independent Profile data store; it maps directly to OWPROV VariableBlock services and the underlying `variables2` database schema.

Configuration Profiles apply specifically to OWPROV configuration scopes (Properties, Venues, and OWPROV-managed device configurations). Because OWGW does not store VariableBlocks or execute dynamic variable compilation (`APConfig`), Configuration Profiles are not used when authoring flat Gateway Default configurations or direct OWGW device table configurations.

In Configuration JSON, referencing a Configuration Profile inserts an OWPROV `{"__variableBlock": ["<uuid>"]}` reference into the corresponding configuration section, and the Configuration retains a reference in its `variables[]` array. OWPROV tracks referencing Configurations directly in `variableBlock.configurations` (and `inUse`), enabling native dependency-safe lifecycle enforcement.

A supported Configuration section may reference one Configuration Profile at a time.

When a Configuration Profile is selected for a Configuration section, the Configuration retains a live reference to that Profile. Profile-provided values are resolved from the current Profile (VariableBlock) definition and are read-only within the Configuration.

Profile-provided values cannot be individually overridden within the Configuration.

When a Profile is selected, the user may:

- View Profile
- Replace Profile
- Remove Profile and configure manually

Removing the Profile reference allows that Configuration section to be configured manually.

Complete Configuration Templates are not included in Phase 1. Configuration Profiles are reusable section-level components and must not be presented as complete Configurations.

### 10.2.1 Supported Configuration Profile Types & Wire Schemas

Phase 1 provides dedicated UI form builders, validation rules, and OWPROV wire serialization for eight (8) foundational Configuration Profile section types:

#### 1. Radio Profile (`radio`)
Defines physical radio frequency (RF) operational parameters and advanced 802.11 physical/MAC layer behavior across device bands:
* **Section Prefix:** `radio`
* **General Parameters:**
  * `band` (string, required): Operating RF band (`2G`, `5G`, `5G-lower`, `5G-upper`, `6G`, `HaLow`).
  * `bandwidth` (number, required): Channel bandwidth in MHz (`5`, `10`, `20`).
  * `country` (string, required): Two-letter ISO country code (e.g., `US`, `DE`, `CA`).
  * `channel-mode` (string, required): PHY modulation standard (`HT` for 802.11n, `VHT` for 802.11ac, `HE` for 802.11ax, `EHT` for 802.11be).
  * `channel-width` (number, required): Operating channel width in MHz (`20`, `40`, `80`, `160`).
  * `channel` (string / array of numbers, required): Static channel assignment (e.g., `[36]`) or dynamic `auto` channel selection.
  * `mimo` (string, optional): Spatial stream MIMO configuration (`1x1`, `2x2`, `3x3`, `4x4`, `8x8`).
  * `tx-power` (number, optional): Transmit power limit in dBm (0 = driver default).
  * `legacy-rates` (boolean, optional): Enable legacy 802.11b/g data rates.
  * `max-clients` (number, optional): Maximum associated stations on this radio interface.
  * `multiple-bssid` (boolean, optional): Enable Multiple BSSID (MBSSID) beacon reduction.
* **Advanced Parameters:**
  * `allow-dfs` (boolean, optional): Allow Dynamic Frequency Selection channels in radar bands.
  * `beacon-rate` (number, optional): Beacon transmission rate.
  * `beacon-interval` (number, optional): Beacon interval in Time Units (TUs) (default: 100).
  * `multicast-rate` (number, optional): Multicast frames transmission rate.
  * `ema` (boolean, optional): Enhanced Multi-BSSID Advertisement support.
  * `bss-color` (number, optional): 802.11ax BSS coloring identifier (1–63).
  * `require-mode` (string, optional): Restrict associations to specific PHY modes (e.g., `HT`, `VHT`, `HE`).
  * `hostapd-iface-raw` (array of strings, optional): Custom hostapd interface directives passed directly to the radio driver.

#### 2. SSID Profile (`interface.ssid`)
Defines wireless network service set parameters, encryption, and client access rules:
* **Section Prefix:** `interface.ssid`
* **Core Parameters:**
  * `name` (string, required): Broadcast wireless network name (SSID).
  * `bss-mode` (string, required): Operational BSS mode (`ap`, `mesh`, `wds-ap`, `wds-sta`).
  * `wifi-bands` (array of strings, required): Enabled frequency bands (subset of `["2G", "5G", "6G"]`).
  * `encryption` (object, required): Authentication suite and key management:
    * `proto` (string): `psk`, `psk2`, `sae`, `sae-mixed`, `wpa2`, `wpa3`, `wpa3-mixed`, `none`.
    * `key` (string, optional): Pre-Shared Key (8–63 ASCII characters or 64 hex digits) for PSK/SAE.
    * `ieee80211w` (string, optional): Protected Management Frames (`disabled`, `optional`, `required`).
  * `hidden-ssid` (boolean, optional): Suppress SSID broadcasting in beacon frames.
  * `isolate-clients` (boolean, optional): Client L2 intra-BSS isolation.
  * `power-save` (boolean, optional): 802.11 power-save mode optimizations.
  * `purpose` (string, optional): Functional classification (e.g., `guest`, `employee`, `onboarding`).
  * `maximum-clients` (number, optional): Per-BSS station limit.
  * `dtim-period` (number, optional): Delivery Traffic Indication Message period.
  * `rate-limit` (object, optional): Upstream/downstream bandwidth limits in kbps (`ingress-rate`, `egress-rate`).
  * `roaming` (object, optional): Fast roaming acceleration including 802.11r (FT), 802.11k (RRM), and 802.11v (BSS Transition).

#### 3. IPv4 Network Profile (`interface.ipv4`)
Defines interface layer-3 IP addressing, DHCP server pools, and NAT capabilities:
* **Section Prefix:** `interface.ipv4`
* **Parameters:**
  * `addressing` (string, required): Interface addressing mode (`static` or `dhcp`).
  * `subnet` (string, required for static): Interface IPv4 address and CIDR prefix (e.g., `192.168.1.1/24`).
  * `gateway` (string, optional): Default upstream gateway IPv4 address.
  * `dhcp` (object, optional): Integrated local DHCP server configuration:
    * `lease-first` (number): Starting IP pool offset.
    * `lease-count` (number): Total pool size.
    * `lease-time` (string): Lease duration (e.g., `12h`, `24h`).
    * `dns` (array of strings): Primary and secondary DNS nameserver addresses.
  * `static-leases` (array of objects, optional): Fixed IP reservations (`mac`, `ip`, `name`).
  * `port-forward` (array of objects, optional): Destination NAT mappings (`protocol`, `external-port`, `internal-ip`, `internal-port`).
  * `nat` (boolean, optional): Enable SNAT/masquerading on egress traffic.

#### 4. Enterprise & Local RADIUS Profile (`interface.ssid.radius`)
Defines 802.1X Enterprise authentication, accounting, and local embedded authentication services:
* **Section Prefix:** `interface.ssid.radius`
* **Authentication Server:**
  * `host` (string, required): FQDN or IP address of the primary RADIUS server.
  * `port` (number, required): UDP authentication port (default: 1812).
  * `secret` (string, required): Shared secret key.
  * `mac-filter` (boolean, optional): Enable RADIUS MAC-based authentication / filtering.
* **Accounting Server:**
  * `enable` (boolean): Toggle for dedicated accounting server.
  * `host` (string, optional): Accounting server host.
  * `port` (number, optional): UDP accounting port (default: 1813).
  * `secret` (string, optional): Accounting shared secret key.
* **Dynamic Authorization (CoA / Disconnect Messages):**
  * `enable` (boolean): Toggle for RFC 5176 Dynamic Authorization.
  * `host` (string, optional): Authorized client IP.
  * `port` (number, optional): CoA UDP port (default: 3799).
  * `secret` (string, optional): Shared secret for CoA messages.
* **General RADIUS Settings:**
  * `nas-identifier` (string, optional): Network Access Server Identifier attribute.
  * `chargeable-user-id` (boolean, optional): Enable RFC 4372 CUI tracking.
* **Local RADIUS Server (`local-radius`):**
  * `server-identity` (string, optional): Server EAP identity name.
  * `users` (array of objects, optional): Embedded local user database:
    * `mac` (string, optional): Client station MAC address.
    * `username` (string, required): EAP username / identity.
    * `password` (string, required): User password / credential.
    * `vlan-id` (number, optional): Dynamic VLAN assignment ID.

#### 5. VLAN Profile (`interface.vlan`)
Defines 802.1Q virtual LAN segmentation and tagging parameters:
* **Section Prefix:** `interface.vlan`
* **Parameters:**
  * `vlan-id` (number, required): 802.1Q VLAN tag identifier (1–4094).
  * `description` (string, optional): Network segment purpose or billing tag.
  * `isolate` (boolean, optional): Intra-VLAN client traffic isolation.

#### 6. Network Tunnel Profile (`interface.tunnel`)
Defines point-to-point and multipoint layer-2/layer-3 overlay encapsulation tunnels:
* **Section Prefix:** `interface.tunnel`
* **Parameters:**
  * `proto` (string, required): Tunnel encapsulation protocol (`vxlan`, `l2tp`, `gre`).
  * `peer-address` (string, required): Remote endpoint IP address or FQDN.
  * `peer-port` (number, optional): UDP port for overlay traffic (e.g., 4789 for VXLAN).
  * `server` (boolean, optional): Device operates as tunnel server or tunnel initiator.
  * `credentials` (object, optional): Tunnel authentication username and password.
  * `healthcheck` (object, optional): Tunnel keepalive and heartbeat verification interval.

#### 7. Captive Portal Profile (`interface.captive`)
Defines guest access captive portal interception, authentication flows, and walled garden rules:
* **Section Prefix:** `interface.captive`
* **Core Parameters:**
  * `auth-mode` (string, required): Interception and authentication workflow:
    * `click-to-continue`: Lightweight splash page acknowledging Terms of Service.
    * `credentials`: Local web form requiring guest login credentials.
    * `radius`: Web portal authenticating against an external RADIUS backend.
    * `external`: Complete redirection to an external third-party portal service.
  * `portal-url` (string, required for `external`): Target redirect URL for external portal engine.
  * `walled-garden` (array of strings, optional): Whitelist of pre-authentication accessible FQDNs, IPs, and subnets.
  * `session-timeout` (number, optional): Maximum authorized session length in minutes.
  * `idle-timeout` (number, optional): Inactive client disconnection timeout.
  * `redirect-url` (string, optional): Landing page shown post-authentication.

#### 8. Passpoint / OpenRoaming Profile (`interface.ssid.openroaming`)
Defines WBA Hotspot 2.0 (802.11u) / Passpoint and OpenRoaming federated authentication parameters:
* **Section Prefix:** `interface.ssid.openroaming`
* **Parameters:**
  * `venue-name` (string, optional): Human-readable venue name advertised over ANQP.
  * `venue-url` (string, optional): Informational URL for the venue.
  * `venue-group` (number, optional): Hotspot 2.0 venue group code.
  * `venue-type` (number, optional): Hotspot 2.0 venue type code.
  * `auth-type` (string, optional): Network authentication type indicator.
  * `domain-name` (array of strings, optional): Authoritative domain names advertised in ANQP.
  * `anqp-domain` (number, optional): ANQP Domain ID (0–65535).
  * `roaming-consortium` (array of strings, optional): 24-bit or 36-bit Roaming Consortium Organization Identifiers (RCOIs) (e.g., `BA-A2-F0-00-00` for OpenRoaming).
  * `wan-metrics` (object, optional): WAN link status, symmetric/asymmetric link speed, and load metrics.

### 10.2.2 VariableBlock Wire Format & Backend Serialization

Configuration Profiles are persisted in the OWPROV database (`variables2` table) as `VariableBlock` resources. Each `VariableBlock` entity encapsulates metadata and a structured array of variable definitions:

```json
{
  "name": "Corporate 5GHz Radio Profile",
  "description": "Standard 5GHz high-density RF configuration",
  "entity": "00000000-0000-0000-0000-000000000001",
  "venue": "11111111-1111-1111-1111-111111111111",
  "variables": [
    {
      "prefix": "radio",
      "type": "json",
      "weight": 100,
      "value": {
        "band": "5G",
        "bandwidth": 20,
        "country": "US",
        "channel-mode": "HE",
        "channel-width": 80,
        "channel": "auto",
        "mimo": "4x4",
        "tx-power": 20,
        "allow-dfs": false
      }
    }
  ]
}
```

* **Scope Hierarchy (`entity` vs `venue`):**
  * A Profile created with an `entity` UUID is scoped to the Property and can be referenced by Configurations within that Property and its Venues.
  * A Profile created with a `venue` UUID is scoped strictly and exclusively to that specific Venue (it is not visible to or inherited by child Venues).
* **Variable Items:** Each entry in `variables[]` contains:
  * `prefix` (string): Configuration subsection identifier (matching the profile type, e.g., `radio`, `interface.ssid`).
  * `type` (string): Data encoding type (`json` for structured profiles).
  * `weight` (number): Resolution precedence weight (default: 100).
  * `value` (object): The profile's configuration payload.

### 10.2.3 Operator Interface Simplification

To ensure a streamlined, operator-friendly workflow and avoid UI cognitive overload:
1. **Suppression of Internal Backend Registry Clutter:** The UI suppresses internal database artifact metadata—such as raw internal Variable IDs, raw section prefixes, JSON type indicators, internal weight values, and redundant backend status cards.
2. **Context-Aware Sub-Tabs:** Redundant sub-tabs (such as separate "Referencing Configurations" read-only tables) are removed from the profile editor in favor of unified, contextual dependency dialogs shown only when relevant (e.g., during deletion confirmation or pre-save impact checks).
3. **Structured Form Experience:** Operators interact with validated form inputs, switches, and structured tables; the system seamlessly handles JSON parsing, default population, and wire payload generation.

### Dynamic Resolution Semantics
Configuration resolution occurs dynamically on-demand via OWPROV's **`APConfig`** compiler:
1. When generating a device configuration or rendering a configuration preview, `APConfig` dynamically retrieves the current `VariableBlock` records referenced by UUID and merges them into the resolved configuration.
2. Updating a Configuration Profile updates the underlying `VariableBlock` record in OWPROV.
3. Because resolution is dynamic, updating a Configuration Profile is immediately reflected in configuration previews and in subsequent device configuration generation for future deployments across all referencing Configurations.
4. Saving or updating a Configuration Profile **never** automatically pushes or deploys live configuration changes to Devices over OWGW. Deployed Devices continue running their existing runtime configuration until an explicit deployment action is initiated by an authorized operator (aligning with CFG-015 and CFG-035).
5. These dynamic resolution mechanics, variable referencing structures, and dependency validation checks are validated against authoritative OWPROV backend services and reflect confirmed platform capabilities.
6. **Profile Impact Preview Resolution Flow:** Before a Profile change is saved, the platform resolves affected Devices using a two-tier aggregation flow:
   - The Profile's `variableBlock.configurations` provides the list of referencing Configuration UUIDs.
   - For each referencing Configuration, the backend resolves its active scope assignments across Property, Venue, and Device levels, cascading down child Venues to collect affected devices.
   - The resulting device lists from each Configuration are aggregated and deduplicated into a unified set of affected Devices.
   - Flow summary: `variableBlock.configurations` → resolve scope assignments per Configuration → aggregate & deduplicate → affected Devices.

### Requirements

- **CFG-005:** Reusable section-level configuration components must be presented in the UI as **Configuration Profiles**, mapping directly to OWPROV `VariableBlock` APIs without an independent MDU profile data store.

- **CFG-006:** Users must be able to create, view, edit, and duplicate Configuration Profiles where authorized.

- **CFG-007:** A Configuration Profile must include:
  - Name
  - Description
  - Scope Binding (`entity` for Property scope, or `venue` for Venue scope)
  - Configuration section (`radio`, `interface.ssid`, `interface.ipv4`, `interface.ssid.radius`, `interface.vlan`, `interface.tunnel`, `interface.captive`, `interface.ssid.openroaming`)
  - Supported reusable values adhering to the section's wire schema

- **CFG-008:** A supported Configuration section may reference only one Configuration Profile at a time.

- **CFG-009:** When a Configuration Profile is selected for a Configuration section, the Configuration must retain a live reference to that Profile via OWPROV `{"__variableBlock": ["<uuid>"]}` in the section payload and in the root `variables[]` array.

- **CFG-010:** Profile-provided values must be read-only within the Configuration and must not support field-level overrides.

- **CFG-011:** The UI must identify Profile-provided values using a source label such as `From Profile: <Profile Name>`.

- **CFG-012:** When a Profile is referenced, the available Profile actions must include:
  - View Profile
  - Replace Profile
  - Remove Profile and configure manually

- **CFG-013:** Updating a Configuration Profile must dynamically update the resolved values of every Configuration that references that Profile upon compilation by OWPROV `APConfig`.

- **CFG-014:** Before a Profile change is saved, the UI must show the Configurations and Devices potentially affected by the change. Referencing Configurations are obtained from the VariableBlock relationship, and the backend must resolve those Configurations through their Property, Venue, and Device assignments and return the deduplicated affected Device set.

- **CFG-015:** Saving a Configuration Profile must update the underlying VariableBlock but must not automatically deploy or push live configuration changes to Devices.

- **CFG-016:** Configuration previews must dynamically resolve the latest saved Profile (VariableBlock) values via APConfig.

- **CFG-017:** An in-use Configuration Profile must not be deleted until all referencing Configurations in its `configurations` list are removed or replaced.

- **CFG-018:** Deployment records must identify the Configuration Profile revision used when the downstream platform provides revision information.

- **CFG-049:** The UI must support the eight (8) defined Configuration Profile section types (`radio`, `interface.ssid`, `interface.ipv4`, `interface.ssid.radius`, `interface.vlan`, `interface.tunnel`, `interface.captive`, `interface.ssid.openroaming`), providing tailored form controls, input validations, and default parameter initialization for each type.

- **CFG-050:** The Radio Configuration Profile must provide validated controls for standard RF parameters (band, bandwidth, country, channel-mode, channel-width, channel, MIMO, TX power) and advanced parameters (allow-dfs, beacon-rate, beacon-interval, multicast-rate, EMA, BSS color, require-mode, and raw hostapd directives).

- **CFG-051:** The RADIUS Configuration Profile must support enterprise 802.1X authentication, optional accounting, optional dynamic authorization (CoA/DM), general parameters, and a local RADIUS user database with tabular credential management (MAC address, username, password, VLAN ID).

- **CFG-052:** The Captive Portal Configuration Profile must dynamically display context-specific fields tailored to the selected authentication action (`click-to-continue`, `credentials`, `radius`, `external`).

- **CFG-053:** The IPv4 Configuration Profile must provide comprehensive network configuration, including static/DHCP addressing modes, subnet CIDR validation, gateway IP, DHCP server range calculation, lease parameters, DNS servers, static IP leases, and port forwarding rules.

- **CFG-058:** Configuration Profile referencing within a Configuration must enforce strict scope eligibility in the UI. When authoring a Configuration at Property scope, the Profile selector must only offer Profiles belonging to that Property (`entity`). When authoring at Venue scope, the selector must only offer Profiles belonging strictly to that specific Venue (`venue === config.venue`) or shared from its parent Property (`entity === config.entity && (!venue || venue === "")`). A Venue-scoped Profile is visible and selectable only within that specific Venue and is never inherited by child Venues. Profiles belonging to other Properties or other Venues must be excluded from selection.

- **CFG-059:** Sensitive credentials across all Configuration Profile sections (including RADIUS shared secrets, local user passwords, and Wi-Fi pre-shared keys) must be protected using three explicit UI handling states:
  1. *Unchanged:* The input displays a masked placeholder (`••••••••`), and saving retains the existing secret without requiring re-entry.
  2. *Replaced:* The operator enters a new value using a masked input field (`type="password"` with visibility toggle), which replaces the old secret in the submission payload.
  3. *Cleared:* When an operator disables authentication or switches to an open mode (e.g. `Open` Wi-Fi or disabling accounting), the secret property is removed from the payload.
  Secrets must never be exposed in plaintext in read-only cards, browser logs, or URL query strings.

## 10.3 Configuration Profiles List
- **CFG-019:** The Configuration Profiles list must display:
  - Profile name
  - Description
  - Scope badge (Property or Venue)
  - Configuration section / type
  - Last modified
  - Actions (View, Edit, Duplicate, Delete)

  *Note: To optimize table rendering performance, avoid redundant fleet-wide configuration traversals, and maximize operator information density, the Profile list does not include a dedicated "Referenced By" column.*

- **CFG-020:** The Configuration Profiles list must support search by name/description and filtering by configuration section and scope.

- **CFG-021:** Available Profile actions must include:
  - Create
  - View
  - Edit
  - Duplicate
  - Delete (with dependency confirmation)

- **CFG-022:** Profile deletion must be dependency-safe, leveraging OWPROV's native `VariableBlock` deletion checks to disallow deletion while referencing Configurations remain in `variableBlock.configurations`.

## 10.4 Configurations List
- **CFG-023:** The Configurations list must display:
  - Configuration name
  - Description
  - Applicable Scope / Device context
  - Validation state
  - Referenced Profiles / Variables
  - Number of assignments
  - Latest deployment state
  - Last modified
  - Actions (View, Edit, Duplicate, Delete)

- **CFG-024:** The Configurations list must support search and filtering.

- **CFG-025:** Available Configuration actions must include:
  - Create
  - View
  - Edit
  - Duplicate
  - Delete

### Recursive Variable Block Extraction & Human-Readable Resolution (Read-Only Table Presentation)

In OWPROV configurations, Profile references may be embedded deeply inside nested JSON structures (e.g., inside interfaces, SSIDs, or radios) as `{"__variableBlock": ["<uuid>"]}`. In legacy or externally created configurations, the top-level `variables[]` array may be empty even when variable blocks are actively referenced in subsections.

To ensure accurate, robust presentation in the Configurations table without mutating configuration payloads:
1. **Recursive Deep Scanning (Read-Only):** The UI recursively traverses the entire `configuration` JSON tree of each record to locate all occurrences of the `"__variableBlock"` key, extracting all referenced UUIDs strictly for display and name resolution.
2. **Set Union & Deduplication:** Extracted UUIDs are merged with any UUIDs present in the configuration's top-level `variables` array, producing a complete, deduplicated set of referenced Profile UUIDs for table display.
3. **Batch Variable Resolution & Error Isolation:** The UI resolves variable UUIDs into human-readable Profile names via batch API queries (`GET /api/v1/variable?select=uuid1,uuid2`). If the batch query encounters transport or network errors, the UI isolates the failure and renders a neutral fallback pill `[Profile: <uuid>]` with tooltip *"Unable to load profile name (network/server error)"*. If individual profile references cannot be resolved, the UI maintains table stability without crashing or dropping the row.
4. **Interactive Pill Display:** Referenced Profiles are rendered as styled, interactive pills displaying the profile name. Hovering over a pill presents a tooltip with the profile's section prefix and full UUID.

- **CFG-054:** The Configurations list must display referenced profiles as interactive, styled pills with tooltips showing section prefix and UUID.
- **CFG-055:** The UI must implement recursive deep scanning of configuration JSON on read strictly to extract all nested `__variableBlock` references for table display and name resolution, without synthesizing or mutating configuration payloads on save.
- **CFG-056:** The UI must resolve referenced variable UUIDs into human-readable Profile names via batch API queries with automatic fallback handling.
- **CFG-060:** If batch variable name resolution encounters transport or network errors, the UI must isolate the failure and render a neutral fallback pill (`[Profile: <uuid>]` with tooltip *"Unable to load profile name (network/server error)"*), ensuring that healthy profiles are not mischaracterized as deleted and the Configurations table remains stable and interactive.

## 10.5 Configuration Creation and Editing

-   **CFG-026:** Users must be able to create and edit named Configurations.
-   **CFG-027:** Configurations must provide understandable groups of settings (Radios, Interfaces, SSIDs, Routing, Services).
-   **CFG-028:** When targeting Property or Venue scopes (OWPROV), a supported Configuration section must allow the user to either reference a compatible Configuration Profile or configure the section manually. When targeting Gateway Default configurations (OWGW), the UI must hide Profile referencing and provide direct manual field configuration.
-   **CFG-029:** Before saving a Configuration, the UI must validate required fields, supported data types and ranges, Profile references, and applicable cross-field constraints.
-   **CFG-030:** Saved Configurations must have identifiable names and modification information.

### Lossless Configuration Editing Contract

Configurations authored across heterogeneous tools or previous platform versions may contain custom sections, advanced parameters, or third-party device settings not managed by standard form builders:
1. **Preservation of Unedited & Unsupported Sections:** When loading a Configuration, all sections within `configuration[]` (including unrecognized, raw, or third-party sections) must be retained in memory.
2. **Targeted Section Updates:** When an operator edits specific sections in the UI, only the modified sections are updated. All untouched and unrecognized sections must be preserved verbatim in the submitted payload.
3. **Root Variables Delta Synchronization:** To ensure OWPROV maintains reverse dependency membership in `VariableBlock.configurations[]`, attaching a Configuration Profile in the UI adds its UUID to the root `variables[]` array, and detaching it removes the UUID (provided it is not referenced in any other section). Pre-existing or independent root variable dependencies not managed by the UI sections are preserved verbatim upon saving.
4. **Raw JSON Inspection & Safe Fallback:** Operators must be able to inspect raw configuration JSON, and the UI must warn operators before applying any destructive transformations.

- **CFG-061:** Configuration editing must adhere to a lossless contract: unrecognized sections, custom JSON directives, and unedited sections within `configuration[]` must be preserved intact upon saving.
- **CFG-063:** When authoring or editing a Configuration, the UI must synchronize attached Profile UUIDs into the root `variables[]` array and remove detached Profile UUIDs while strictly preserving pre-existing, independent root variable dependencies, ensuring that OWPROV dependency tracking and deletion guards remain intact.

### Configuration Deletion Dependency Guard

- **CFG-062:** Configuration deletion must be dependency-safe. If a Configuration is currently assigned to a Property, Venue, or Device (indicated by non-empty `inUse` or a backend `400 Bad Request` with error code `StillInUse`), the UI must block deletion and display an actionable dialog informing the operator that the Configuration must be unassigned before it can be deleted.

## 10.6 Assignment

-   **CFG-031:** Configuration assignment must support:
    -   Property (OWPROV scope)
    -   Venue (OWPROV scope, including recursive child Venues)
    -   Device (OWPROV Inventory / Device-specific configuration)
    -   Gateway Default (OWGW hardware-model baseline)
-   **CFG-032:** Users must only be able to assign Configuration within
    their authorized scope.
-   **CFG-033:** Before saving a Configuration assignment, the UI must show the target scope and the Devices affected by the assignment.
-   **CFG-034:** Assignment must represent the intended configuration
    relationship and must not imply that the live Device has already
    received the change.

### Assignment Lifecycle and Resolution Semantics

To ensure consistent implementation and deterministic testing:

1. **Precedence and Field Resolution:** When the same configuration setting is defined at multiple scopes, the resolution order is strictly hierarchical, where narrower, more specific scopes override broader parent scopes:
   `Runtime Overrides > Device-Specific Configuration > Child Venue > Parent Venue > Property > Gateway Default`.
2. **Assignment Cardinality & Conflict Handling:** Exactly one Configuration may be assigned to a specific scope per supported device type. Attempting to assign a new Configuration to a scope that already has an active assignment prompts the user with an explicit replacement confirmation.
3. **Assignment Replacement:** Replacing an assigned Configuration updates the scope's configuration reference immediately in OWPROV metadata. Live connected devices continue running their current runtime configuration until an authorized operator explicitly initiates a deployment action (`CFG-034`, `CFG-035`).
4. **Assignment Removal:** Removing an assigned Configuration deletes the assignment reference from OWPROV. The scope immediately falls back to inheriting configuration from its parent scope (a child Venue inherits from its parent Venue or Property; a Property falls back to the Gateway Default hardware baseline). Live devices continue running their current configuration until an explicit deployment action is executed.
5. **Invalid Profile Handling:** If a Configuration becomes invalid (e.g., because a referenced Configuration Profile was updated with incompatible settings or missing required fields), dynamic compilation via OWPROV `APConfig` fails validation. The UI flags the Configuration and affected Devices with a validation error (`CFG-004`, `CFG-029`), reflects this in the "Needs Attention" state, and blocks live deployment until the configuration issue is resolved.


## 10.7 Deployment

Configuration assignment and live deployment are separate concepts.

-   **CFG-035:** The UI must provide a separate action to apply or deploy a Configuration to its assigned Devices.

-   **CFG-036:** Before deployment, the UI must show the deployment target, affected Devices, and relevant impact information, including Devices that are currently offline.

-   **CFG-037:** Deployment results must show the per-Device deployment status and clearly identify Devices that did not complete successfully.

-   **CFG-038:** Phase 1 must support and distinguish the OWGW command states relevant to Configuration deployment:
    - **Active (Non-Terminal):** `Pending` (command queued; for offline devices, queued until gateway connection or command timeout), `Executing` (command in flight to device).
    - **Terminal Success:** `Executed`, `Completed`.
    - **Terminal Failure:** `Failed`, `Timed Out`, `Expired`.

-   **CFG-039:** Partial deployment results must summarize Devices by deployment outcome and identify unsuccessful or incomplete Devices.

-   **CFG-040:** The UI must allow retries exclusively for Devices in terminal failure states (`Failed`, `Timed Out`, `Expired`), blocking retries while a command is active (`Pending`, `Executing`) to ensure retry safety, without redeploying successfully completed Devices unless the user explicitly requests a full redeployment.

-   **CFG-041:** Duplicate deployment submissions for the same Configuration and target must be prevented by disabling deployment actions while an active deployment (`Pending`, `Executing`) is already in progress. Detailed JSON-RPC command payloads, wire schemas, and socket timeouts are defined in downstream Technical API Interface Specifications.

-   **CFG-042:** Deployment history must be available for the relevant Configuration or Device.

-   **CFG-043:** Deployment history is operational Configuration history and must remain separate from the future Phase 2 global audit log.

## 10.8 Effective Configuration

-   **CFG-044:** The UI must display the Effective Configuration for an
    individual Device.
-   **CFG-045:** The UI must show the source of inherited, Profile-provided, assignment-provided, and Device-specific values.
-   **CFG-046:** Inherited, Profile-provided, assignment-provided, and Device-specific values must be visually distinguishable without relying only on color.
-   **CFG-047:** Users must be able to compare proposed changes with the
    current Effective Configuration.
-   **CFG-048:** A structured human-readable view must be the primary
    experience. Raw configuration data may be available as an advanced
    view.

------------------------------------------------------------------------

# 11. Users & Access Requirements

Users & Access is divided into **Users** and **Policies**.

MDU does not define or implement its own authorization algorithm.

The platform/downstream services remain authoritative for authentication, authorization, policy evaluation, Management Role Assignments, and access scope.

## 11.1 Users

-   **USR-001:** Users must be accessible under **Users & Access**.
-   **USR-002:** The Users table must provide relevant user information such as:
    -   Name
    -   Email/login
    -   Status
    -   User Role
    -   Last login
    -   Assigned Policy information
-   **USR-003:** Authorized administrators must be able to view User details.
-   **USR-004:** User details must provide relevant profile information.
-   **USR-005:** User details must show the User Role where provided by the platform.
-   **USR-006:** User details must show the Management Role Assignments associated with the User.
-   **USR-007:** Each Management Role Assignment must show:
    -   User
    -   Entity/Property
    -   Venue(s)
    -   Policy
-   **USR-008:** User details must show the scope associated with applicable Policy assignments.
-   **USR-009:** Authorized administrators must be able to create and update Users through the authoritative backend.
-   **USR-010:** User creation/update UX must support the profile information, User Role, and Management Role Assignment information supported by the backend.
-   **USR-011:** Authorized administrators must be able to add, edit, or remove Management Role Assignments.
-   **USR-012:** User lifecycle actions such as suspend/reactivate must be provided.
-   **USR-013:** Authentication-specific operations must use the configured identity service.
-   **USR-014:** MDU must not use a User Role to independently determine authorization or implement role-based permission logic.
-   **USR-015:** User Role must be presented as an administrative classification and must not be presented as the source of operational resource permissions.

-   **USR-016:** Operational authorization must be represented through Management Role Assignments containing Assignment Scope and Policy.
-   **USR-017:** MDU must call the authoritative backend APIs for User, Management Role Assignment, scope, and Policy operations.

## 11.1.1 Management Role Assignments

A Management Role Assignment is the scope-specific object used to connect a User, scope, and Policy.

-   **MRA-001:** The UI must represent Management Role Assignments separately from the User Role classification.
-   **MRA-002:** A Management Role Assignment must represent the applicable User, Entity/Property, Venue(s), and Policy.
-   **MRA-003:** The UI must show the Policy attached to each Management Role Assignment.
-   **MRA-004:** The UI must show the Entity/Property and Venue scope attached to each Management Role Assignment.
-   **MRA-005:** MDU must not independently calculate whether a Management Role Assignment grants an action.
-   **MRA-006:** Creation, update, validation, duplicate-scope handling, and authorization of Management Role Assignments are handled by the authoritative backend service.

## 11.2 Policy List

-   **POL-001:** Users & Access must provide a Policy management view.
-   **POL-002:** The Policy list must show available Policies.
-   **POL-003:** Only Root-authorized users will create, edit, or delete custom Policies. Other authorized users may view and assign existing Policies but must not modify Policy definitions.
-   **POL-004:** The Policy list should provide relevant information
    such as:
    -   Policy name
    -   Description
    -   Number of Users
    -   Number of assignments/scopes
-   **POL-005:** Selecting a Policy must open its Policy overview.

## 11.3 Policy Overview

-   **POL-006:** The Policy overview must show the Policy name and
    description.
-   **POL-007:** The overview must show Users associated with the
    Policy.
-   **POL-008:** The overview must show the scope associated with Policy
    assignments.
-   **POL-009:** The overview must provide access to the Policy's
    permissions.

## 11.4 Policy Permissions

-   **POL-010:** The UI must provide a clear view of the permissions
    associated with a Policy.
-   **POL-011:** Policy permissions must be presented using the resource/action model defined by the authoritative Policy service.
-   **POL-012:** The Policy editor must expose the Phase 1 resources and actions defined by the authoritative Policy model.
-   **POL-013:** Permission information must represent the Policy as
    provided by the downstream authorization service.
-   **POL-014:** MDU must not redefine the underlying authorization or
    permission-evaluation model.

## 11.5 Policy Creation and Editing

-   **POL-015:** Only Root-authorized users may create, edit, or delete custom Policies.
-   **POL-016:** Other authorized users may view and assign existing Policies within their permitted Assignment Scope but must not modify Policy definitions.
-   **POL-017:** Policy creation must provide:
    -   Name
    -   Description
    -   Permissions
-   **POL-018:** The Policy editor must provide a clear way to select
    supported resource permissions.
-   **POL-019:** The UI must validate required Policy information before
    saving.
-   **POL-020:** Editing a Policy must clearly indicate that existing
    Users or assignments may be affected.
-   **POL-021:** Built-in Policies must be protected from unsupported
    modification or deletion.
-   **POL-022:** A Policy that is still assigned to Users or scopes must
    not be deleted without an appropriate dependency workflow.

## 11.6 Management Role Assignment and Assignment Scope

-   **POL-023:** A Policy must be associated with a User through a Management Role Assignment.
-   **POL-024:** The UI must show which Users are using a Policy.
-   **POL-025:** The UI must show where each Management Role Assignment applies.
-   **POL-026:** Policy and scope information must be retrieved from and
    remain consistent with the authoritative downstream service.
-   **POL-027:** MDU must not independently redefine Policy precedence
    or authorization behavior.

------------------------------------------------------------------------

# 12. Operator Administration Requirements

Operator administration is a separate administrative workflow from normal Property operations.

An Operator is not a loginable User. It is a business/provisioning object used to bind subscribers. Creating an Operator automatically creates the corresponding Operator Entity.

Users may be associated with the Operator Entity through the existing Management Role Assignment mechanism. Authorization is evaluated against the applicable Entity/Property and Venue scope. The Operator object itself is not an independent operational access scope.

All Operator lifecycle, Entity relationship, subscriber relationship, scope, and authorization behavior is handled by the backend service.
-   **OPR-001:** An automatically created Operator Entity must appear as an MDU Property whenever that Entity is present in the caller's authorized Entity projection. No additional operational-Property classification is required.
-   **OPR-002:** The Operators module must only be available to users authorized to manage Operators.
-   **OPR-003:** The Operator business object must not be emitted as a second Property or substituted for its corresponding Entity. Property selectors, breadcrumbs, tables, counts, and navigation must use the authorized Entity node and Entity identifier exactly once.
-   **OPR-004:** The Operators table must provide relevant Operator information such as:
    -   Name
    -   Description
    -   Registration information
    -   Status
    -   Modified information
- **OPR-005:** Users authorized for Operator administration must be able to create and edit Operators through the authoritative backend.

- **OPR-006:** Firmware, Subscribers, and Service Classes workflows are not part of Phase 1.

- **OPR-007:** Operator details may show its corresponding Entity Property and related Devices when those relationships are returned by the authoritative backend.

- **OPR-008:** Operator deletion must require confirmation. The backend service is responsible for dependency validation and cleanup.

- **OPR-009:** MDU must use the authoritative backend APIs for Operator operations and must not duplicate Operator-to-Entity or subscriber relationships.

# 13. Non-functional Requirements

## 13.1 Performance

-   **NFR-001:** Primary pages should provide usable content within the
    agreed performance target under normal operating conditions.
-   **NFR-002:** Search and filtering should provide results within the
    agreed performance target.
-   **NFR-003:** Long-running commands and deployments must not block
    the browser session.
-   **NFR-004:** Fleet-scale tables must support appropriate pagination
    or virtualization.

Specific measurable performance targets will be defined in the technical specification and agreed test plan.

## 13.2 Security

-   **NFR-005:** Authorization must be enforced by backend services; UI
    visibility is not a security boundary.
-   **NFR-006:** Sensitive configuration values and credentials must be
    protected and masked by default.
-   **NFR-007:** Secrets must not be exposed through URLs, browser logs,
    analytics, or user-facing errors.
-   **NFR-008:** Authentication and identity operations must use the
    configured identity service.

## 13.3 Reliability and Data Quality

-   **NFR-009:** Operational information must provide an indication of
    freshness where appropriate.
-   **NFR-010:** Stale, partial, and unavailable information must be
    distinguishable from healthy or zero values.
-   **NFR-011:** The UI must accurately represent the result of
    operations even when a Device becomes unavailable during the
    operation.
-   **NFR-012:** Configuration preview and applied configuration must
    use consistent configuration semantics.

## 13.4 Accessibility

-   **NFR-013:** The application should follow the agreed accessibility
    standard for keyboard navigation, labels, focus, contrast, and
    non-color status indicators.
-   **NFR-014:** Charts and visual status information must have an
    accessible alternative.

------------------------------------------------------------------------

# 14. Dependencies

The MDU UI consumes capabilities from the underlying Mango Cloud
services.

  Capability                                Downstream Service
  ----------------------------------------- ---------------------------------------
  Authentication / identity                 OWSEC
  Properties / Venues                       OWPROV (Entities, recursive child Venues)
  Inventory / Device ownership              OWPROV
  Users                                     OWPROV / configured identity services
  Policies / access information             OWPROV
  Device operations                         OWGW
  Device telemetry                          Operational/analytics services
  Configuration Profiles (VariableBlocks)   OWPROV
  Configuration                             OWPROV + OWGW

The UI consumes authenticated capability results through its API adapters. Authorization, aggregation, consistency, caching, persistence, service-to-service communication, and downstream implementation are defined and tested in the responsible backend projects, not in this UI requirements document.

------------------------------------------------------------------------

# 15. Phase 1 Acceptance Criteria

Phase 1 is ready for product acceptance when:

1. An authorized user can navigate Dashboard → Property → Venue → Device using Mango Cloud terminology.
2. Dashboard, Property, Venue, and Device health and availability information is consistent for the same underlying data.
3. An authorized user can search for and inspect Devices through the defined Device views.
4. Users only see resources and actions available to them through the platform authorization model, with workflows adapting dynamically based on Policy permissions rather than hard-coded persona or role classifications.
5. An authorized user can create a Configuration Profile (mapped to an OWPROV VariableBlock) and use it within a Configuration targeted at Property or Venue scopes, with the UI selectively hiding Profile options when authoring Gateway Default configurations.

6. Profile-provided values are dynamically resolved from the underlying VariableBlock via OWPROV APConfig, are displayed as read-only within the Configuration, and cannot be individually overridden.

7. A Configuration retains a live reference to a selected Configuration Profile via OWPROV `{"__variableBlock": ["<uuid>"]}` in the section and in `variables[]`.

8. Updating a Configuration Profile dynamically updates the resolved Profile values compiled by APConfig for every referencing Configuration.

9. Before a Profile change is saved, the UI displays the affected Configurations and the deduplicated set of affected Devices resolved across Property, Venue, and Device assignments.

10. Saving a Profile change updates the VariableBlock but does not automatically deploy or push live configuration changes to Devices.

11. An in-use Profile cannot be deleted while unresolved Configuration references remain in its `configurations` list.

12. An authorized user can assign a Configuration to a Property, Venue, Device, or Gateway Default scope.

13. Configuration assignment and live deployment are represented as separate actions.

14. A Device page shows its Effective (Computed) Configuration, provenance explanation, and supports device-specific runtime parameter overrides (such as radio channel and TX power).

15. Per-Device Configuration deployment results clearly display the relevant OWGW command state: Pending, Executing, Executed, Completed, Failed, Timed Out, or Expired.

16. Authorized administrators can view Users, User Roles, Management Role Assignments, and assigned Policies.

17. Authorized administrators can view the scope associated with Management Role Assignments.

18. Authorized administrators can view Policy details, Users associated with a Policy, Assignment Scope, and Policy permissions.

19. A Root-authorized user can create and manage custom Policies. Other authorized administrators can view and assign existing Policies within their permitted Assignment Scope.

20. Authorized administrators can manage Operators where permitted.

21. An authorized user can initiate Device deletion through an explicit confirmation, and the UI displays the final backend operation result.

22. Audit Logs, Firmware, Clients, Subscribers, MPSK/PPSK, Billing, and Service Classes are absent from Phase 1 navigation and workflows.

23. Before Phase 1 acceptance, loading, empty, error, stale-data, partial-success, and permission-denied states must be implemented for primary workflows.

24. A user authorized only for one or more Venues can open those Venues and their authorized Devices without seeing unauthorized parent Property names, identifiers, metrics, breadcrumbs, or hierarchy information.

25. Deployment history is available for the relevant Configuration or Device and is clearly separated from the future Phase 2 global audit log.

26. Profile-provided values are identified with their Profile source, such as `From Profile: <Profile Name>`, and provide View, Replace, and Remove Profile actions.

27. An authorized user can navigate into nested child Venues, view associated devices, and assign Configurations at any Venue scope without requiring resident Subscriber records.

28. An authorized user can create and update a Property with its required name and parent scope, and the UI displays deletion dependency errors without reporting false success.

29. An authorized user can create and update a Venue with its required name and scope binding, and the UI displays deletion dependency errors without reporting false success.

30. An authorized user can onboard a Device by entering a valid Serial Number (with automatic delimiter normalization), specify name, device type, and scope binding via OWPROV inventory, and reassign or decommission the device.

31. Dashboard, Property, Venue, and Device views consistently display the supplied health, availability, and primary reason without independently recalculating them from a single signal.

32. The Property/Venue hierarchy renders independently from operational summaries so navigation remains usable when status information is loading or unavailable.

33. The Property UI distinguishes loading, stale, partial, unavailable, Unknown, and authoritative empty states and provides Retry where appropriate.

34. Contact and Location forms display only records returned for the selected scope, preserve input on failure, and support the Venue Location selector and Create Location workflow.

35. A Venue returned without visible ancestors is presented as a root and the UI does not fabricate parent identifiers, names, metrics, or breadcrumbs.

# 16. Open Product Decisions

The following items require explicit product or architecture approval before implementation freeze:

1. Final calibration and policy-driven tuning of Property, Venue, and Device health formulas and numerical thresholds (baseline semantics established in Section 7.3.1).

2. Phase 1 Device Capability Matrix, including supported Device types and capability-dependent UI actions and data fields.

3. Configuration rollback behavior after failed or partial deployment (e.g., automatic revert to previous active configuration vs operator-initiated redeployment).

4. Identity-provider behavior for invitation, password setup, MFA, and email validation.

5. Numerical performance targets for initial page usability, search and filter response, pagination, Dashboard refresh, and long-running operation feedback.

6. Supported browser versions, minimum desktop viewport, and tablet-layout requirements for Installer workflows.

Device deletion behavior, Operator-to-Entity behavior, authorization calculation, and underlying cleanup are backend responsibilities and are not Phase 1 MDU UI decisions.

# 17. Phase 2 Extension Points

Phase 1 should preserve navigation and data-model extension points for:

-   Clients and client troubleshooting
-   Subscribers (resident tenant identity and self-service portal)
-   Resident tenant onboarding and resident-to-Venue binding
-   SSID/MPSK/PPSK access and resident personal network credentials
-   Subscriber Devices
-   Firmware catalog and rollout
-   Global audit trail and change history
-   Persistent issues and issue management
-   Billing
-   Service classes

These capabilities must not introduce empty or inactive Phase 1 pages or
navigation items.

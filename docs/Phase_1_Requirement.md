# Mango Cloud MDU UI --- Phase 1 Requirements

**Document status:** Ready for Product and Architecture Approval
**Version:** 1.2
**Date:** 5 September 2026

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
| **Property** | A top-level MDU site or managed customer location. Backend terminology may represent this as an Entity. |
| **Venue** | A physical or organizational division within a Property, such as a building, floor, common area, suite, or room. In OWPROV, venues form a recursive hierarchy (`parent` and `children[]`). Individual dwelling spaces or suites are simply leaf Venues in this hierarchy. |
| **Device** | A managed AP, switch, gateway, or other supported network device. Uniquely identified by its 12-character hexadecimal **Serial Number** (`serialNumber`). |
| **Configuration Profile** | A reusable section-level Configuration component representing the product-facing UI model of an OWPROV **`VariableBlock`**. When referenced by a Configuration section (`{"__variableBlock": "<uuid>"}`), the Configuration retains a live reference in `variables[]`. Profile-provided values are resolved dynamically on-demand and are read-only within that Configuration section. |
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

The UI must use **Property** instead of **Entity** for normal user-facing experiences.

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

## 8.1 Property Selection and Hierarchy

-   **PROP-001:** The Properties module must show only Properties and
    Venues available to the current user.
-   **PROP-002:** The current scope must be clearly visible.
-   **PROP-003:** Users must be able to move between available
    Properties.
-   **PROP-004:** The hierarchy must support access beginning at a Venue
    where applicable.

## 8.2 Property Overview

* **PROP-005:** The Property header must show the Property name, health state, breadcrumb, and scope selector where applicable.

* **PROP-006:** The Property summary must show:

  * Total Devices
  * Online Devices
  * Offline Devices
  * Devices Needing Attention
  * Total Venues
  * Impacted Venues

* **PROP-007:** The Property page must provide Property health and Device availability information.

* **PROP-008:** The Property page must provide a Venues section displaying the Venues belonging to the Property in a table or equivalent list. The Venue view must provide:

  * Venue name
  * Health
  * Total Devices
  * Online Devices
  * Offline Devices
  * Last update

* **PROP-009:** Selecting a Venue from the Property page must open the Venue overview.

* **PROP-010:** The Property view must provide access to Devices requiring attention.

* **PROP-011:** The Venues section must allow users to identify the health and device availability of each Venue and navigate to the selected Venue.

* **PROP-012:** The Property page must clearly represent the relationship between the Property and its Venues, with the Property acting as the parent scope and Venues as child scopes.


## 8.3 Venue Overview

-   **VEN-001:** The Venue header must identify the Venue and show only the authorized hierarchy context. The parent Property must be shown only when the user is authorized to view that Property.
-   **VEN-002:** The Venue summary must show:
    -   Total Devices
    -   Online Devices
    -   Offline Devices
    -   Devices Needing Attention
-   **VEN-003:** The page must provide Device status and available
    health information.
-   **VEN-004:** The page must show Devices requiring attention.
-   **VEN-005:** The page must show all Devices within the Venue with
    appropriate search and filtering.
-   **VEN-006:** Selecting a Device must open the individual Device
    page.

## 8.4 Hierarchical and Nested Venues

Physical spaces within a Property are organized hierarchically using **Venues**. OWPROV models structural hierarchy recursively using `Venue` records, where a Venue contains a `parent` UUID and a `children[]` array:

```text
Property (Entity)
   └── Campus / Building (Venue)
         └── Floor / Wing / Suite (Child Venue)
               └── Device(s)
```

1. **Uniform Hierarchy Model:** All physical spaces and sub-divisions (such as campus buildings, floors, common areas, suites, or individual rooms) are modeled uniformly as Venues in Phase 1. The platform data model and user interface treat all nested spaces as Venues without requiring a separate or specialized entity type.
2. **Device Association:** Managed Devices (APs, switches) installed within any physical space are associated directly with that space's Venue record via OWPROV's `devices[]` list.
3. **Configuration Assignment:** Configurations can be assigned directly to any Venue in the hierarchy or inherited from parent Venue or Property scopes.
4. **Phase 2 Boundary (Subscribers & Resident Portal):** While all physical spaces and their network hardware are fully manageable in Phase 1 via Venues, resident tenant accounts (`subscriber`), resident self-service onboarding, personal SSIDs, and MPSK/PPSK credentials remain strictly Phase 2 capabilities.

### Requirements

-   **VEN-007:** The Property and Venue hierarchy must support recursive child Venues representing physical sub-divisions (e.g., buildings, floors, suites, rooms).
-   **VEN-008:** All physical spaces within a Property must be modeled directly as OWPROV Venues without requiring a separate "Unit" data entity.
-   **VEN-009:** Authorized operators must be able to navigate the Venue hierarchy, inspect devices located in nested child Venues, and assign Configurations at any Venue scope.
-   **VEN-010:** Venue-level operations in Phase 1 must function independently of resident Subscriber records and PPSK credentials.

## 8.5 Property Lifecycle Management

Properties (represented in the backend as Entities) are the top-level managed customer locations. In Phase 1, authorized administrators can create, update, and delete Properties directly through the MDU interface, with lifecycle operations executed authoritatively by OWPROV.

### Supported Fields
* `name` (string, required): Friendly display name for the Property.
* `parent` (UUID, required for non-root): Identifier of the parent Operator Entity or platform Root Entity under which the Property is created.
* `description` (string, optional): Explanatory text describing the Property.

### Lifecycle & Dependency Rules
* Child collections (`venues`, `devices`, `contacts`, `configurations`) are initialized empty upon creation and populated as child resources are created or linked.
* Deletion of a Property is dependency-safe: OWPROV disallows deletion while active child Venues or Devices remain associated with the Property.

### Requirements

-   **PROP-013:** Authorized administrators must be able to create a new Property by providing `name`, `parent`, and optional `description`.
-   **PROP-014:** Authorized administrators must be able to update Property metadata (`name`, `description`).
-   **PROP-015:** Property deletion must require explicit confirmation and enforce backend dependency validation, disallowing deletion while child Venues or Devices remain.
-   **PROP-016:** MDU must delegate Property lifecycle management to the authoritative OWPROV service and must not maintain an independent Property data store.

## 8.6 Venue Lifecycle Management

Venues (including campus buildings, floors, common areas, and individual suites or rooms) can be created, updated, and deleted through the MDU interface, with OWPROV managing the recursive hierarchy tree.

### Supported Fields
* `name` (string, required): Display name of the Venue. Must be unique within the same parent scope.
* **Scope Binding** (mutually exclusive):
  * `entity` (UUID): Property identifier, specified when creating a top-level Venue directly under a Property.
  * `parent` (UUID): Parent Venue identifier, specified when creating a child Venue (e.g., Building → Floor → Suite). The parent Property association is automatically inherited from the parent Venue.
* `description` (string, optional): Explanatory text describing the Venue.
* `configurations` (UUID[], optional): Array of Configuration identifiers assigned at this Venue scope.

### Lifecycle & Dependency Rules
* Deletion of a Venue is dependency-safe: OWPROV disallows deletion while active child Venues or assigned Devices remain.

### Requirements

-   **VEN-011:** Authorized users must be able to create a top-level Venue under an authorized Property by specifying `name`, `entity`, and optional `description`.
-   **VEN-012:** Authorized users must be able to create a child Venue under an existing parent Venue by specifying `name`, `parent`, and optional `description`.
-   **VEN-013:** Authorized users must be able to update Venue metadata (`name`, `description`).
-   **VEN-014:** Venue deletion must require explicit confirmation and enforce backend dependency validation, disallowing deletion while child Venues or assigned Devices remain.
-   **VEN-015:** MDU must delegate Venue lifecycle management to the authoritative OWPROV service.

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
Configuration Profiles in the MDU UI are explicitly defined as the product-facing representation of OWPROV **`VariableBlock`** objects. The MDU UI does not introduce or require a separate independent Profile data store; it maps directly to OWPROV VariableBlock services.

Configuration Profiles apply specifically to OWPROV configuration scopes (Properties, Venues, and OWPROV-managed device configurations). Because OWGW does not store VariableBlocks or execute dynamic variable compilation (`APConfig`), Configuration Profiles are not used when authoring flat Gateway Default configurations or direct OWGW device table configurations.

In Configuration JSON, referencing a Configuration Profile inserts an OWPROV `{"__variableBlock": "<uuid>"}` reference into the corresponding configuration section, and the Configuration retains a reference in its `variables[]` array. OWPROV tracks referencing Configurations directly in `variableBlock.configurations` (and `inUse`), enabling native dependency-safe lifecycle enforcement.

A supported Configuration section may reference one Configuration Profile at a time.

When a Configuration Profile is selected for a Configuration section, the Configuration retains a live reference to that Profile. Profile-provided values are resolved from the current Profile (VariableBlock) definition and are read-only within the Configuration.

Profile-provided values cannot be individually overridden within the Configuration.

When a Profile is selected, the user may:

- View Profile
- Replace Profile
- Remove Profile and configure manually

Removing the Profile reference allows that Configuration section to be configured manually.

Complete Configuration Templates are not included in Phase 1. Configuration Profiles are reusable section-level components and must not be presented as complete Configurations.

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
  - Applicable Device context
  - Configuration section
  - Supported reusable values

- **CFG-008:** A supported Configuration section may reference only one Configuration Profile at a time.

- **CFG-009:** When a Configuration Profile is selected for a Configuration section, the Configuration must retain a live reference to that Profile via OWPROV `{"__variableBlock": "<uuid>"}` and `variables[]`.

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

## 10.3 Configuration Profiles List
- **CFG-019:** The Configuration Profiles list must display:
  - Profile name
  - Description
  - Device context
  - Configuration section
  - Validation state
  - Number of referencing Configurations
  - Last modified

- **CFG-020:** The Configuration Profiles list must support search and filtering.

- **CFG-021:** Available Profile actions must include:
  - Create
  - View
  - Edit
  - Duplicate

- **CFG-022:** Profile deletion must be dependency-safe, leveraging OWPROV's native `VariableBlock` deletion checks to disallow deletion while referencing Configurations remain in `variableBlock.configurations`.

## 10.4 Configurations List
- **CFG-023:** The Configurations list must display:
  - Configuration name
  - Description
  - Applicable Device context
  - Validation state
  - Profiles used
  - Number of assignments
  - Latest deployment state
  - Last modified

- **CFG-024:** The Configurations list must support search and filtering.

- **CFG-025:** Available Configuration actions must include:
  - Create
  - View
  - Edit
  - Duplicate

## 10.5 Configuration Creation and Editing

-   **CFG-026:** Users must be able to create and edit named
    Configurations.
-   **CFG-027:** Configurations must provide understandable groups of
    settings.
-   **CFG-028:** When targeting Property or Venue scopes (OWPROV), a supported Configuration section must allow the user to either reference a compatible Configuration Profile or configure the section manually. When targeting Gateway Default configurations (OWGW), the UI must hide Profile referencing and provide direct manual field configuration.
-   **CFG-029:** Before saving a Configuration, the UI must validate required fields, supported data types and ranges, Profile references, and applicable cross-field constraints.
-   **CFG-030:** Saved Configurations must have identifiable names and
    modification information.

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
-   **OPR-001:** The automatically created Operator Entity is an internal root scope and must not appear as an MDU Property unless the authoritative backend explicitly classifies it as an operational Property.
-   **OPR-002:** The Operators module must only be available to users authorized to manage Operators.
-   **OPR-003:** Internal Operator Entity identifiers must not appear in:
      - Property selectors
      - Property breadcrumbs
      - Dashboard Property tables
      - Property counts
      - Normal Property/Venue navigation
-   **OPR-004:** The Operators table must provide relevant Operator information such as:
    -   Name
    -   Description
    -   Registration information
    -   Status
    -   Modified information
- **OPR-005:** Users authorized for Operator administration must be able to create and edit Operators through the authoritative backend.

- **OPR-006:** Firmware, Subscribers, and Service Classes workflows are not part of Phase 1.

- **OPR-007:** Operator details must show associated operational Properties and Devices only when those relationships are returned by the authoritative backend.

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

MDU should consume these capabilities without duplicating their
underlying data models or authorization logic. Specifically, Configuration Profiles map directly to OWPROV `VariableBlock` services and leverage native dependency tracking (`variableBlock.configurations`) and dynamic compilation (`APConfig`) rather than an independent MDU data store.

The core backend integration behaviors specified in this document—including `VariableBlock` reference semantics (`{"__variableBlock": "<uuid>"}` in sections and `variables[]`), reverse configuration dependency tracking (`variableBlock.configurations`), on-demand compilation via `APConfig`, and dependency-safe deletion checks—are validated against authoritative OWPROV backend services and data structures. While low-level implementation specifications and open product policies will be finalized in dedicated technical documents, these requirements reflect established and confirmed platform capabilities rather than provisional assumptions.

------------------------------------------------------------------------

# 15. Phase 1 Acceptance Criteria

Phase 1 is ready for product acceptance when:

1. An authorized user can navigate Dashboard → Property → Venue → Device using Mango Cloud terminology.
2. Dashboard, Property, Venue, and Device health and availability information is consistent for the same underlying data.
3. An authorized user can search for and inspect Devices through the defined Device views.
4. Users only see resources and actions available to them through the platform authorization model, with workflows adapting dynamically based on Policy permissions rather than hard-coded persona or role classifications.
5. An authorized user can create a Configuration Profile (mapped to an OWPROV VariableBlock) and use it within a Configuration targeted at Property or Venue scopes, with the UI selectively hiding Profile options when authoring Gateway Default configurations.

6. Profile-provided values are dynamically resolved from the underlying VariableBlock via OWPROV APConfig, are displayed as read-only within the Configuration, and cannot be individually overridden.

7. A Configuration retains a live reference to a selected Configuration Profile via OWPROV `{"__variableBlock": "<uuid>"}` in the section and in `variables[]`.

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

23. Loading, empty, error, stale-data, partial-success, and permission-denied states are implemented for primary workflows.

24. A user authorized only for one or more Venues can open those Venues and their authorized Devices without seeing unauthorized parent Property names, identifiers, metrics, breadcrumbs, or hierarchy information.

25. Deployment history is available for the relevant Configuration or Device and is clearly separated from the future Phase 2 global audit log.

26. Profile-provided values are identified with their Profile source, such as `From Profile: <Profile Name>`, and provide View, Replace, and Remove Profile actions.

27. An authorized user can navigate into nested child Venues, view associated devices, and assign Configurations at any Venue scope without requiring resident Subscriber records.

28. An authorized user can create and update a Property with its required name and parent scope via OWPROV, and deleting a Property enforces dependency validation.

29. An authorized user can create and update a Venue with its required name and scope binding via OWPROV, and deletion enforces dependency validation.

30. An authorized user can onboard a Device by entering a valid Serial Number (with automatic delimiter normalization), specify name, device type, and scope binding via OWPROV inventory, and reassign or decommission the device.

31. Dashboard, Property, Venue, and Device views consume and display normalized Device health and server-side scope rollups based on the baseline indicators defined in Section 7.3.1, displaying the primary trigger condition when inspected.

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
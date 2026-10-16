# Phase 1 Technical Specification: Core Platform Modules

---

## Document Metadata

| Attribute | Value |
| :--- | :--- |
| **Document Version** | 1.1.0 |
| **Modules** | Administration (Users & Access), Configuration (Configuration Profiles & Modular Configurations) |
| **Target Codebase** | `mango-operator-ui` (React / TypeScript / TanStack Query / Vite) |
| **Reference Implementation** | `ra-wlan-cloud-owprov-ui` (`src/hooks/Network/Users.ts`, `src/hooks/Network/ManagementRoles.ts`, `src/hooks/Network/VariableBlocks.ts`, `src/hooks/Network/Configurations.ts`) |
| **Downstream Microservices** | `OWSEC` (Port 9002), `OWPROV` (Port 9005 / V1 & V2), `OWGW` (Port 9000) |
| **Target Audience** | Frontend Engineers, QA Automation Engineers, Backend Integration Engineers |
| **Status** | Authoritative Normative Specification |

---

## Specification Strategy & Phasing Note

> [!IMPORTANT]
> **Tab-Wise Implementation Strategy:**  
> The Phase 1 delivery for `mango-operator-ui` is executed and specified **tab-by-tab**. Each functional tab is specified to industry standards with complete API contracts, component architecture, state machines, validation schemas, and test scenarios. Once the specification for a tab is approved, engineering implements and validates that specific tab end-to-end before proceeding to subsequent modules.
>
> In Phase 1, the core modules specified in this document include:
> 1. **Users Tab (Administration):** Identity management, authentication lifecycles, user directory with search/filters/pagination, real-time KPI metrics, detailed profile editing, scoped access infrastructure management (MRAs), and user onboarding.
> 2. **Policies Tab (Administration):** Management policy catalog, headline policy KPIs, resource permissions visualizer, overview aggregation API, and root-only policy lifecycle administration.
> 3. **Configuration Profiles Tab (Configuration):** Section-level reusable configuration building blocks mapping directly to OWPROV `VariableBlock` resources, with specialized form builders, validation rules, and JSON wire serializers across eight (8) foundational profile sections (`radio`, `interface.ssid`, `interface.ipv4`, `interface.ssid.radius`, `interface.vlan`, `interface.tunnel`, `interface.captive`, `interface.ssid.openroaming`).
> 4. **Configurations Tab (Configuration):** Modular multi-section configuration authoring, deep recursive variable block scanning (`__variableBlock`) for read-time name resolution (`?select=`), lossless configuration editing with root `variables[]` preservation, and lifecycle management.
>
> **Scope of this Document:**  
> This specification covers the core modules of Phase 1: **Part 1** details the Users Tab and its associated workflows; **Part 2** details the Policies Tab, its resource permissions configuration, and aggregation integrations; **Part 3** details the Configuration Profiles Tab and supported section schemas; **Part 4** details the Modular Configurations Tab, read-only variable extraction algorithms, lossless editing guarantees, and deployment lifecycle. This document provides the authoritative normative contract for **data structures, API interactions, business logic, component behavior, validation rules, state management, and error handling**.

---

# Part 1: Users Tab Specification

---

## 1. Domain Model & Conceptual Architecture

The Users & Access module manages platform authentication, coarse role assignment, and physical infrastructure authorization by interfacing directly with two upstream OpenWifi microservices:

```
+---------------------------------------------------------------------------------------------------+
|                                        Browser Client                                             |
|                                     (mango-operator-ui)                                           |
+---------------------------------------------------------------------------------------------------+
                               |                                           |
             Direct REST (JWT Bearer)                     Direct REST (JWT Bearer)
             axiosSec (/api/v1)                           axiosProv (/api/v1) & axiosProvV2 (/api/v2)
                               |                                           |
                               v                                           v
             +----------------------------------+        +-----------------------------------+
             |              OWSEC               |        |              OWPROV               |
             |   (Identity & Authentication)    |        | (Hierarchy & Infrastructure RBAC) |
             +----------------------------------+        +-----------------------------------+
             | • User records (id, name, email) |        | • Management Roles (MRAs)         |
             | • System role (userRole)         |        | • Management Policies             |
             | • Credentials & MFA status       |        | • Entities (Properties)           |
             | • Account status (suspended)     |        | • Venues                          |
             | • Avatars & Internal Notes       |        |                                   |
             +----------------------------------+        +-----------------------------------+
```

### 1.1 Separation of Concerns: System Role vs. Management Role

A fundamental architectural principle of OpenWifi is the strict decoupling of **Platform Identity** (`OWSEC`) from **Scoped Infrastructure Authorization** (`OWPROV`):

```
+----------------------------------------------------+       +-------------------------------------------------------+
|              System Role (OWSEC userRole)          |       |              Scoped Access (OWPROV MRA)               |
|      "Determines platform-wide capabilities"       | ----> | "Determines which properties/venues they apply to"    |
+----------------------------------------------------+       +-------------------------------------------------------+
```

1. **System Role (`userRole` stored in `OWSEC`):**
   - Assigned at user creation in `OWSEC`.
   - Coarse platform classification governing service-level API accessibility.
   - Authoritative values are strictly: `'root' | 'admin' | 'csr' | 'noc' | 'installer'`.

2. **Management Role Assignment (MRA stored in `OWPROV`):**
   - Scoped operational bindings created and stored in `OWPROV`.
   - Each MRA binds a single user to an operational **Management Policy** over a defined physical boundary:
   
     MRA=⟨User ID,Property (Entity ID),Venue ID (Optional),Management Policy ID⟩
   - A user can have zero, one, or multiple MRAs across different properties and venues.
   - Management roles have arbitrary, descriptive names and live entirely in `OWPROV`.

### 1.2 Token-Driven Backend Authorization & UI Tab Decoupling

A core architectural principle of the Operator UI is that **UI modules and navigation tabs are not bound or locked by client-side `userRole` checks**:
- **Unrestricted Tab Navigation:** Any authenticated operator can navigate to any tab (e.g. **Users**, **Policies**) and trigger data queries. The frontend does not hardcode client-side route guards or hide primary navigation tabs based on the session's `userRole`.
- **Backend-Authoritative Access Control:** `OWSEC` and `OWPROV` authoritatively inspect the caller's JWT Bearer token and determine access on every request:
  - **`GET /api/v1/users` (`OWSEC`):**
    - **`root`:** Returns **all** platform users across the entire system.
    - **`admin`:** Returns users created by that specific admin (`createdBy == currentAdminId`).
    - **Non-admin roles (`noc`, `installer`, `csr`, etc.):** `OWSEC` authoritatively rejects the request with `403 Forbidden` (`ACCESS_DENIED`) as source-verified in `RESTAPI_users_handler.cpp` and `RESTAPI_Handler.h` line 395.
  - **`GET /api/v1/managementPolicy` (`OWPROV`):**
    - Policy definitions are inspectable by authenticated operators.
- **UI Presentation Philosophy (Distinct Data-Driven States):**
  The UI strictly decouples response states into distinct visual presentations, ensuring that true empty datasets and active filter states are never confused with access restrictions or system errors:
  1. **Loading State (`isLoading`):** Renders animated skeleton shimmers across KPI summary cards and table rows without shifting the layout or unmounting controls.
  2. **Populated Dataset (`200 OK` + `manageableUsers.length > 0`):** Renders populated KPI metric cards, active directory table rows, search/filter controls, and loads the selected user into the detail panel.
  3. **Empty Dataset (`200 OK` + `manageableUsers.length === 0`):**
     - Occurs when the database contains no manageable operators (e.g. newly provisioned `admin` accounts who have not yet created any operators).
     - **This is NOT an error or access restriction.** The operator holds full administrative privileges.
     - Headline KPI metric cards display `0` (Total: `0`, Active: `0`, Suspended: `0`, MFA: `0 of 0`).
     - Directory table renders an informative **Empty State** view (*"No users found. Click '+ Create user' to onboard your first operator."*).
     - The top-level `+ Create user` button remains active and visible. The split detail panel displays an idle prompt (*"No operator selected"*).
  4. **Filter Empty State (`manageableUsers.length > 0` && `filteredUsers.length === 0`):**
     - Occurs when an active search query or status/role filter matches zero operators within an existing dataset.
     - **KPI Summary Cards are strictly preserved:** Headline KPI cards remain unchanged, continuing to reflect the true operational counts of the total manageable population.
     - Directory table renders a dedicated filter-empty view (*"No users match the selected filters."*) with a **`[ Clear filters ]`** button to reset filters back to the full dataset.
  5. **Access Restricted State (`403 Forbidden` / `ACCESS_DENIED`):**
     - Occurs when non-administrative roles (`noc`, `installer`, `csr`) query `GET /api/v1/users`.
     - The UI does not crash or redirect away. Instead, it renders an inline **Access Restricted** banner in place of the directory:
       > *"Access Restricted: You do not have administrative privileges to view or manage user accounts in this domain."*
     - Headline KPI summary cards are hidden or rendered in a disabled state.
  6. **Network / Server Error (`5xx` or connection timeout):**
     - Renders an inline error boundary card with an explanation (*"Failed to connect to authentication service."*) and an interactive `[ Retry ]` button that invalidates the query cache.
- **Frontend Contract:** The UI client attaches the standard Bearer token and does not compute or filter tenancy hierarchies client-side. The UI simply consumes the returned payload.

---

## 2. Headline KPI Metric Cards

Above the main directory table, the Users tab displays four real-time summary cards that provide an operational health overview of the manageable user population.

```
+-------------------+   +-------------------+   +-------------------+   +-------------------+
|    Total Users    |   |      Active       |   |     Suspended     |   |    MFA Enabled    |
|        17         |   |        15         |   |         2         |   |      14 of 17     |
+-------------------+   +-------------------+   +-------------------+   +-------------------+
```

### 2.1 Metric Calculation Specifications & Self-Account Exclusion Rule

To guarantee complete counting consistency between the headline KPI metrics and the directory table (Section 3), **the currently authenticated operator is excluded from the manageable user population**:

```typescript
// Define the manageable user population excluding the authenticated caller
const manageableUsers = users.filter(u => u.id !== currentSession.userId);
```

All KPI metrics are strictly computed from `manageableUsers`:

| KPI Card | Metric Calculation | Underlying Fields / Logic | Empty / Loading State |
| :--- | :--- | :--- | :--- |
| **Total Users** | `manageableUsers.length` | Total manageable operators excluding current operator (`manageableUsers.length`). | Skeleton shimmer / `0` |
| **Active** | `manageableUsers.filter(u => !u.suspended).length` | Count of manageable operators with operational access enabled (`u.suspended === false`). | Skeleton shimmer / `0` |
| **Suspended** | `manageableUsers.filter(u => u.suspended === true).length` | Count of locked or deactivated manageable operators (`u.suspended === true`). | Skeleton shimmer / `0` |
| **MFA Enabled** | `manageableUsers.filter(u => u.userTypeProprietaryInfo?.mfa?.enabled).length + " of " + manageableUsers.length` | Proportion of manageable operators with active multi-factor authentication. | Skeleton shimmer / `0 of 0` |

> [!NOTE]
> **Caller Filtering Behavior Across Roles:**
> - **For `root` callers:** `OWSEC` returns all platform accounts across the system, including the `root` caller's own record. Applying `filter(u => u.id !== currentSession.userId)` removes the `root` account, resulting in `manageableUsers.length === allUsers.length - 1`.
> - **For `admin` callers:** `OWSEC` authoritatively restricts `GET /api/v1/users` to records where `createdBy === currentAdminId`. Because an admin cannot create themselves (an admin is created by `root`), the caller's own account is not present in the returned array. Applying `filter(u => u.id !== currentSession.userId)` safely retains all returned users (`manageableUsers.length === allUsers.length`).
> - The UI and test assertions must always evaluate the population via `users.filter(u => u.id !== currentSession.userId).length` rather than assuming a static `allUsers.length - 1` subtraction.

### 2.2 Behavior & Refresh
- When the operator clicks the top-level **Refresh button** (`↻`), the client triggers `queryClient.invalidateQueries(['users'])` and `queryClient.invalidateQueries(['managementRoles'])`.
- The KPI cards display animated skeleton placeholders during background fetching without unmounting the existing layout.

---

## 3. Users Directory Table (Left Panel)

The left side of the split-view layout renders the master operator directory table.

### 3.1 Batch Ingestion Flow (`getAllUsers`) & Complete Dataset Guarantee
Upstream `OWSEC` `GET /api/v1/users` returns paginated subsets bounded by `limit` (default batch size: 500). To ensure that the client has access to the **entire** user population (e.g. 650 or 2,000+ manageable operators) and that KPI metrics, real-time search, system role filtering, and pagination do not silently truncate results at 500:
- The data query hook (`useGetUsers`) executes an automated batch ingestion loop matching the reference implementation in `ra-wlan-cloud-owprov-ui` (`src/hooks/Network/Users.ts`):
  ```typescript
  const getBatchUsers = async (offset: number, limit: number) => {
    const response = await axiosSec.get(`users?offset=${offset}&limit=${limit}`);
    return response.data.users as User[];
  };

  const getAllUsers = async () => {
    let users: User[] = [];
    let offset = 0;
    const limit = 500;
    let lastResponseLength = 0;

    do {
      const response = await getBatchUsers(offset, limit);
      users = [...users, ...response];
      offset += limit;
      lastResponseLength = response.length;
    } while (lastResponseLength === limit);

    return users;
  };
  ```
- **Architectural Guarantees:**
  1. **Accurate KPI Calculations:** KPI summary cards (`Total Users`, `Active`, `Suspended`, `MFA Enabled`) compute over 100% of manageable users (`allUsers.filter(u => u.id !== currentSession.userId)`).
  2. **Complete In-Memory Filtering:** Real-time search and role filtering evaluate against all records without premature truncation.
  3. **Deterministic Pagination:** Client-side table pagination slices the complete cached dataset deterministically.

### 3.2 Self-Account Exclusion Rule & Population Parity
To prevent operators from inadvertently locking themselves out, modifying their own platform role, or suspending their own account:
- The UI filters out the currently authenticated user's ID (`user.id !== currentSession.userId`).
- **Complete Population Parity:** This exact same filter is applied to the KPI summary cards (§2.1). Both the KPI card ("Total Users") and the Directory Table count indicator evaluate against `manageableUsers = allUsers.filter(u => u.id !== currentSession.userId)`, guaranteeing exact parity between table rows and headline metrics across both `root` (where the caller's record is filtered out) and `admin` sessions (where the caller is already omitted by backend filtering).
- Personal account configurations (password changes, profile updates, personal MFA setup) are handled exclusively via the global profile menu in the application header.

### 3.3 Search & Filter Controls

Directly above the directory table, three interactive controls govern the table view:

1. **Search Input (`Search users...`):**
   - Debounced by **300ms** to avoid extraneous renders.
   - Performs a case-insensitive substring match against:
     - `user.name`
     - `user.email`
     - `user.description`
2. **System Role Filter Dropdown:**
   - Filters the table by backend `userRole`.
   - Available options:
     - `All Roles` (default)
     - `admin` (Administrator)
     - `noc` (Network Operations)
     - `installer` (Field Technician / Installer)
     - `csr` (Customer Support Representative)
     - `root` (Visible only if the logged-in user is `root`)
3. **Status Filter Dropdown:**
   - Filters by operational account state:
     - `All Status` (default)
     - `Active` (`suspended === false`)
     - `Suspended` (`suspended === true`)

### 3.4 Directory Table Columns

| Column | UI Content & Mapping | Data Source & Transformation |
| :--- | :--- | :--- |
| **User** | • Circular Avatar image or 2-letter uppercase initials fallback.<br>• Full Name (Primary text, bold).<br>• Email Address (Secondary text, muted). | • Avatar: `user.avatar` base64 data URL via `avatar/${user.id}` binary fetch.<br>• Fallback initials: Derived from `user.name` (e.g., `"Anita Sharma"` $\rightarrow$ `"AS"`).<br>• `user.name`<br>• `user.email` |
| **System Role** | Standardized status badge indicating platform role: `admin`, `noc`, `installer`, `csr`, `root`. | Direct mapping from `user.userRole`. |
| **Scoped Access** | Human-readable badge summarizing active infrastructure scope grants: `"2 properties"`, `"3 venues"`, `"All properties"`, or `"None"`. | Computed client-side by matching active MRAs from `useGetManagementRoles(user.id)`. |
| **Status** | Pill badge: `Active` (Green) or `Suspended` (Orange/Red). | `user.suspended ? 'Suspended' : 'Active'` |
| **Last Login** | Relative timestamp (e.g., `"12 min ago"`, `"1h ago"`, `"18 Aug 2026"`). | Formatted from Unix epoch `user.lastLogin`. If `user.lastLogin === 0`, render `"Never"`. |
| **Row Selection** | Chevron icon (`>`) highlighting the currently active user loaded into the right details panel. | Highlights when `selectedUserId === user.id`. Clicking anywhere on the row selects the user. |

### 3.5 Pagination Contract
- Default page size: **5 rows** (configurable to 10 or 25).
- Pagination controls: Previous (`<`), page numbers (`1`, `2`, `3`), Next (`>`), and count indicator (`Showing 1-5 of 17`).
- Pagination state is reset to page 1 whenever the search query, role filter, or status filter changes.

### 3.6 Directory Table Presentation States

To ensure crisp visual differentiation between empty datasets, access restrictions, loading, and system errors:

| UI Presentation State | Trigger Condition | KPI Cards Display | Table / Main View Area | Available Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Loading** | Query is fetching / background refetch | Animated skeleton shimmers | Skeleton table row shimmers | Background refresh spinner |
| **Populated** | `200 OK` and `manageableUsers.length > 0` | Calculated metrics for active manageable population | Paginated user rows + split details panel | Search, filter, sort, row select, `+ Create user` |
| **Empty Dataset** | `200 OK` and `manageableUsers.length === 0` (e.g. newly created `admin`) | All cards render `0` (`0`, `0`, `0`, `"0 of 0"`) | Dedicated empty state illustration + *"No users found"* message | **`+ Create user` (fully enabled)**, `↻ Refresh` |
| **Filter Empty** | `200 OK`, search query or filter returns 0 matches | Unchanged (reflects total dataset metrics) | *"No users match the selected filters"* | *"Clear filters"* button |
| **Access Restricted** | `403 Forbidden` (`ACCESS_DENIED`) / `401` | Hidden / disabled | Inline Access Restricted card: *"You do not have administrative privileges to view or manage user accounts."* | Global navigation |
| **Service Error** | `5xx` or Network Disconnection | Error boundary fallback | Alert banner: *"Failed to connect to authentication service."* | **`[ Retry ]` button** |

---

## 4. Selected User Details Split Panel (Right Panel)

Clicking any row in the directory table loads the comprehensive **User Details Panel** in the right viewport. If no user is selected, the first row in the directory table is selected by default.

```
+-------------------------------------------------------------------+
|  (AS)  Anita Sharma                           [Active]       [...] |
|        anita@ipnx.example                                         |
|  ---------------------------------------------------------------  |
|  [ Profile ]       [ Scoped Access ]                              |
|  ---------------------------------------------------------------  |
|  (Content of active sub-tab rendered here)                        |
+-------------------------------------------------------------------+
```

### 4.1 Header & Administrative Context Menu (`...`)

The panel header displays the operator's avatar/initials, full name, email address, status badge, and an administrative actions menu button (`...`):

| Context Action | Downstream API Call | Behavior & Confirmation |
| :--- | :--- | :--- |
| **Reset MFA** | `PUT /api/v1/user/{id}?resetMFA=true` | Prompts confirmation. Disables MFA (`mfa.enabled: false`), clears `mfa.method` and `mobiles`, and appends an administrative audit note. |
| **Send Password Reset Email** | `PUT /api/v1/user/{id}?forgotPassword=true` | Dispatches password reset email containing one-time reset token directly from `OWSEC`. |
| **Resend Verification Email** | `PUT /api/v1/user/{id}?email_verification=true` | Dispatches email verification link to `user.email`. |
| **Suspend / Reactivate User** | `PUT /api/v1/user/{id}` with `{ "suspended": !user.suspended }` | Toggles account lock. If suspending, prompts modal confirmation. Updates KPI cards and table row. |
| **Delete User** | `DELETE /api/v1/user/{id}` | High-friction modal requiring confirmation. On success: removes user from cache, invalidates `['users']`, and selects next available user. |

---

## 5. Profile Sub-Tab (User Editing)

The **Profile** sub-tab provides direct inline modification of the selected operator's identity, credentials, and internal administrative audit notes.

### 5.1 Field Specifications & Form Controls

| Field | Input Control | Mutability & RBAC | Validation Rules & Behavior |
| :--- | :--- | :--- | :--- |
| **`Email`** | Text Input (Disabled) | **Permanently Immutable** (Read-only for all users, including `root`). | Primary identity key in `OWSEC`. Cannot be modified once created; field is permanently disabled across all roles and excluded from update payloads. |
| **`Name *`** | Text Input | Editable | Required. Minimum 1 character, maximum 128 characters. |
| **`System Role *`** | Dropdown Selector | Editable based on RBAC rules (`ACLProcessor::CanChangeUserRole`). | Options for `root`: `root`, `admin`, `noc`, `installer`, `csr`. Options for `admin`: `admin`, `noc`, `installer`, `csr` (excluding `root`). Cannot modify own role (`!IsSelf`). |
| **`Password`** | Masked text input with `Show`/`Hide` toggle | Editable | Optional on update. Helper: *"Leave unchanged to keep current password. Minimum 8 characters with uppercase, lowercase, number, and symbol."* |
| **`Description`** | Multi-line Textarea | Editable | Optional operational responsibility summary. |
| **`Notes`** | Audit Notes List + Add Note input | Editable / Append-only | Displays timestamped internal notes. Entering text appends `{ "note": text, "created": Math.floor(Date.now()/1000) }`. |

> [!NOTE]
> **Email Immutability:** In `OWSEC`, a user's email address serves as the permanent primary identity key and cannot be updated after account creation (in `RESTAPI_user_handler.cpp`, `ApplyProfileFields` only mutates `name`, `description`, `location`, `locale`, and `changePassword`). Consequently, the email input field is permanently disabled for all user roles, including `root`, and is excluded from `UpdateUserPayload`.

### 5.2 Role Modification Authorization Rules (OWSEC ACL Verification)

Role modifications dispatched via `PUT /api/v1/user/{id}` are strictly governed by `OWSEC`'s source-verified `ACLProcessor::CanChangeUserRole()` logic:

```cpp
static inline bool CanChangeUserRole(const SecurityObjects::UserInfo &User,
                                     const SecurityObjects::UserInfo &Target,
                                     SecurityObjects::USER_ROLE NewRole) {
    if (IsSelf(User, Target)) {
        return false;
    }
    if (IsRoot(User)) {
        return true;
    }
    if (!IsAdmin(User)) {
        return false;
    }
    return NewRole != SecurityObjects::ROOT && IsNonRootTarget(Target) &&
           WasCreatedBy(User, Target);
}
```

- **`root` operators:**
  - Can modify the system role of any user across the entire system.
  - Can assign any valid system role: `root`, `admin`, `noc`, `installer`, `csr`.
- **`admin` operators:**
  - Can modify the system role of **any non-root user they created** (`WasCreatedBy(User, Target) === true`), **including another `admin`** (e.g. demoting an admin-created admin to `noc`, `installer`, or `csr`, or changing an operator between operational roles).
  - Can assign any non-root role: `admin`, `noc`, `installer`, `csr`.
  - **Restrictions for `admin` operators:**
    - **Cannot elevate any user to `root`** (`NewRole != SecurityObjects::ROOT`).
    - **Cannot modify a `root` user** (`IsNonRootTarget(Target)`).
    - **Cannot modify their own role** (`!IsSelf(User, Target)`).
    - **Cannot modify users created by other operators** (`WasCreatedBy(User, Target)` is required; foreign users are neither visible in `GET /api/v1/users` nor editable).
- **Separation of System Role and Scoped Access:** A user's platform `userRole` (`OWSEC`) and their Scoped Access MRAs (`OWPROV`) are completely independent. Modifying an operator's `userRole` does not inspect, conflict with, or revoke their active MRAs. Managing physical property/venue access is performed independently in the **Scoped Access** sub-tab.

### 5.3 Action Buttons
- **`Cancel`:** Discards unsaved modifications and resets form to pristine initial values.
- **`Save profile`:** Dispatches `PUT /api/v1/user/{id}` to `OWSEC`. On success: invalidates `['users']` and `['users', id]`, shows a success toast, and updates table.

---

## 6. Scoped Access Sub-Tab (Management Role Assignments)

The **Scoped Access** sub-tab is the core infrastructure permissions interface. It manages the operator's operational scopes across properties and venues using `OWPROV`'s `managementRole` resource.

```
+-------------------------------------------------------------------+
|  System Role                                                      |
|  [ Network Operator                                         v ]   |
|  Controls platform capabilities.                                  |
|                                                                   |
|  Access Assignments (2)                                           |
|  +-------------------------------------------------------------+  |
|  | [Building] Sunrise Apartments             [Network Operator]|  |
|  |            All venues                              [/]  [x] |  |
|  +-------------------------------------------------------------+  |
|  | [Building] Oakwood Housing                           [CSR]  |  |
|  |            Building A                              [/]  [x] |  |
|  +-------------------------------------------------------------+  |
|  | + - - - - - - - - - - - - - - - - - - - - - - - - - - - - + |  |
|  | :                     + Assign access                     : |  |
|  | + - - - - - - - - - - - - - - - - - - - - - - - - - - - - + |  |
|                                                                   |
|  (i) Effective access: Network operations for Sunrise            |
|      Apartments; CSR access to Building A at Oakwood Housing.     |
|                                                                   |
|  [ Cancel ]                                       [ Save access ] |
+-------------------------------------------------------------------+
```

### 6.1 Data Fetching & Complete Metadata Ingestion (`OWPROV`)
Scoped access records are fetched directly using:
```typescript
GET /api/v1/managementRole?userId={selectedUserId}
```
The UI loads associated metadata in parallel. Upstream `OWPROV` defaults `limit = 100` on generic listing endpoints (`src/framework/RESTAPI_Handler.h`). To guarantee that deployments with > 100 properties, venues, or policies do not silently truncate valid options in the Scoped Access interface, the query hooks implement batch ingestion loops matching `ra-wlan-cloud-owprov-ui` (`Entity.ts` and `Venues.ts`):
- **Properties (`Entities`):** Resolved via `getAllEntities()` using batch size 500:
  ```typescript
  const getEntitiesBatch = async (limit: number, offset: number) =>
    axiosProv
      .get(`entity?withExtendedInfo=true&offset=${offset}&limit=${limit}`)
      .then(({ data }: { data: { entities: Entity[] } }) => data.entities);

  const getAllEntities = async () => {
    const limit = 500;
    let offset = 0;
    let data: Entity[] = [];
    let lastResponse: Entity[] = [];
    do {
      lastResponse = await getEntitiesBatch(limit, offset);
      data = data.concat(lastResponse);
      offset += limit;
    } while (lastResponse.length === limit);
    return data;
  };
  ```
- **Venues:** Resolved via `getAllVenues()` using batch size 500:
  ```typescript
  const getVenuesBatch = async (limit: number, offset: number) =>
    axiosProv
      .get(`venue?withExtendedInfo=true&offset=${offset}&limit=${limit}`)
      .then(({ data }) => data.venues as VenueApiResponse[]);

  const getAllVenues = async () => {
    const limit = 500;
    let offset = 0;
    let data: VenueApiResponse[] = [];
    let lastResponse: VenueApiResponse[] = [];
    do {
      lastResponse = await getVenuesBatch(limit, offset);
      data = data.concat(lastResponse);
      offset += limit;
    } while (lastResponse.length === limit);
    return data;
  };
  ```
- **Policies:** Resolved via `getAllPolicies()` (detailed in §14.1) using batch size 500 to resolve `role.managementPolicy` $\rightarrow$ Policy Name.

### 6.2 1:1 Backend MRA Card Representation
Each `managementRole` returned by `OWPROV` is rendered as an independent card:
- **Building Icon:** Infrastructure visual anchor.
- **Property Name:** Primary bold title (e.g., `"Sunrise Apartments"`).
- **Venue Scope:** Subtitle text:
  - If `role.venue === ""` or undefined: displays `"All venues"` (Property-wide grant).
  - If `role.venue` contains a UUID: displays the resolved venue name (e.g., `"Building A"`).
- **Policy Pill Badge:** Displays the assigned policy name (e.g., `"NOC"`, `"CSR"`, `"Admin"`).
- **Inline Edit Action (Pencil Icon):** Enters card editing mode.
- **Inline Revoke Action (Trash Bin Icon):** Triggers single-item revocation.

### 6.3 Policy-Only Card Editing & Scope Immutability
When the operator clicks the edit icon on an existing assignment card:
- **Scope Immutability:** In `OWPROV`, an MRA's physical boundary (`entity` and `venue`) is **immutable**. Changing physical boundaries represents a different scoping grant.
- **Locked Fields:** The Property and Venue labels remain read-only. The UI displays the helper text:
  > *"To change property or venue scope, revoke this assignment and create a new one."*
- **Editable Field:** The Policy dropdown is editable, allowing the operator to switch the assigned policy.
- **Submission:** Submits `PUT /api/v2/managementRole/{id}` with `{ "managementPolicy": newPolicyId }`.

### 6.4 Single-Item Revocation
- Clicking the Trash Bin icon displays a confirmation modal:
  `"Revoke access for [User Name] on [Property Name - Venue Scope]?"`
- On confirmation, executes `DELETE /api/v2/managementRole/{id}` directly against `OWPROV` V2.
- On success: invalidates `['managementRoles', userId]`, removes the card, and updates the table's Scoped Access summary badge.

### 6.5 Inline Expandable Assignment Form (`+ Assign access`)
Clicking the dashed `+ Assign access` button expands an inline scoping form:

1. **`Entity *` (Property Dropdown, Required):**
   - Populated via `getAllEntities()` (`GET /api/v1/entity?withExtendedInfo=true&offset={offset}&limit=500`).
   - Displays all properties accessible to the operator without 100-record truncation.
2. **`Venues` (Venue Multi-Select Dropdown, Optional):**
   - Populated via `getAllVenues()` (`GET /api/v1/venue?withExtendedInfo=true&offset={offset}&limit=500`) and dynamically filtered to venues where `venue.entity === selectedEntityId`.
   - **Property-Wide Selection:** Leaving this field empty assigns the role to the entire property (`"All venues"`).
   - **Multi-Venue Batch Selection:** Selecting one or more venues configures a batch assignment (`venueIds: [id1, id2, ...]`).
3. **`Policy *` (Management Policy Dropdown, Required):**
   - Populated via `getAllPolicies()` (`GET /api/v1/managementPolicy?offset={offset}&limit=500`).
   - Displays all active policies with their descriptions without truncation.
4. **Submission Execution (`OWPROV` V2 API):**
   - Endpoint: `POST /api/v2/managementRole/0`
   - Payload format:
     ```json
     {
       "name": "Generated or descriptive assignment name",
       "description": "Assigned via Mango Operator UI",
       "entity": "entity-uuid-1234",
       "venueIds": ["venue-uuid-001", "venue-uuid-002"],
       "managementPolicy": "policy-uuid-5678",
       "users": ["selected-user-uuid"]
     }
     ```
   - **Normalized Response Envelope:** The V2 endpoint returns a normalized `{ "roles": [...] }` envelope containing the created MRA records.
   - On success: closes the inline form, invalidates `['managementRoles', userId]`, and displays the new cards.

---

## 7. Create User Workflow (Modal Dialog)

Clicking the top-level `+ Create user` button opens the focused user creation modal dialog.

```
+-------------------------------------------------------------------+
|  [+] Create user                                              [X] |
|      Create an account and configure its initial authentication.  |
|  ---------------------------------------------------------------  |
|  USER DETAILS                                                     |
|  Email *             [ name@company.com                         ] |
|  Name *              [ Enter full name                          ] |
|  System role *       [ Select a role                          v ] |
|  Description         [ Describe this user's responsibility      ] |
|  Note                [ Add an internal administrative note      ] |
|                                                                   |
|  AUTHENTICATION SETTINGS                                          |
|  Password *          [ ****************               ] [Show]    |
|                      Minimum 8 characters with uppercase,         |
|                      lowercase, number, and symbol.               |
|  [x] Force password change                                        |
|      Require a new password at first sign-in.                     |
|  [ ] Email validation                                             |
|      Require the user to verify their email address.              |
|  ---------------------------------------------------------------  |
|  [ Cancel ]                                       [ Create user ] |
+-------------------------------------------------------------------+
```

### 7.1 Field Specifications & Form Rules

1. **`Email *` (Required):**
   - Must satisfy RFC 5322 email formatting.
   - Checked for uniqueness against `OWSEC`. Duplicate emails return `400 Bad Request` (`UserAlreadyExists`).
2. **`Name *` (Required):**
   - Full display name. Minimum 1 character, maximum 128 characters.
3. **`System role *` (Required):**
   - **No default value is preselected.** The dropdown placeholder displays `"Select a role"`.
   - Offers strictly backend operational roles: `admin`, `noc`, `installer`, `csr` (plus `root` if creator is `root`).
   - `subscriber` is strictly excluded.
4. **`Description` (Optional):**
   - Contextual description of operational responsibilities.
5. **`Note` (Optional):**
   - Optional initial administrative note saved into `user.notes`.
6. **`Password *` (Required for manual password mode):**
   - Visibility toggle (`Show` / `Hide`).
   - **Backend-Authoritative Validation:** Password complexity rules are governed authoritatively by `OWSEC` (`authentication.validation.expression`). On application startup, the client queries `POST /api/v1/oauth2?requirements=true` via the `useApiRequirements` hook (matching `ra-wlan-cloud-owprov-ui` `src/hooks/useApiRequirements.ts`) to retrieve the configured `passwordPattern` regex (falling back to OWSEC's default `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$`).
   - **"View password policy" Link:** Rendered beneath the password field as an external hyperlink opening `passwordPolicyLink` (`${secUrl}/wwwassets/password_policy.html` or the URI returned by `OWSEC` in `passwordPolicy`) in a new browser tab (`target="_blank" rel="noopener noreferrer"`).
   - Helper text: *"Must satisfy password complexity requirements. View password policy."*
7. **`Force password change` (Toggle):**
   - Default: `true`. Sets `changePassword: true`.
   - Requires operator to set a new password on initial login.
8. **`Email validation` (Toggle):**
   - **Default:** `false` (unchecked in UI).
   - **Toggle Semantics:**
     - **When Enabled (`true`):**
       - Form state: `emailValidation = true`
       - Network invocation: Append query parameter `?email_verification=true` to the URL (`POST /api/v1/user/0?email_verification=true`).
       - Backend behavior: `OWSEC` creates the user record with `waitingForEmailCheck: true`, sets `validated: false`, and dispatches an automated verification email with an action link (`AuthService::VerifyEmail()`).
     - **When Disabled (`false`):**
       - Form state: `emailValidation = false`
       - Network invocation: Do **not** append the query parameter (`POST /api/v1/user/0`).
       - Backend behavior: `OWSEC` creates the user record pre-validated (`validated: true`), with `waitingForEmailCheck: false`. No verification email is dispatched.
   - **Authoritative Contract Determination:**
     - The **URL query parameter (`?email_verification=true`) is authoritatively evaluated by `OWSEC`** (`RESTAPI_user_handler.cpp` line 400: `if (GetParameter("email_verification", "") == "true")`).
     - The JSON body field (`emailValidation: boolean`) is maintained within frontend Formik form values for client-side state tracking and reference parity with `owprov-ui`, but is ignored by the backend JSON parser. The query parameter alone governs the backend email verification workflow.

### 7.2 Creation Payload & Endpoint
- **Target Endpoint:** 
  - When `emailValidation === true`: `POST /api/v1/user/0?email_verification=true`
  - When `emailValidation === false`: `POST /api/v1/user/0`
- **Request Body:**
  ```json
  {
    "name": "Anita Sharma",
    "email": "anita@ipnx.example",
    "userRole": "noc",
    "currentPassword": "InitialPassword123!",
    "description": "Regional NOC Engineer",
    "notes": [{ "note": "Provisioned during Phase 1 onboarding" }],
    "changePassword": true,
    "emailValidation": false
  }
  ```
- **Lifecycle on Success:**
  1. `OWSEC` returns the newly created `User` JSON object with generated UUID.
  2. The UI closes the modal and invalidates `['users']`.
  3. Displays a success notification toast: `"User [Name] created successfully."`
  4. Automatically selects the newly created user in the directory table and opens their Profile in the right details panel.

---

## 8. Authoritative API Contracts for Frontend Developers

> [!IMPORTANT]
> **Source-Verified Contract Assurance:**  
> All request payloads, query parameters, JSON response keys, field naming conventions, and HTTP status codes below are verified directly against authoritative C++ daemon source code (`ra-wlan-cloud-ucentralsec/src/RESTAPI/`, `ra-wlan-cloud-owprov/src/RESTAPI/`) and official OpenAPI specifications (`owsec.yaml`, `owprov.yaml`, `owprov-v2.yaml`).

### 8.1 OWSEC User API Contracts

#### 8.1.1 List Users
```http
GET /api/v1/users?offset=0&limit=500 HTTP/1.1
Host: <owsec-host>:9002
Authorization: Bearer <jwt-token>
```
> [!NOTE]
> `OWSEC` `GET /api/v1/users` authoritatively parses `offset`, `limit`, `idOnly`, `nameSearch`, and `emailSearch`. While legacy frontend implementations (such as `owprov-ui`) pass `withExtendedInfo=true` (borrowed from `OWPROV`), `OWSEC` does not evaluate this parameter because `UserInfo` records always include full metadata by default. When retrieving directories larger than 500 users, the frontend invokes this endpoint in a sequential batch loop (`offset += limit` while `batch.length === limit`, as detailed in §3.1) to aggregate the complete user directory before caching.

**Response (`200 OK`):**
```json
{
  "users": [
    {
      "id": "c1f7a052-8239-4d3b-9e48-e8d91a92a101",
      "name": "Anita Sharma",
      "email": "anita@ipnx.example",
      "userRole": "noc",
      "description": "Tier 2 Support Engineer",
      "avatar": "1",
      "suspended": false,
      "lastLogin": 1726052400,
      "userTypeProprietaryInfo": {
        "mfa": {
          "enabled": true,
          "method": "authenticator"
        },
        "mobiles": []
      },
      "notes": [
        {
          "note": "Initial onboarding complete",
          "created": 1725900000
        }
      ]
    }
  ]
}
```

#### 8.1.2 Get User Avatar
```http
GET /avatar/{userId}?cache={avatarId} HTTP/1.1
Host: <owsec-host>:9002
Authorization: Bearer <jwt-token>
```
**Response (`200 OK`):** Binary image stream (`image/jpeg` or `image/png`).  
*Frontend implementation converts binary arraybuffer to `data:image/png;base64,...` URL with query caching.*

#### 8.1.3 Create User
```http
POST /api/v1/user/0 HTTP/1.1
Host: <owsec-host>:9002
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "David Okafor",
  "email": "david@ipnx.example",
  "userRole": "installer",
  "currentPassword": "SecurePassword123!",
  "description": "Field Technician",
  "changePassword": true,
  "emailValidation": false
}
```
> [!NOTE]
> **Email Verification Activation & Authoritative Scope:**
> - **Query Parameter Authority:** To require email verification on newly created operators, the frontend appends `?email_verification=true` to the URL: `POST /api/v1/user/0?email_verification=true`. As source-verified in `OWSEC` (`RESTAPI_user_handler.cpp` line 400), `GetParameter("email_verification", "") == "true"` is the sole authoritative trigger that flags the user account with `waitingForEmailCheck = true`, sets `validated = false`, and dispatches the verification email.
> - **Body Field vs Query Parameter:** When the email validation toggle is disabled, the frontend sends `POST /api/v1/user/0` without query parameters, creating the account pre-validated (`validated: true`). The JSON body property `"emailValidation": boolean` is passed for client form state tracking and reference parity with `owprov-ui`, but is ignored by the backend JSON deserializer.

**Response (`200 OK`):** Full created `User` record including generated `id`.

#### 8.1.4 Update User
```http
PUT /api/v1/user/{userId} HTTP/1.1
Host: <owsec-host>:9002
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "David Okafor",
  "description": "Senior Field Technician",
  "userRole": "installer"
}
```
**Response (`200 OK`):** Updated `User` record.

> [!NOTE]
> **Email Immutability:** `OWSEC` does not support updating user email addresses. `email` acts as the permanent primary identity key and cannot be altered after creation. Neither standard administrators nor `root` users can modify a user's email address. The `email` field is excluded from `UpdateUserPayload`.

#### 8.1.5 Administrative Security & Lifecycle Actions
- **Suspend User:** `PUT /api/v1/user/{id}` with `{ "suspended": true }`
- **Reactivate User:** `PUT /api/v1/user/{id}` with `{ "suspended": false }`
- **Reset MFA:** `PUT /api/v1/user/{id}?resetMFA=true` with `{}` (Response `200 OK`: sets `mfa.enabled: false`, clears `mfa.method` and `mobiles`, and appends an administrative audit note)
- **Send Password Reset:** `PUT /api/v1/user/{id}?forgotPassword=true` with `{}`
- **Resend Email Verification:** `PUT /api/v1/user/{id}?email_verification=true` with `{}` (Response `200 OK`)
- **Delete User:** `DELETE /api/v1/user/{id}` (Response `200 OK` with empty response body)

#### 8.1.6 Get Security Requirements & Password Policy
```http
POST /api/v1/oauth2?requirements=true HTTP/1.1
Host: <owsec-host>:9002
Authorization: Bearer <jwt-token>
Content-Type: application/json

{}
```
**Response (`200 OK`):**
```json
{
  "passwordPattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$",
  "accessPolicy": "/wwwassets/access_policy.html",
  "passwordPolicy": "/wwwassets/password_policy.html"
}
```

> [!NOTE]
> `OWSEC` is authoritative for password complexity via `authentication.validation.expression`. The frontend hook `useApiRequirements` caches this payload indefinitely (`staleTime: Infinity`) to drive dynamic form validation and populate the "View password policy" link.

---

### 8.2 OWPROV Scoped Access (Management Role) API Contracts

#### 8.2.1 List User's Management Roles (V1)
```http
GET /api/v1/managementRole?userId={userId} HTTP/1.1
Host: <owprov-host>:9005
Authorization: Bearer <jwt-token>
```
**Response (`200 OK`):**
```json
{
  "roles": [
    {
      "id": "mra-001",
      "name": "Sunrise Towers Access",
      "description": "Building technician scope",
      "managementPolicy": "policy-noc-uuid",
      "users": ["c1f7a052-8239-4d3b-9e48-e8d91a92a101"],
      "entity": "entity-uuid-1234",
      "venue": "",
      "created": 1725900000,
      "modified": 1725900000
    }
  ]
}
```

#### 8.2.2 Create Scoped Access (V2 Batch & Single Scope)
> [!NOTE]
> **V2 vs. Legacy V1 Contract Disambiguation:**
> - **V1 Endpoint (`POST /api/v1/managementRole/{id}`):** Handled by `RESTAPI_managementRole_handler.cpp`. Accepts a single `venue` string, creates a single role, and returns an unwrapped single role object `{ ... }`.
> - **V2 Endpoint (`POST /api/v2/managementRole/{id}`):** Handled by `RESTAPI_managementRole_v2_handler.cpp` (OpenAPI: `owprov-v2.yaml`, git commit `0136c9e`). Specifically introduced to support batch multi-venue role creation via `venueIds: []` (or entity-wide when omitted/empty), performs atomic batch rollback on failure, and always returns the normalized `{ "roles": [...] }` envelope. The frontend reference implementation (`ra-wlan-cloud-owprov-ui` in `src/hooks/Network/ManagementRoles.ts`) authoritatively communicates with `axiosProvV2.post('managementRole/0')`.

```http
POST /api/v2/managementRole/0 HTTP/1.1
Host: <owprov-host>:9005
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Oakwood Building A Tech Access",
  "description": "Provisioned for maintenance",
  "entity": "entity-uuid-5678",
  "venueIds": ["venue-uuid-building-a"],
  "managementPolicy": "policy-installer-uuid",
  "users": ["c1f7a052-8239-4d3b-9e48-e8d91a92a101"]
}
```
**Response (`200 OK`):** Normalized envelope:
```json
{
  "roles": [
    {
      "id": "mra-002",
      "name": "Oakwood Building A Tech Access",
      "managementPolicy": "policy-installer-uuid",
      "users": ["c1f7a052-8239-4d3b-9e48-e8d91a92a101"],
      "entity": "entity-uuid-5678",
      "venue": "venue-uuid-building-a",
      "created": 1726052400,
      "modified": 1726052400
    }
  ]
}
```

#### 8.2.3 Update Scoped Access (V2 Policy Mutation)
```http
PUT /api/v2/managementRole/{id} HTTP/1.1
Host: <owprov-host>:9005
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "managementPolicy": "policy-noc-uuid",
  "description": "Elevated to NOC policy"
}
```
**Response (`200 OK`):** Updated `ManagementRole` record.

#### 8.2.4 Revoke Scoped Access (V2)
```http
DELETE /api/v2/managementRole/{id} HTTP/1.1
Host: <owprov-host>:9005
Authorization: Bearer <jwt-token>
```
**Response (`200 OK`):** Empty response body (calls `OK()`).

---

## 9. Frontend Data Structures & Type Definitions

```typescript
// ==========================================
// OWSEC Identity Types
// ==========================================

export type UserRole = 'root' | 'admin' | 'csr' | 'noc' | 'installer';

export interface UserMfa {
  enabled: boolean;
  method?: 'authenticator' | 'sms' | 'email' | '';
}

export interface UserProprietaryInfo {
  authenticatorSecret?: string;
  mfa: UserMfa;
  mobiles?: { number: string }[];
}

export interface UserNote {
  note: string;
  created: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  userRole: UserRole;
  description?: string;
  avatar?: string;
  suspended: boolean;
  blackListed?: boolean;
  lastLogin: number;
  creationDate?: number;
  modified?: number;
  notes: UserNote[];
  userTypeProprietaryInfo?: UserProprietaryInfo;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  userRole: UserRole;
  currentPassword: string;
  description?: string;
  notes?: { note: string }[];
  changePassword: boolean;
  emailValidation: boolean;
}

export interface UpdateUserPayload {
  id: string;
  name?: string;
  description?: string;
  userRole?: UserRole;
  currentPassword?: string;
  notes?: { note: string }[];
  // Note: 'email' is permanently immutable in OWSEC and excluded from update payloads
}

// ==========================================
// OWPROV Scoped Access Types
// ==========================================

export interface ManagementRole {
  id: string;
  name: string;
  description?: string;
  managementPolicy: string;
  users: string[];
  entity: string;
  venue: string;
  inUse?: string[];
  tags?: string[];
  notes?: UserNote[];
  created?: number;
  modified?: number;
}

export interface CreateManagementRolePayload {
  name: string;
  description?: string;
  entity: string;
  venueIds?: string[];
  managementPolicy: string;
  users: string[];
}

export interface UpdateManagementRolePayload {
  name?: string;
  description?: string;
  managementPolicy?: string;
}

// Infrastructure Metadata
export interface EntityMetadata {
  id: string;
  name: string;
  description?: string;
}

export interface VenueMetadata {
  id: string;
  name: string;
  entity: string;
  description?: string;
}

export interface ManagementPolicyMetadata {
  id: string;
  name: string;
  description?: string;
  inUse?: string[];
}
```

---

## 10. Frontend Form Validation Schemas (Yup Reference)

```typescript
import * as Yup from 'yup';

// OWSEC default pattern fallback; actual pattern is dynamically populated from useApiRequirements()
export const DEFAULT_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const getCreateUserValidationSchema = (passwordPattern: RegExp = DEFAULT_PASSWORD_PATTERN) =>
  Yup.object().shape({
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Email is required'),
    name: Yup.string()
      .min(1, 'Name must be at least 1 character')
      .max(128, 'Name cannot exceed 128 characters')
      .required('Full name is required'),
    userRole: Yup.string()
      .oneOf(['admin', 'noc', 'installer', 'csr', 'root'], 'Please select a valid system role')
      .required('System role is required'),
    currentPassword: Yup.string()
      .required('Password is required')
      .test(
        'password-complexity',
        'Password does not meet the complexity requirements configured on the security service',
        (value) => !value || passwordPattern.test(value)
      ),
    description: Yup.string().max(256, 'Description cannot exceed 256 characters'),
    note: Yup.string().max(500, 'Note cannot exceed 500 characters'),
    changePassword: Yup.boolean(),
    emailValidation: Yup.boolean(),
  });

export const getUpdateUserValidationSchema = (passwordPattern: RegExp = DEFAULT_PASSWORD_PATTERN) =>
  Yup.object().shape({
    name: Yup.string()
      .min(1, 'Name must be at least 1 character')
      .max(128, 'Name cannot exceed 128 characters')
      .required('Full name is required'),
    userRole: Yup.string()
      .oneOf(['admin', 'noc', 'installer', 'csr', 'root'], 'Please select a valid system role')
      .required('System role is required'),
    currentPassword: Yup.string()
      .notRequired()
      .test(
        'password-complexity',
        'Password does not meet the complexity requirements configured on the security service',
        (value) => !value || value.length === 0 || passwordPattern.test(value)
      ),
    description: Yup.string().max(256, 'Description cannot exceed 256 characters'),
  });

export const CreateScopedAccessValidationSchema = Yup.object().shape({
  entity: Yup.string().required('Please select a Property (Entity)'),
  venueIds: Yup.array().of(Yup.string()),
  managementPolicy: Yup.string().required('Please select a Management Policy'),
});
```

---

## 11. Acceptance Criteria & QA Test Scenarios

### 11.1 KPI Metrics & Directory Table Tests
- **TC-USR-001 (KPI Metrics Accuracy & Population Parity):** Verify `Total Users`, `Active`, `Suspended`, and `MFA Enabled` accurately compute from `manageableUsers = allUsers.filter(u => u.id !== currentSession.userId)`. Verify that for a `root` session (which includes the caller's record), the manageable count is `allUsers.length - 1`, while for an `admin` session (where the caller is not in `createdBy == currentAdminId`), the manageable count equals `allUsers.length`. In all cases, the headline Total Users metric must exactly match the Directory Table row count.
- **TC-USR-002 (Self-Account Exclusion):** Verify the currently authenticated user is excluded from both the Directory Table and the headline KPI summary calculations.
- **TC-USR-003 (Admin Visibility Enforcement):** Authenticate as an `admin`. Verify `OWSEC` returns strictly users where `createdBy == currentAdminId`.
- **TC-USR-004 (Table Search Filtering):** Enter query in search bar. Verify real-time 300ms debounced filtering across name, email, and description.
- **TC-USR-005 (Role & Status Filtering):** Filter by `noc` role and `Active` status. Verify table renders only active NOC operators.
- **TC-USR-006 (Pagination):** Verify pagination navigates through pages correctly and resets to page 1 upon search/filter changes.

### 11.2 User Lifecycle & Security Action Tests
- **TC-USR-007 (Create User Password Validation & Policy Link):** Attempt to submit Create User with a password that fails the dynamic `passwordPattern` from `POST /api/v1/oauth2?requirements=true`. Verify inline validation failure. Verify clicking "View password policy" opens `passwordPolicyLink` in a new browser tab.
- **TC-USR-008 (Create User Success):** Fill valid details with role `noc`, submit form. Verify `POST /api/v1/user/0` is dispatched, modal closes, and new user appears in table.
- **TC-USR-009 (Administrative Actions):** Trigger Reset MFA, Send Password Reset, and Suspend User from context menu. Verify correct API parameters on `PUT /api/v1/user/{id}`.
- **TC-USR-010 (Profile Editing & Email Immutability):** Verify `Email` input field is disabled and read-only across all roles (including `root`). Update name and description in Profile sub-tab, click Save. Verify `PUT /api/v1/user/{id}` dispatches only editable fields (`name`, `description`, `userRole`, `notes`, etc.) without `email`, executes successfully, and updates cached data.
- **TC-USR-011 (Admin Role Editing Authorization):** Authenticate as an `admin`. Open an operator created by this admin who holds the `admin` role. Verify the `System Role` dropdown is enabled, lists non-root roles (`admin`, `noc`, `installer`, `csr`), and omits `root`. Change the role to `noc` and click Save; verify `PUT /api/v1/user/{id}` succeeds with `200 OK`. Attempting to submit `userRole: "root"` returns `403 Forbidden` (`ACCESS_DENIED`). Verify that an admin cannot edit their own role.
- **TC-USR-012 (Token-Driven Authorization & Non-Admin Graceful Handling):** Authenticate with a non-admin role (e.g. `noc`, `installer`, `csr`). Navigate to the Users tab. Verify the UI does not pre-block or crash the route. When `GET /api/v1/users` returns `403 Forbidden` (`ACCESS_DENIED`), verify the UI renders a graceful unauthorized state indicating the caller is not authorized to retrieve the user directory.
- **TC-USR-013 (Empty Dataset vs. Unauthorized State Distinction):**
  1. Authenticate as a newly created `admin` who has not created any operators (`GET /api/v1/users` returns `200 OK` with `{"users": []}`). Verify the UI displays all KPI cards as `0`, renders the friendly empty state (*"No users found"*), keeps the `+ Create user` button enabled, and does NOT display an Access Denied or error alert.
  2. Authenticate as a `noc` operator (`GET /api/v1/users` returns `403 Forbidden`). Verify the UI displays the distinct Access Restricted alert card without rendering an empty table or misinforming the user that no records exist.

### 11.3 Scoped Access (MRA) Tests
- **TC-SCA-001 (Fetch Scoped Access):** Select user with active assignments. Verify `GET /api/v1/managementRole?userId={id}` displays individual 1:1 cards.
- **TC-SCA-002 (Scope Immutability):** Click edit on an assignment card. Verify Property and Venue fields are read-only and only Policy is editable.
- **TC-SCA-003 (MRA Policy Update):** Change policy on existing card, click save. Verify `PUT /api/v2/managementRole/{id}` sends `{ "managementPolicy": newId }`.
- **TC-SCA-004 (Single-Item Revocation):** Click trash icon on card, confirm prompt. Verify `DELETE /api/v2/managementRole/{id}` removes the assignment card.
- **TC-SCA-005 (Assign Property-Wide Access):** In inline form, select Entity, leave Venues empty, select Policy, submit. Verify `POST /api/v2/managementRole/0` creates property-wide MRA (`venue: ""`).
- **TC-SCA-006 (Assign Multi-Venue Batch Access):** In inline form, select Entity, select 2 Venues, select Policy, submit. Verify V2 backend returns normalized `{ "roles": [...] }` envelope and 2 distinct cards render.
- **TC-SCA-007 (Metadata Ingestion Completeness):** Verify Entity and Venue selection dropdowns execute batch ingestion loops (`limit=500`), guaranteeing that deployments with > 100 properties or venues load 100% of choices without silent truncation at `OWPROV`'s default 100-item boundary.

---

# Part 2: Policies Tab Specification

---

## 12. Domain Model & Policy Architecture

The Policies tab provides centralized cataloging, resource permission inspection, and root-only policy lifecycle management directly integrated with `OWPROV` and the aggregation backend (`mango-mdu-service`).

```
+---------------------------------------------------------------------------------------------------+
|                                        Browser Client                                             |
|                                     (mango-operator-ui)                                           |
+---------------------------------------------------------------------------------------------------+
                               |                                           |
             Direct REST (JWT Bearer)                             REST (JWT Bearer)
             axiosProv (/api/v1)                                  axiosMdu (/api/v1)
             (Authoritative CRUD & Listing)                       (Policy Overview Aggregation)
                               |                                           |
                               v                                           v
             +----------------------------------+        +-----------------------------------+
             |              OWPROV              |        |         mango-mdu-service         |
             |   (Management Policy Engine)     |        |      (Aggregation Backend)        |
             +----------------------------------+        +-----------------------------------+
             | • ManagementPolicies table       |        | • Joins OWPROV MRAs               |
             | • Canonical 8 system resources   |        | • Joins OWSEC Visible Users       |
             | • 5 operational access verbs     |        | • Computes set intersection       |
             | • Root-only mutation enforcement |        | • Delivers consolidated overview  |
             +----------------------------------+        +-----------------------------------+
```

### 12.1 Uniform Policy Architecture (No "Built-in" vs. "Custom" Types)

A critical architectural principle of the OpenWifi policy system is that **all policies share an identical record schema in `OWPROV`**:
- Every policy record consists of `id`, `name`, `description`, `entries`, `entity`, `venue`, `inUse`, `tags`, `created`, and `modified`.
- **Global, Scope-Independent Templates (Legacy Schema Fields):** Management Policies in Mango are intentionally independent of physical scope. They define *what* actions can be performed, while Management Role Assignments (MRAs) define *where* (the physical scope: entity and venue) and *to whom* (the user) they apply. While `entity` and `venue` fields exist in the policy record due to legacy `OWPROV` schema compatibility, they always remain empty strings (`""`) because policies are global, reusable blueprints not bound to any specific property or venue.
- The `OWPROV` backend has **no concept of a policy `type` column** (there is no `built-in` vs. `custom` classification in the backend).
- Baseline policies (e.g., `Admin`, `CSR`, `Installer`, `NOC`) are auto-seeded into `OWPROV` during service initialization (`service up`) simply to provide convenient starting blueprints. They are not structurally distinct or locked.
- Policy names are descriptive identifiers and **must not be conflated with `OWSEC` platform `userRole`**. A policy named `"Admin"` or `"Network Operator"` is simply a ruleset template that can be assigned to any user via Scoped Access.

### 12.2 Root-Only Mutation Authority & Deletion Protection
1. **Root-Only CRUD Authority:**
   - Any policy can be created, updated, or deleted **exclusively by operators holding the `root` platform role** (`userRole === 'root'`).
   - The `OWPROV` microservice authoritatively validates the caller's session token and enforces root restriction on mutating endpoints (`POST`, `PUT`, `DELETE`). The UI simply enforces presentation guards (hiding or disabling mutation controls for non-root users).
   - Operators with non-root roles (`admin`, `noc`, `installer`, `csr`) have view-only access to inspect policy definitions and permissions. Scoped user assignments in the Scoped Access interface are governed authoritatively by the backend based on the caller's authority over the target user. As detailed in §1.2, UI tabs and modules are not bound or restricted by user role; downstream services authoritatively inspect the session token and return data if authorized, or `403 Forbidden` (`ACCESS_DENIED`) if denied.
2. **Authoritative Deletion Protection (`StillInUse`):**
   - A policy can only be deleted if its active assignments count is `0`.
   - If a policy is currently assigned to one or more active Management Role Assignments, `OWPROV` authoritatively rejects deletion with:
     ```json
     {
       "ErrorCode": 400,
       "ErrorDescription": "StillInUse",
       "ErrorDetails": "Policy cannot be deleted while assigned to active management roles."
     }
     ```
   - In the UI, the delete action is disabled with an explanatory tooltip whenever active assignments exist.

---

## 13. Headline KPI Metric Card (Policies Tab)

Above the Policies catalog table, a real-time KPI metric card provides the total policy count calculated directly from the `GET /api/v1/managementPolicy` response:

```
+-------------------+
|   Total Policies  |
|        14         |
+-------------------+
```

### 13.1 KPI Calculation Specifications

The metric is derived directly from cached `['managementPolicies']` (`OWPROV` `GET /api/v1/managementPolicy`) by counting the returned response items:

| KPI Card | Calculation Formula | Source & Underlying Logic |
| :--- | :--- | :--- |
| **Total Policies** | `policies.length` | Total policy records returned in the `managementPolicies` array from `OWPROV` `GET /api/v1/managementPolicy`. |

> [!NOTE]
> **Policy-Specific Usage Isolation:**
> Global cards do not calculate assignment or usage metrics across policies. All operational assignment metrics—including active scoped assignments, distinct user counts, and infrastructure scopes—are isolated to the selected policy and loaded on demand within the **Overview** sub-tab via `GET /api/v1/policy/{id}/overview` (§16).

---

## 14. Policies Catalog Table (Left Panel)

The left side of the split-view layout renders the master Policies Catalog table, aligning with `ra-wlan-cloud-owprov-ui` (`PoliciesPage/Table.tsx`).

### 14.1 Ingestion Contract & Filter Controls
- **Batch Ingestion Flow (`getAllPolicies`) & Complete Catalog Guarantee:**
  Policies are global, reusable permission templates independent of physical scope or individual users. In upstream `OWPROV`, `GET /api/v1/managementPolicy` inherits the shared request handler's default `limit = 100` (`src/framework/RESTAPI_Handler.h`). To guarantee that deployments with > 100 policies are not silently truncated at 100, the data query hook (`useGetManagementPolicies`) implements an automated batch ingestion loop matching the completeness guarantees established for users and entities:
  ```typescript
  const getPoliciesBatch = async (limit: number, offset: number) =>
    axiosProv
      .get(`managementPolicy?offset=${offset}&limit=${limit}`)
      .then(({ data }) => data.managementPolicies as ManagementPolicy[]);

  const getAllPolicies = async () => {
    const limit = 500;
    let offset = 0;
    let policies: ManagementPolicy[] = [];
    let lastResponseLength = 0;

    do {
      const batch = await getPoliciesBatch(limit, offset);
      policies = [...policies, ...batch];
      offset += limit;
      lastResponseLength = batch.length;
    } while (lastResponseLength === limit);

    return policies;
  };
  ```
  - **Single-Request Fast Path:** For typical deployments ($\le 500$ policies), the query completes in a single HTTP round-trip (`limit=500`), retrieving the complete catalog immediately without truncation.
  - **Complete Catalog Guarantee:** For large deployments with $> 500$ policies, the loop deterministically aggregates 100% of the catalog before caching.
- **Search Policies Input (`Search policies...`):**
  - Debounced by **300ms**.
  - Matches `name` and `description` (case-insensitive substring).
- **Scope Filter Dropdown (Legacy Compatibility):**
  - Options: `All Scopes` (default), `Global (Unscoped)`.
  - In the Mango model, policies are global permission templates not bound to a physical scope. Scope is bound exclusively via MRAs; hence all policy records evaluate as global templates.

### 14.2 Table Column Specifications

The master catalog table focuses purely on policy definitions. All user assignment counts, property/venue distributions, and operator rosters are presented in the selected policy's Overview sub-tab (§16).

| Column | Header | Data Source & Transformation | Display Behavior |
| :--- | :--- | :--- | :--- |
| **`Policy`** | `Policy` / `Name` | `policy.name` | Shield Icon + Policy Name (bold primary text). |
| **`Entity`** | `Property` / `Entity` | `policy.entity` | Legacy schema field. Always empty (`""`) as policies are global templates independent of scope. Displays `"Global"` or `"—"`. |
| **`Venue`** | `Venue` | `policy.venue` | Legacy schema field. Always empty (`""`) as policies are global templates independent of scope. Displays `"Global"` or `"—"`. |
| **`Description`** | `Description` | `policy.description` | Truncated single-line summary with tooltip for full text. |
| **`Modified`** | `Modified` | `policy.modified` | Formatted relative or calendar date (e.g. `"1 Sep 2026"`). If `0`, render `"Never"`. |
| **Selection** | Chevron (`>`) | `selectedPolicyId === policy.id` | Highlights active row loaded into right detail panel. |

> [!NOTE]
> **Scope Independence & Legacy Schema Preservation:**
> While `entity` and `venue` columns are preserved in the table for interface parity with `owprov-ui`'s legacy schema, their values remain empty (`""`) across all policies. Policies define platform permission sets, whereas physical scoping (`entity` and `venue`) is applied dynamically when assigning policies to users via Management Role Assignments (MRAs).

### 14.3 Pagination & Row Actions
- Controlled pagination matching `DataTable` (default 5 or 10 rows per page, page numbers `< 1 2 >`, item count indicator).
- Clicking any row selects the policy and immediately loads its details into the right split panel.

---

## 15. Selected Policy Details Split Panel (Right Panel)

Selecting a policy row loads the policy details split panel on the right. If no policy is selected, the first row in the catalog is selected by default.

```
+-------------------------------------------------------------------+
|  [Shield] Network Operator                                   [...] |
|           Monitor devices and manage network configuration.       |
|  ---------------------------------------------------------------  |
|  [ Overview ]      [ Permissions ]                                |
|  ---------------------------------------------------------------  |
|  (Content of active sub-tab rendered here)                        |
+-------------------------------------------------------------------+
```

### 15.1 Header & Administrative Context Menu (`...`)
- **Panel Header:** Policy Icon, Policy Name, Description subtitle, and Context Menu button (`...`).
- **Context Actions Menu (`...`):**
  - **`Edit Policy`:** Activates policy edit mode on the Permissions sub-tab (visible only to `root`). Switches the sub-tab to edit mode, exposing editable fields for **Policy Name**, **Description**, **Policy Preset**, and the **Resource Permissions configuration**, with `[ Cancel ]` and `[ Save policy ]` controls.
  - **`Delete Policy`:** Initiates policy deletion (visible only to `root`).
    - **In-Use Guard:** If the policy is bound to $\ge 1$ active assignments (verified via policy overview `totalScopedAssignments > 0`), the delete button is disabled with tooltip:
      > *"Cannot delete policy: Currently assigned to one or more active management roles."*
    - **Execution:** For unassigned policies, prompts high-friction confirmation and dispatches `DELETE /api/v1/managementPolicy/{id}` to `OWPROV`.
    - Non-root users do not see mutation options in the context menu.

---

## 16. Overview Sub-Tab (Aggregation Backend Integration)

The **Overview** sub-tab provides a 360-degree operational view of how the selected policy is deployed across the platform.

### 16.1 Backend Aggregation Call (`mango-mdu-service`)
To eliminate complex multi-service queries in the browser, the UI queries the aggregation backend:
```http
GET /api/v1/policy/{id}/overview HTTP/1.1
Host: <mango-mdu-host>:8080
Authorization: Bearer <jwt-token>
```
The aggregation service joins `OWPROV` MRAs, applies `OWSEC` caller visibility, matches infrastructure metadata, and returns a single pre-calculated payload. The frontend consumes this payload directly without client-side join logic.

### 16.2 UI Layout & Components

```
+-------------------------------------------------------------------+
|  USAGE SUMMARY                                                    |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|  |    Users    |  | Scoped Asgns|  | Properties  |  |  Venues   | |
|  |      9      |  |     14      |  |      4      |  |    12     | |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|                                                                   |
|  POLICY DETAILS                                                   |
|  ID: policy-uuid-5678              Scope: Entity-wide             |
|  ID: policy-uuid-5678              Scope: Global (Reusable)       |
|  Status: In Use                    Modified: 1 Sep 2026           |
|  Description: Monitor devices and manage network configuration.   |
|                                                                   |
|  USERS WITH THIS POLICY (9)                                       |
|  +-------------------------------------------------------------+  |
|  | (AS) Anita Sharma           2 assignments                   |  |
|  |      anita@ipnx.example     [Sunrise Apartments - All]      |  |
|  |                             [Oakwood Housing - Building A]  |  |
|  +-------------------------------------------------------------+  |
|  | (DO) David Okafor           1 assignment                    |  |
|  |      david@ipnx.example     [Sunrise Apartments - Tower B]  |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
```

1. **Usage Summary Mini-Cards:**
   - **Users:** Total distinct operators assigned this policy.
   - **Scoped Assignments:** Total active MRAs referencing this policy.
   - **Properties:** Distinct count of organizational entities bound to this policy.
   - **Venues:** Distinct count of physical venues bound to this policy.
2. **Policy Details Section:**
   - Identifier, Scope classification (`Entity-wide` vs. property-specific), Status badge (`In Use` [Green] vs. `Unassigned` [Gray]), Last modified timestamp, and Description.
   - Identifier, Scope classification (`Global`), Status badge (`In Use` [Green] vs. `Unassigned` [Gray]), Last modified timestamp, and Description.
   - *(Note: In accordance with §12.1, all policies are global, reusable blueprints; physical infrastructure scope—entity-wide or venue-specific—belongs strictly to the individual assignment rows in the roster below).*
3. **"Users with this policy" Roster Table:**
   - Interactive list displaying all operators holding this policy.
   - Each row shows:
     - Avatar circle with uppercase 2-letter initials fallback.
     - Full Name (bold) and Email (muted).
     - Scoped Assignments count badge (e.g. `"2 assignments"`).
     - Direct Infrastructure Scope Badges indicating physical boundaries (e.g. `[Sunrise Apartments - All venues]`, `[Oakwood Housing - Building A]`).

---

## 17. Permissions Sub-Tab (Resource Permissions Configuration)

The **Permissions** sub-tab provides visual inspection and root-only editing of the policy's operational rules across all system resources.

```
+-------------------------------------------------------------------+
|  POLICY METADATA                                                  |
|  Policy Name *                                                    |
|  [ Network Operator                                           ]   |
|  Description                                                      |
|  [ Monitor devices and manage network configuration.          ]   |
|  ---------------------------------------------------------------  |
|  PERMISSIONS CONFIGURATION                                        |
|  Policy preset                                                    |
|  [ Custom                                                   v ]   |
|                                                                   |
|  Resource Permissions                                             |
|  +-------------------------------------------------------------+  |
|  | Resource        | Assigned Permissions (Actions)            |  |
|  |-----------------+-------------------------------------------|  |
|  | Entity          | [ READ x ]                                |  |
|  | Venue           | [ READ x ]                                |  |
|  | Configuration   | [ READ x ] [ CREATE x ] [ MODIFY x ]      |  |
|  | Inventory       | [ READ x ] [ MODIFY x ]                   |  |
|  | Operator        | [ READ x ]                                |  |
|  | Subscriber      | (No permissions selected)                 |  |
|  | Contact         | [ READ x ]                                |  |
|  | Location        | [ READ x ]                                |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  (i) Policy impact: 9 users across 14 scoped assignments will be  |
|      affected by permission changes.                              |
|                                                                   |
|  [ Cancel ]                                       [ Save policy ] |
+-------------------------------------------------------------------+
```

### 17.1 Policy Metadata Editing Fields (Root Only)
When edit mode is triggered by a `root` operator (via the `...` context menu `Edit Policy` or directly within the Permissions tab), the top section renders editable input controls for policy metadata:
1. **`Policy Name *` (Required):**
   - Text input, initialized with `policy.name`.
   - Minimum 1 character, maximum 128 characters.
   - Validation: Required field; cannot be empty or whitespace only.
2. **`Description` (Optional):**
   - Multi-line textarea, initialized with `policy.description || ''`.
   - Maximum 256 characters.

In standard **View Mode** (for non-root operators or prior to entering edit mode), Policy Name and Description are rendered statically in the split panel header and Overview tab, while the Permissions tab displays the read-only permissions list without form input controls or action buttons.

### 17.2 Canonical 8 System Resources
The permissions map strictly across the canonical 8 OpenWifi resources defined in `owprov-ui` (`CreatePolicyModal.tsx`):
1. **`Entity` (`entity`):** Customer properties and organizational roots.
2. **`Venue` (`venue`):** Physical subdivisions and venues.
3. **`Configuration` (`configuration`):** Device and network configurations. *(Note: Configuration profile handling is managed in the Configuration module; this row represents all configuration management).*
4. **`Inventory` (`inventory`):** Physical devices, gateways, access points, and switches.
5. **`Operator` (`operator`):** Platform administrative accounts and operator profiles.
6. **`Subscriber` (`subscriber`):** End-user residents, captive portals, and guest Wi-Fi.
7. **`Contact` (`contact`):** Administrative and technical contacts.
8. **`Location` (`location`):** Physical addresses and geo-coordinates.

### 17.3 Backend-Authoritative Policy Requests & Action Token Alignment
The frontend implements no client-side permission logic, permission semantics, or authorization rules. The UI treats `entries` strictly as a structured data payload (`resources` and `access` action strings), dispatching creation and update requests directly to `OWPROV`.
- **Direct Action Token Mapping:** Matching `ra-wlan-cloud-owprov-ui` (`ResourcePermissionInput`), each resource allows selecting operational action tokens: `['READ', 'CREATE', 'MODIFY', 'DELETE', 'FULL']`.
- **No Client-Side Permission Semantics or Normalization:** The UI does not evaluate, normalize, or simulate effective privileges (e.g. interpreting whether `MODIFY` covers `READ` or `CREATE`, or restricting `FULL` to a separate mode). Actions are passed directly in the payload as selected, and the `OWPROV` daemon is authoritatively responsible for parsing, validating, normalizing, and enforcing all permission semantics.

### 17.4 Preset Base Dropdown
The dropdown offers standard starting configurations:
- **`Full Access`:** Configures all 8 resources with `['FULL']`.
- **`Read Only`:** Configures all 8 resources with `['READ']`.
- **`Custom`:** Permits custom resource and action selections.

### 17.5 Policy Impact Banner & Root Mutation Flow
- **Impact Callout:** Displays real-time assignment impact:
  > *"Policy impact: [X] users across [Y] scoped assignments will be affected by permission changes."*
- **Authorization Guard:** For non-root users, metadata fields are non-editable, action tag controls are disabled (`readOnly: true`), and footer action buttons are hidden.
- **Root Mutation Flow:**
  - `root` operators can edit `name`, `description`, select presets, and select/remove action tags per resource.
  - Clicking **`Cancel`** reverts all form fields (`name`, `description`, `entries`) back to their cached `policy` values and exits edit mode.
  - Clicking **`Save policy`** validates fields and dispatches `PUT /api/v1/managementPolicy/{id}` to `OWPROV` with:
    ```json
    {
      "name": "Network Operator",
      "description": "Updated device and network monitoring permissions",
      "entries": [
        {
          "resources": ["configuration", "inventory"],
          "access": ["READ", "CREATE", "MODIFY"]
        }
      ]
    }
    ```
  - On success: invalidates `['managementPolicies']`, `['managementPolicy', id]`, and `['policyOverview', id]`, displays a success toast (`"Policy [Name] updated successfully"`), updates the panel header with the new name and description, and exits edit mode.

---

## 18. Create Policy Workflow (Root-Only Console)

The top-level `+ Create policy` button in the application header provides direct policy creation.

### 18.1 Visibility & Access Control
- The `+ Create policy` button is **strictly visible and enabled for `root` operators** (`userRole === 'root'`).
- For non-root operators, the button is hidden from the header.
- Upstream `OWPROV` authoritatively verifies caller role; attempts by non-root users to dispatch creation requests are rejected with `403 Forbidden`.

### 18.2 Modal Form Specifications
1. **`Policy Name *` (Required):**
   - Text input, placeholder `"e.g., Tier 2 Support"`.
   - Minimum 1 character, maximum 128 characters.
2. **`Description` (Optional):**
   - Textarea describing operational boundaries.
3. **`Preset Selector`:**
   - Dropdown options: `Custom` (default), `Full Access`, `Read Only`.
4. **`Resource Permissions Configuration`:**
   - Multi-action tag selector across canonical 8 resources, supporting action tags (`READ`, `CREATE`, `MODIFY`, `DELETE`, `FULL`) matching `owprov-ui` (`ResourcePermissionInput.tsx`), initialized according to selected preset.

### 18.3 Submission Endpoint & Payload
- **Target Endpoint:** `POST /api/v1/managementPolicy/0`
  > [!NOTE]
  > In `OWPROV`, the path parameter on `POST /api/v1/managementPolicy/{id}` is ignored by the backend daemon. Sending `0` by convention is standard across OpenWifi microservices.
- **Request Body:**
  ```json
  {
    "name": "Tier 2 Network Operations",
    "description": "Operator policy for regional field support",
    "entity": "",
    "venue": "",
    "entries": [
      {
        "resources": ["entity", "venue", "inventory", "configuration"],
        "access": ["READ", "CREATE", "MODIFY"]
      },
      {
        "resources": ["operator", "subscriber", "contact", "location"],
        "access": ["READ"]
      }
    ]
  }
  ```
- **Legacy Scope Fields:** `"entity": ""` and `"venue": ""` remain empty strings in creation payloads. Policies are global and scope-independent templates; physical boundary scoping is applied when assigning the policy to an operator via an MRA.
- **Lifecycle on Success:**
  1. `OWPROV` returns the created `ManagementPolicy` record.
  2. UI invalidates `['managementPolicies']`.
  3. Displays success toast: `"Policy [Name] created successfully."`
  4. Automatically selects the new policy in the catalog and displays its details.

---

## 19. Authoritative REST API Contracts for Policies

> [!IMPORTANT]
> **Source-Verified Contract Assurance:**  
> The `OWPROV` contracts below are verified directly against `ra-wlan-cloud-owprov` C++ daemon source code (`RESTAPI_managementPolicy_handler.cpp`, `RESTAPI_managementPolicy_list_handler.cpp`) and official OpenAPI definitions (`owprov.yaml`). The `mango-mdu-service` Overview contract defines the exact composite schema to be consumed by the UI.

### 19.1 OWPROV Management Policy APIs

#### 19.1.1 Get All Management Policies
```http
GET /api/v1/managementPolicy?offset={offset}&limit={limit} HTTP/1.1
Host: <owprov-host>:9005
Authorization: Bearer <jwt-token>
```

> [!NOTE]
> `OWPROV` defaults `limit = 100` if omitted. Client data hooks pass `limit=500` (via batch ingestion loop `getAllPolicies()`) to ensure complete, non-truncated retrieval.

**Response (`200 OK`):**
```json
{
  "managementPolicies": [
    {
      "id": "policy-001",
      "name": "Admin",
      "description": "Administrative access within assigned role scope",
      "entity": "",
      "venue": "",
      "inUse": ["mra-001", "mra-002"],
      "created": 1725000000,
      "modified": 1725500000,
      "entries": [
        {
          "resources": [
            "entity",
            "venue",
            "configuration",
            "inventory",
            "operator",
            "subscriber",
            "contact",
            "location"
          ],
          "access": ["FULL"]
        }
      ]
    }
  ]
}
```

#### 19.1.2 Create Management Policy (Root Only)
```http
POST /api/v1/managementPolicy/0 HTTP/1.1
Host: <owprov-host>:9005
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Field Technician Tier 1",
  "description": "Inventory and venue read/modify permissions",
  "entity": "",
  "venue": "",
  "entries": [
    {
      "resources": ["inventory", "venue"],
      "access": ["READ", "MODIFY"]
    }
  ]
}
```
**Response (`200 OK`):** Created `ManagementPolicy` JSON object.

#### 19.1.3 Update Management Policy (Root Only)
```http
PUT /api/v1/managementPolicy/{id} HTTP/1.1
Host: <owprov-host>:9005
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Field Technician Tier 1",
  "description": "Updated technician permissions",
  "entries": [
    {
      "resources": ["inventory", "venue"],
      "access": ["READ", "CREATE", "MODIFY"]
    }
  ]
}
```
**Response (`200 OK`):** Updated `ManagementPolicy` JSON object.

#### 19.1.4 Delete Management Policy (Root Only)
```http
DELETE /api/v1/managementPolicy/{id} HTTP/1.1
Host: <owprov-host>:9005
Authorization: Bearer <jwt-token>
```
**Response (`200 OK`):** Empty response body (calls `OK()`).  
*If policy is in use, returns `400 Bad Request` with `StillInUse` error.*

---

### 19.2 Aggregation Backend API (`mango-mdu-service`)

#### 19.2.1 Get Policy Overview Summary
```http
GET /api/v1/policy/{id}/overview HTTP/1.1
Host: <mango-mdu-host>:8080
Authorization: Bearer <jwt-token>
```
**Response (`200 OK`):**
```json
{
  "policy": {
    "id": "policy-001",
    "name": "Network Operator",
    "description": "Monitor devices and manage network configuration.",
    "entity": "",
    "venue": "",
    "created": 1725000000,
    "modified": 1725500000
  },
  "totalUsers": 9,
  "totalScopedAssignments": 14,
  "totalProperties": 4,
  "totalVenues": 12,
  "usersWithPolicy": [
    {
      "id": "user-uuid-1",
      "name": "Anita Sharma",
      "email": "anita@ipnx.example",
      "userRole": "noc",
      "avatar": "1",
      "scopedAssignmentsCount": 2,
      "scopes": [
        {
          "entityId": "entity-uuid-1",
          "entityName": "Sunrise Apartments",
          "venueId": "",
          "venueName": "All venues"
        },
        {
          "entityId": "entity-uuid-2",
          "entityName": "Oakwood Housing",
          "venueId": "venue-uuid-001",
          "venueName": "Building A"
        }
      ]
    }
  ]
}
```

---

## 20. Frontend Data Structures & Type Definitions (Policies)

```typescript
// ==========================================
// OWPROV Policy Types
// ==========================================

export type CanonicalResource =
  | 'entity'
  | 'venue'
  | 'configuration'
  | 'inventory'
  | 'operator'
  | 'subscriber'
  | 'contact'
  | 'location';

export type PolicyAccessVerb = 'READ' | 'CREATE' | 'MODIFY' | 'DELETE' | 'FULL';

export interface PolicyEntry {
  resources: CanonicalResource[];
  access: PolicyAccessVerb[];
}

export interface ManagementPolicy {
  id: string;
  name: string;
  description: string;
  entity: string; // Legacy OWPROV schema field: always empty ("") as policies are global, scope-independent templates
  venue: string;  // Legacy OWPROV schema field: always empty ("") as policies are global, scope-independent templates
  entries: PolicyEntry[];
  inUse?: string[];
  tags?: string[];
  created?: number;
  modified?: number;
}

export interface CreateManagementPolicyPayload {
  name: string;
  description?: string;
  entity: string; // Legacy OWPROV schema field: sent as "" (scope is bound dynamically via MRAs)
  venue: string;  // Legacy OWPROV schema field: sent as "" (scope is bound dynamically via MRAs)
  entries: PolicyEntry[];
}

export interface UpdateManagementPolicyPayload {
  name?: string;
  description?: string;
  entries?: PolicyEntry[];
}

// ==========================================
// Aggregation Backend (Overview) Types
// ==========================================

export interface UserPolicyScopeInfo {
  entityId: string;
  entityName: string;
  venueId: string;
  venueName: string;
}

export interface UserWithPolicySummary {
  id: string;
  name: string;
  email: string;
  userRole: string;
  avatar?: string;
  scopedAssignmentsCount: number;
  scopes: UserPolicyScopeInfo[];
}

export interface PolicyOverviewSummary {
  policy: {
    id: string;
    name: string;
    description: string;
    entity: string;
    venue: string;
    created: number;
    modified: number;
  };
  totalUsers: number;
  totalScopedAssignments: number;
  totalProperties: number;
  totalVenues: number;
  usersWithPolicy: UserWithPolicySummary[];
}
```

---

## 21. Acceptance Criteria & QA Test Scenarios (Policies Tab)

### 21.1 Catalog Listing & Search
- **TC-POL-001 (Catalog Ingestion & Completeness):** Verify data fetching executes with `limit=500` (via batch ingestion loop `getAllPolicies`), ingesting 100% of policies without silent truncation at `OWPROV`'s default 100-record boundary.
- **TC-POL-002 (Search Filtering):** Enter search text matching policy name or description. Verify debounced real-time table filtering.
- **TC-POL-003 (KPI Metrics Calculation):** Verify `Total Policies` accurately calculates directly from the count of items in the `managementPolicies` array.

### 21.2 Overview Aggregation Integration
- **TC-POL-004 (Overview Aggregation Query):** Select policy row. Verify `GET /api/v1/policy/{id}/overview` loads summary mini-cards and the "Users with this policy" roster table.
- **TC-POL-005 (Roster Scope Badges):** Verify each user in the overview roster renders their assigned property and venue badges correctly.

### 21.3 Permissions Configuration & Lifecycle
- **TC-POL-006 (Permissions Rendering):** Open Permissions sub-tab. Verify 8 canonical resources render matching backend `entries` with their assigned action tags.
- **TC-POL-007 (Root Mutation Enforcement):** Log in as non-root operator. Verify `+ Create policy` button is hidden and permission edit controls are disabled.
- **TC-POL-008 (In-Use Policy Deletion Guard):** Attempt to delete a policy with active assignments. Verify delete button is disabled with tooltip, and backend rejects with `400 Bad Request` (`StillInUse`).
- **TC-POL-009 (Create Policy Success):** Log in as `root`. Open `+ Create policy`, fill name and permissions, submit. Verify `POST /api/v1/managementPolicy/0` executes and adds policy to catalog.
- **TC-POL-010 (Edit Policy Metadata & Permissions):** Log in as `root`. From the `...` context menu, select `Edit Policy`. Modify Policy Name and Description, update resource action tags, and click `Save policy`. Verify `PUT /api/v1/managementPolicy/{id}` dispatches updated `name`, `description`, and `entries`, updates split panel header text and catalog table rows, and returns to view mode.

---

# Part 3: Configuration Profiles Tab Specification

---

## 22. Domain Model & VariableBlock Architecture

The Configuration Profiles module manages reusable, section-level configuration building blocks by interfacing directly with the `OWPROV` microservice (`/api/v1/variable`).

```
+---------------------------------------------------------------------------------------------------+
|                                        Browser Client                                             |
|                                     (mango-operator-ui)                                           |
+---------------------------------------------------------------------------------------------------+
                                                 |
                                Direct REST (JWT Bearer)
                                axiosProv (/api/v1/variable)
                                                 |
                                                 v
                               +-----------------------------------+
                               |              OWPROV               |
                               |          (VariableBlocks)         |
                               +-----------------------------------+
                               | • Variable Blocks (variables2)    |
                               | • Scoped Bindings (entity, venue) |
                               | • Variable items (prefix, value)  |
                               | • Membership (configurations[])   |
                               | • Dynamic APConfig compilation    |
                               +-----------------------------------+
```

### 22.1 Product-to-Backend Architecture
1. **Direct Mapping to `VariableBlock`:** Configuration Profiles in the MDU UI are explicitly the product-facing manifestation of OWPROV `VariableBlock` entities (`variables2` database table). The UI introduces no separate intermediate metadata store.
2. **Scope Hierarchy & Field Coexistence (`entity` vs `venue`):**
   - In OWPROV's hierarchy, every Venue is organized under a parent Entity (Property).
   - **Property-Scoped Profile:** Authored with `entity` set to the Property UUID, while `venue` remains empty string `""`. Accessible to Configurations authored for that Property and its Venues.
   - **Venue-Scoped Profile:** Authored with `venue` set to the target Venue UUID, and `entity` set to the parent Property UUID. A Venue-scoped Profile is visible and selectable **strictly and exclusively inside that specific Venue (`venue === config.venue`)**. It is **never** inherited by or visible to child venues.
3. **Scope Eligibility for Profile References:**
   - When an operator authors or edits a Configuration, the UI strictly enforces scope eligibility in the Profile selector dropdown:
     - **Property Configuration:** Can only reference Profiles scoped to that Property (`entity === config.entity && (!venue || venue === "")`).
     - **Venue Configuration:** Can reference Profiles scoped strictly to that specific Venue (`venue === config.venue`) or shared from its parent Property (`entity === config.entity && (!venue || venue === "")`). It cannot reference profiles belonging to other Venues (neither child nor sibling Venues).
     - **Cross-Property Isolation:** Profiles belonging to different Properties are filtered out and cannot be selected.
4. **Wire Format Structure:** A `VariableBlock` encapsulates common metadata (`name`, `description`, `entity`, `venue`) and an array of variable items:
   ```json
   {
     "name": "Corporate 5G Radio Profile",
     "description": "Standard 5GHz high-density RF configuration",
     "entity": "00000000-0000-0000-0000-000000000001",
     "venue": "",
     "variables": [
       {
         "prefix": "radio",
         "type": "json",
         "weight": 100,
         "value": { ... }
       }
     ]
   }
   ```
5. **Dynamic Compilation via `APConfig`:** Profiles are resolved dynamically when generating live configurations or rendering configuration previews via OWPROV's `APConfig` compiler. Updating a Profile updates the underlying `VariableBlock`; this change is immediately reflected in subsequent device configuration generation without pushing changes live until explicitly deployed over `OWGW`.

### 22.2 Operator UX Streamlining & Clutter Suppression
To eliminate UI cognitive overload and provide an operator-first management experience:
1. **Suppression of Raw Internal Metadata:** The Profile Editor and Profile Catalog suppress internal database artifacts including raw Variable UUID strings, raw section prefixes, JSON type tags, internal weight numbers, and redundant backend status cards.
2. **Context-Aware Deletion Dialogs:** Redundant sub-tabs (such as separate "Referencing Configurations" read-only tables) are eliminated from the Profile Editor in favor of unified, contextual dependency dialogs triggered during deletion attempts.
3. **Optimized Table Performance:** The "Referenced By" column is omitted from the main Profile catalog table to prevent expensive fleet-wide reverse graph traversals on table load.

---

## 23. Supported Configuration Profile Types & Wire Schemas

The UI provides tailored form builders, validation rules, default states, and wire serializers for eight (8) foundational profile sections:

### 23.1 Radio Profile (`radio`)
* **Section Prefix:** `radio`
* **Form Builder Component:** `src/pages/Configuration/components/RadioSection.tsx`
* **Type Definition:** `src/pages/Configuration/types/radio.ts`
* **Configurable Parameters:**
  * **General Parameters:**
    * `band` (string, required): `2G` | `5G` | `5G-lower` | `5G-upper` | `6G` | `HaLow`
    * `bandwidth` (number, required): `5` | `10` | `20`
    * `country` (string, required): Two-letter ISO country code (e.g. `US`, `DE`)
    * `channel-mode` (string, required): `HT` | `VHT` | `HE` | `EHT`
    * `channel-width` (number, required): `20` | `40` | `80` | `160`
    * `channel` (string / number[]): Dynamic `auto` or explicit static channels (e.g., `[36]`)
    * `mimo` (string, optional): `1x1` | `2x2` | `3x3` | `4x4` | `8x8`
    * `tx-power` (number, optional): Transmit power in dBm (0 = driver default)
    * `legacy-rates` (boolean, optional): Toggle legacy 802.11b/g rates
    * `max-clients` (number, optional): Max associated stations on radio
    * `multiple-bssid` (boolean, optional): Enable Multiple BSSID (MBSSID)
  * **Advanced Parameters:**
    * `allow-dfs` (boolean, optional): Allow radar DFS channels
    * `beacon-rate` (number, optional): Beacon transmission rate
    * `beacon-interval` (number, optional): Beacon interval in Time Units (default: 100)
    * `multicast-rate` (number, optional): Multicast frames transmission rate
    * `ema` (boolean, optional): Enhanced Multi-BSSID Advertisement
    * `bss-color` (number, optional): 802.11ax BSS coloring identifier (1–63)
    * `require-mode` (string, optional): Restrict associations to PHY mode (`HT`, `VHT`, `HE`)
    * `hostapd-iface-raw` (string[], optional): Custom raw hostapd directives passed directly to the driver

### 23.2 SSID Profile (`interface.ssid`)
* **Section Prefix:** `interface.ssid`
* **Configurable Parameters:**
  * `name` (string, required): Broadcast wireless network name (SSID)
  * `bss-mode` (string, required): `ap` | `mesh` | `wds-ap` | `wds-sta`
  * `wifi-bands` (string[], required): Subset of `["2G", "5G", "6G"]`
  * `encryption` (object, required):
    * `proto` (string): `psk` | `psk2` | `sae` | `sae-mixed` | `wpa2` | `wpa3` | `wpa3-mixed` | `none`
    * `key` (string, optional): Pre-Shared Key (8–63 ASCII characters)
    * `ieee80211w` (string, optional): `disabled` | `optional` | `required`
  * `hidden-ssid` (boolean, optional): Suppress SSID broadcasting
  * `isolate-clients` (boolean, optional): Client L2 intra-BSS isolation
  * `power-save` (boolean, optional): Power save optimizations
  * `purpose` (string, optional): `guest` | `employee` | `onboarding`
  * `maximum-clients` (number, optional): Station connection limit
  * `dtim-period` (number, optional): Delivery Traffic Indication Message period
  * `rate-limit` (object, optional): `ingress-rate` and `egress-rate` in kbps
  * `roaming` (object, optional): 802.11r (FT), 802.11k (RRM), and 802.11v (BSS Transition)

### 23.3 IPv4 Network Profile (`interface.ipv4`)
* **Section Prefix:** `interface.ipv4`
* **Form Builder Component:** `src/pages/Configuration/components/Ipv4Section.tsx`
* **Type Definition:** `src/pages/Configuration/types/ipv4.ts`
* **Configurable Parameters:**
  * `addressing` (string, required): `static` | `dhcp`
  * `subnet` (string, required for static): Subnet in CIDR format (e.g., `192.168.1.1/24`)
  * `gateway` (string, optional): Gateway IPv4 address
  * `dhcp` (object, optional): Local DHCP pool configuration:
    * `lease-first` (number): Start offset
    * `lease-count` (number): Total IP count
    * `lease-time` (string): Duration (e.g. `12h`)
    * `dns` (string[]): Primary/secondary DNS servers
  * `static-leases` (object[], optional): Fixed IP reservations (`mac`, `ip`, `name`)
  * `port-forward` (object[], optional): Port forwardings (`protocol`, `external-port`, `internal-ip`, `internal-port`) managed via `PortForwardingModal.tsx`
  * `nat` (boolean, optional): Enable SNAT masquerading

### 23.4 Enterprise & Local RADIUS Profile (`interface.ssid.radius`)
* **Section Prefix:** `interface.ssid.radius`
* **Form Builder Component:** `src/pages/Configuration/components/RadiusSection.tsx`
* **Type Definition:** `src/pages/Configuration/types/radius.ts`
* **Configurable Parameters:**
  * **Authentication Server:** `host` (string, required), `port` (number, default: 1812), `secret` (string, required), `mac-filter` (boolean, optional)
  * **Accounting Server:** `enable` (boolean), `host` (string, optional), `port` (number, default: 1813), `secret` (string, optional)
  * **Dynamic Authorization (CoA/DM):** `enable` (boolean), `host` (string, optional), `port` (number, default: 3799), `secret` (string, optional)
  * **General Settings:** `nas-identifier` (string, optional), `chargeable-user-id` (boolean, optional)
  * **Local RADIUS Server (`local-radius`):** `server-identity` (string, optional), embedded user credential database (`mac`, `username`, `password`, `vlan-id`) managed via `RadiusUsersModal.tsx`

### 23.5 VLAN Profile (`interface.vlan`)
* **Section Prefix:** `interface.vlan`
* **Configurable Parameters:** `vlan-id` (number, 1–4094, required), `description` (string, optional), `isolate` (boolean, optional)

### 23.6 Network Tunnel Profile (`interface.tunnel`)
* **Section Prefix:** `interface.tunnel`
* **Configurable Parameters:** `proto` (`vxlan` | `l2tp` | `gre`, required), `peer-address` (string, required), `peer-port` (number, optional), `server` (boolean, optional), `credentials` (username, password), `healthcheck` (interval, target)

### 23.7 Captive Portal Profile (`interface.captive`)
* **Section Prefix:** `interface.captive`
* **Form Builder Component:** `src/pages/Configuration/components/CaptivePortalSection.tsx`
* **Type Definition:** `src/pages/Configuration/types/captive.ts`
* **Configurable Parameters:**
  * `auth-mode` (string, required): `click-to-continue` | `credentials` | `radius` | `external`
  * Context-specific fields dynamically rendered based on `auth-mode`:
    * `portal-url` (string, required for `external`)
    * `walled-garden` (string[], optional): Pre-auth domains/IPs
    * `session-timeout` (number, optional) & `idle-timeout` (number, optional)
    * `redirect-url` (string, optional)

### 23.8 Passpoint / OpenRoaming Profile (`interface.ssid.openroaming`)
* **Section Prefix:** `interface.ssid.openroaming`
* **Form Builder Component:** `src/pages/Configuration/components/PassPointSection.tsx`
* **Type Definition:** `src/pages/Configuration/types/passpoint.ts`
* **Configurable Parameters:** `venue-name`, `venue-url`, `venue-group`, `venue-type`, `auth-type`, `domain-name` (string[]), `anqp-domain` (number), `roaming-consortium` (string[] RCOIs), `wan-metrics` (object)

### 23.9 Sensitive Credential Handling & Masking Policy
To ensure that operational security boundaries are strictly maintained across all Configuration Profile types:
* **Masked Display:** Inputs for sensitive fields (including RADIUS shared secrets, local user passwords, and Wi-Fi pre-shared keys) must be rendered using masked controls (`type="password"`) equipped with an explicit visibility toggle button.
* **Masked Summary Views:** Credentials must never be rendered in plaintext in table cells, inspection drawers, or summary cards.
* **Telemetry & Log Isolation:** Sensitive values must be strictly excluded from browser console logging, analytics payloads, and URL query strings.
* **Explicit Handling States on Edit:**
  1. *Unchanged (Preserved):* When loading a Profile from OWPROV via `GET /api/v1/variable/{id}`, the existing secret is held in component state while the form field renders a masked placeholder (`••••••••`). If the operator does not edit this field, the existing secret value is preserved in the submission payload without requiring re-entry.
  2. *Replaced (Modified):* If the operator enters a new credential, the input masks the typed characters, and the new plaintext value replaces the old secret in the `PUT /api/v1/variable/{id}` payload.
  3. *Cleared (Omitted):* If the operator disables authentication or switches to an unauthenticated mode (e.g. changing encryption to `Open` or turning off RADIUS accounting), the secret property is completely stripped from the JSON payload.

---

## 24. Configuration Profiles Catalog Table & Management

### 24.1 Column Specifications
The Profile catalog table renders the following fields:
* **Profile Name:** Clickable link navigating to `/configuration/profiles/:id` for full viewing and editing.
* **Description:** Freeform explanatory text.
* **Scope Badge:** Visual pill badge indicating whether the profile is Property-scoped (`entity`) or Venue-scoped (`venue`).
* **Section Type:** Formatted section badge (e.g., `Radio`, `SSID`, `IPv4`, `RADIUS`, `Captive Portal`).
* **Last Modified:** Relative timestamp formatted using standard platform formatting.
* **Actions:** Context menu (`...`) offering View, Edit, Duplicate, and Delete actions.

> [!NOTE]
> **Performance Optimization:** The "Referenced By" column is omitted from the table view. Computing reverse configuration dependencies across all profiles requires multi-query relational graph queries, which severely degrades initial table rendering at scale.

### 24.2 Dependency-Safe Deletion Guard
Deleting a Profile leverages native OWPROV `VariableBlock` lifecycle checks:
* If `variableBlock.configurations` contains one or more configuration UUIDs, deletion is blocked by the UI with a detailed modal listing the blocking Configurations.
* If a deletion request reaches the backend while references remain in `configurations`, OWPROV authoritatively rejects the request with `400 Bad Request` and error code `StillInUse` (`RESTAPI::Errors::StillInUse`).

---

## 25. Profile Authoring & Editing Workflows

### 25.1 Create Profile Modal (`CreateProfileModal.tsx`)
1. User clicks `+ Create Profile`.
2. Form collects:
   - **Scope Selection:** Radio button choosing Property (`entity`) or Venue (`venue`), with corresponding searchable entity/venue dropdowns.
   - **Profile Name:** String (min 1, max 64 characters).
   - **Description:** Optional string.
   - **Section Type:** Dropdown selector selecting one of the 8 supported section types.
3. Once section type is selected, the modal dynamically mounts the matching section form builder.
4. On submission, the form builds the structured variable JSON using section-specific builders (e.g., `buildOwprovRadio`), packages the `VariableBlockApiResponse` payload, and executes `POST /api/v1/variable/0`.

### 25.2 Profile Editor Page (`ProfileEditorPage.tsx`)
* Dedicated route `/configuration/profiles/:id`.
* Loads the profile record via `GET /api/v1/variable/{id}?withExtendedInfo=true`.
* Provides structured breadcrumbs: `Configuration` → `Profiles` → `<Profile Name>`.
* Renders the clean section form builder, omitting low-level registry clutter.
* Form dirty tracking detects unsaved changes and prompts before navigation.
* **Pre-Save Impact Confirmation Workflow:**
  * When saving an existing Profile, the UI checks its `configurations` array.
  * If `configurations.length > 0`, the UI intercepts the save action and opens an **Impact Confirmation Dialog**.
  * The dialog displays the count and names of all referencing Configurations and queries `GET /api/v1/configuration/{id}?computedAffected=true` across those configurations to summarize potentially affected devices.
  * The dialog alerts the operator: *"Modifying this profile updates the shared configuration block in OWPROV. Referencing configurations will compile these changes on their next deployment."*
  * Upon operator confirmation, the UI executes `PUT /api/v1/variable/{id}`.

---

## 26. Authoritative REST API Contracts for Configuration Profiles

### 26.1 List Variable Blocks
* **Endpoint:** `GET /api/v1/variable`
* **Query Parameters:**
  * `withExtendedInfo=true` (boolean, required): Ingests entity/venue name associations and configuration membership.
  * `limit=500` (number): Maximum records per batch.
  * `offset=0` (number): Pagination offset.
* **Batch Ingestion Contract:** To guarantee fleet-wide data completeness, the UI executes an iterative ingestion loop (`getAllVariableBlocks`), fetching subsequent pages until all records are retrieved without silent boundary truncation.
* **Response `200 OK`:**
  ```json
  {
    "variableBlocks": [
      {
        "id": "39d0617b-5d1d-4eb9-a720-6d43e5c944eb",
        "name": "Corporate 5G Radio",
        "description": "Standard 5GHz radio baseline",
        "entity": "00000000-0000-0000-0000-000000000001",
        "venue": "",
        "created": 1697360000,
        "modified": 1697361200,
        "configurations": ["b42c67f1-857e-4054-9988-82ef1dfc0b20"],
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
              "channel": "auto"
            }
          }
        ]
      }
    ]
  }
  ```

### 26.2 Batch Variable Block Select Query
* **Endpoint:** `GET /api/v1/variable?select=uuid1,uuid2`
* **Description:** Retrieves specific `VariableBlock` records by UUID in a single request.
* **Response `200 OK`:**
  ```json
  {
    "variableBlocks": [
      {
        "id": "uuid1",
        "name": "Guest Captive Portal",
        "variables": [{ "prefix": "interface.captive" }]
      }
    ]
  }
  ```

### 26.3 Create Variable Block
* **Endpoint:** `POST /api/v1/variable/0`
* **Request Body:** Partial `VariableBlockApiResponse` payload.
* **Response `200 OK`:** The created `VariableBlockApiResponse` object with generated `id`.

### 26.4 Update Variable Block
* **Endpoint:** `PUT /api/v1/variable/{id}`
* **Request Body:** Updated fields (`name`, `description`, `variables`, etc.).
* **Response `200 OK`:** Updated `VariableBlockApiResponse` object.

### 26.5 Delete Variable Block
* **Endpoint:** `DELETE /api/v1/variable/{id}`
* **Response `200 OK`:** Empty object `{}` indicating successful deletion.
* **Response `400 Bad Request` (StillInUse):**
  ```json
  {
    "ErrorCode": 400,
    "ErrorText": "Still in use"
  }
  ```

---

## 27. Frontend Data Structures & Type Definitions (Profiles)

```typescript
export interface VariableItem {
  prefix: string;
  type: string;
  value: string | Record<string, unknown>;
  weight: number;
}

export interface VariableBlockApiResponse {
  id: string;
  name: string;
  description?: string;
  created?: number;
  modified?: number;
  notes?: Array<{ note: string; created?: number; author?: string }>;
  entity?: string;
  entityName?: string;
  venue?: string;
  venueName?: string;
  subscriber?: string;
  inventory?: string;
  configurations?: string[];
  managementPolicy?: string;
  variables?: VariableItem[];
  [key: string]: unknown;
}

export interface RadioProfileFormState {
  band: '2G' | '5G' | '5G-lower' | '5G-upper' | '6G' | 'HaLow';
  bandwidth: number;
  country: string;
  channelMode: string;
  channelWidth: number;
  channel: string | number[];
  mimo: string;
  txPower: number;
  legacyRates: boolean;
  maxClients: number;
  multipleBssid: boolean;
  allowDfs: boolean;
  beaconRate: number;
  beaconInterval: number;
  multicastRate: number;
  ema: boolean;
  bssColor: number;
  requireMode: string;
  hostapdIfaceRaw: string[];
}
```

---

## 28. Acceptance Criteria & QA Test Scenarios (Configuration Profiles)

### 28.1 Profile Creation & Schema Validation
- **TC-PRF-001 (Radio Profile Creation):** Open `+ Create Profile`, select `Radio`, populate standard and advanced RF parameters, click Save. Verify `POST /api/v1/variable/0` executes with `prefix: "radio"` and correct JSON value.
- **TC-PRF-002 (RADIUS Profile Local User Management):** Open `RADIUS` profile builder. Open Local Users modal. Add 2 users (`user1`, `user2`) with MAC, passwords, and VLAN IDs. Verify table renders users, pagination works, and save payload correctly embeds `local-radius.users`.
- **TC-PRF-003 (Captive Portal Dynamic Field Rendering):** Switch auth mode between `click-to-continue`, `credentials`, and `external`. Verify portal URL input is required only for `external` mode, and walled garden list accepts valid domain strings.

### 28.2 Catalog Listing & Filtering
- **TC-PRF-004 (Catalog Ingestion):** Verify `getAllVariableBlocks` queries with `limit=500` and displays rows with name, description, scope badges, and section badges.
- **TC-PRF-005 (Scope Badging):** Verify Property-scoped profiles display the Property badge, and Venue-scoped profiles display the Venue badge.
- **TC-PRF-006 (Search & Section Filtering):** Filter by section `Radio`. Verify only Radio profiles render in table. Search by profile name string. Verify real-time debounced filtering.

### 28.3 Dependency Enforcement & Deletion Safety
- **TC-PRF-007 (In-Use Deletion Guard):** Attempt to delete a profile that is referenced by a configuration (synchronized into its root `variables[]` array and reflected in `VariableBlock.configurations[]`). Verify deletion is blocked with `400 StillInUse` and the UI modal displays the blocking referencing configurations.
- **TC-PRF-008 (Unreferenced Profile Deletion):** Delete an unreferenced profile. Verify `DELETE /api/v1/variable/{id}` completes and removes row from table.
- **TC-PRF-009 (Pre-Save Impact Preview):** Edit an in-use profile referenced by multiple configurations. Click Save. Verify the Impact Confirmation Dialog opens displaying the referencing configuration names and affected device count before `PUT /api/v1/variable/{id}` is dispatched.
- **TC-PRF-010 (RADIUS Secret Masking & Preservation):** Open an existing RADIUS profile in the editor. Verify the shared secret field renders masked (`type="password"` with visibility toggle). Save the form without modifying the secret field. Verify the existing secret value is preserved in the submission payload.

---

# Part 4: Modular Configurations Tab Specification

---

## 29. Domain Model & Modular Configuration Architecture

Modular Configurations represent composite device configuration payloads authored in `OWPROV` (`/api/v1/configuration`).

```
+---------------------------------------------------------------------------------------------------+
|                                        Modular Configuration                                      |
+---------------------------------------------------------------------------------------------------+
| • Name: "Building A Access Layer"                                                                 |
| • Scope: Entity (Property) or Venue UUID                                                          |
| • variables[]: ["uuid-radio-profile", "uuid-ssid-profile"]                                        |
| • configuration[]:                                                                                |
|     ├── Section 1: "radio" -> {"__variableBlock": ["uuid-radio-profile"]}                        |
|     ├── Section 2: "interface.ssid" -> {"__variableBlock": ["uuid-ssid-profile"]}                |
|     └── Section 3: "interface.ipv4" -> { addressing: "dhcp", nat: true }                          |
+---------------------------------------------------------------------------------------------------+
```

### 29.1 Section Modular Composition
A Modular Configuration consists of:
* Top-level metadata (`name`, `description`, `deviceTypes`). Note: `deviceGroup` may optionally be included in creation payloads as a schema validation hint, but is not persisted or returned by OWPROV.
* Scope assignment (`entity` for Property, or `venue` for Venue).
* Array of configuration subsections (`configuration[]`), where each element contains `name`, `weight`, and `configuration`.
* Preserved root `variables[]` array containing the UUIDs of `VariableBlock` records assigned to this configuration.

### 29.2 Profile Referencing Semantics (`__variableBlock`)
When an operator links a section to a Configuration Profile:
* The section's `configuration` JSON replaces the explicit configuration dictionary with:
  ```json
  {
    "__variableBlock": ["39d0617b-5d1d-4eb9-a720-6d43e5c944eb"]
  }
  ```
* During live compilation (`APConfig`), OWPROV retrieves the `VariableBlock` by UUID, extracts its `value`, and injects it into the resolved configuration tree.

### 29.3 Lossless Configuration Editing Contract
Configurations in OWPROV can contain arbitrary sections and vendor directives beyond standard form builders. To prevent accidental data loss:
* **In-Memory Retention:** When loading an existing configuration via `GET /api/v1/configuration/{id}`, the full array of sections in `configuration[]` (including unrecognized or third-party sections) is held in memory.
* **Targeted Mutation:** When the operator edits a specific section via UI forms, only that section's payload is modified. All other sections and unrecognized properties remain untouched.
* **Raw JSON Inspection & Safe Fallback:** Operators have access to raw JSON inspection, ensuring that unmanaged or specialized sections can be inspected without data truncation.

---

## 30. Recursive Variable Block Extraction & Batch Name Resolution (Read-Only Table Presentation)

### 30.1 Deep Recursive Scanner Algorithm
In legacy, third-party, or manually edited configurations, top-level `variables[]` arrays may be empty while nested subsections contain active `__variableBlock` references.

The UI executes a deep recursive scanner (`extractVariableBlockUuids` in `src/pages/Configuration/utils/variableExtractor.ts`) strictly for read-time presentation and name resolution:
1. Traverses the entire configuration object tree, arrays, and embedded JSON strings.
2. Identifies all objects containing the key `__variableBlock`.
3. Handles both array representations (`["<uuid>"]`) and legacy string representations (`"<uuid>"`).
4. Returns a deduplicated array of all referenced VariableBlock UUIDs.

**Critical Architectural Boundary (Read-Only Table Presentation):** Recursive scanning for table presentation is strictly a **read-only client-side presentation utility** used to resolve human-readable profile names for table pills. Configuration editing separately synchronizes UI-managed Profile references with root `variables[]` while preserving unrelated dependencies. The recursive table scanner itself never mutates, replaces, or synthesizes the payload submitted on save.

### 30.2 Merge & Deduplication with Root Variables for Name Lookup
To present a comprehensive list of all referenced profiles in the Configurations table, the UI combines UUIDs extracted via recursive scanning with any UUIDs declared in `configuration.variables[]`:
```typescript
const allVarIds = Array.from(
  new Set([
    ...extractVariableBlockUuids(config.configuration),
    ...(config.variables || [])
  ])
);
```

### 30.3 Batch API Name Resolution & Error Handling
1. **Batch Query Dispatch:** The UI aggregates all unique variable UUIDs across configurations and dispatches `GET /api/v1/variable?select=uuid1,uuid2` via `getVariableBlocksSelect(ids)` to resolve human-readable Profile names.
2. **Transport / Network Error Isolation:** If the batch query fails due to transport or network issues (e.g., 5xx server errors, connection timeout, network offline), the UI does not mischaracterize referenced profiles as deleted. Instead, the UI renders a neutral fallback pill:
   - Presentation: `[Profile: <uuid>]`
   - Tooltip: *"Unable to load profile name (network/server error)"*
   - Table stability is maintained, and the configuration row remains fully interactive.
3. **Graceful Cache Fallback:** If cached or previously ingested Profile records from `getAllVariableBlocks()` are available, the UI resolves names from cache.
4. **Interactive Pill UI Presentation:** Successfully resolved profiles render as styled, interactive pills with hover tooltips showing section prefix and full Variable UUID.

---

## 31. Backend Concurrency Reality & Root Variables Preservation

### 31.1 Backend Concurrency Model (Last-Write-Wins)
* **Authoritative Backend Contract:** OWPROV's existing `PUT /api/v1/configuration/{id}` API operates strictly under a **Last-Write-Wins (LWW)** model. OWPROV does not currently evaluate HTTP conditional headers (such as `If-Match` or `ETag`), nor does it reject stale updates with `409 Conflict`.
* **Current UI Behavior:** When saving an edited Configuration, the UI dispatches the updated payload via `PUT /api/v1/configuration/{id}`. In alignment with OWPROV's current capabilities, no client-side blocking or conflict dialogs are enforced at this time; full atomic optimistic concurrency control is deferred until supported natively by the backend service.

### 31.2 Root Variables Delta Synchronization & Dependency Tracking
In accordance with OWPROV's dependency tracking model and lossless editing guarantees:
* **The OWPROV Backend Contract:** In OWPROV (`RESTAPI_configurations_handler.cpp`), reverse dependency membership (`VariableBlock.configurations[]`) is maintained strictly from the configuration's root `variables[]` array via `ManageMembership()`. OWPROV does not recursively scan inner `configuration[].configuration` schemas for `__variableBlock` during write operations.
* **The Delta Synchronization Contract:** The UI editor distinguishes pre-existing root dependencies from UI-managed profile selections, preserving independently maintained references while synchronizing user actions:
  1. **Classification of Dependencies on Load:**
     - Let $V_{\text{initial}}$ be the set of UUIDs present in root `variables[]` when the configuration is loaded from OWPROV.
     - Let $S_{\text{initial\_ui}}$ be the set of Profile UUIDs attached across UI-managed form sections at load time.
     - Any variable UUID in root `variables[]` that is not attached to a UI-managed form section ($V_{\text{independent}} = V_{\text{initial}} \setminus S_{\text{initial\_ui}}$) is classified as an **independently maintained root dependency** (e.g., custom script variable blocks, legacy bindings, or raw unmanaged sections).
  2. **Profile Attachment:** When a Profile $P$ is selected for a configuration subsection:
     - The reference is inserted into the subsection's schema: `{"__variableBlock": ["<uuid>"]}` (for AP firmware compilation in `APConfig`).
     - The Profile UUID $P$ is added to the active UI-managed selections set ($S_{\text{current\_ui}}$).
  3. **Profile Detachment / Replacement:** When a Profile $P$ is unlinked or replaced:
     - The subsection's `__variableBlock` reference is removed or updated.
     - The Profile UUID $P$ is removed from $S_{\text{current\_ui}}$ provided no other UI-managed section still references $P$.
  4. **Payload Assembly on Save:** The final root `variables[]` array submitted in `PUT /api/v1/configuration/{id}` is calculated as:
     $$V_{\text{final}} = V_{\text{independent}} \cup S_{\text{current\_ui}}$$
     This guarantees:
     - Newly attached profiles are registered in root `variables[]`, allowing OWPROV to link membership in `VariableBlock.configurations[]`.
     - Detaching a profile removes it from root `variables[]` only if it was introduced via UI form sections and is no longer used elsewhere.
     - Pre-existing or independent root dependencies ($V_{\text{independent}}$) are preserved verbatim and can never be accidentally stripped by detaching a profile in the editor.
* **Scope and Existence Safety Guards:**
  - **Pre-Save Scope Enforcement (CFG-058 / Section 22.1):** When selecting profiles in the UI editor, only profiles matching the configuration's operational boundary (same venue `venue === config.venue` or shared parent entity `entity === config.entity && !venue`) are eligible. Any cross-scope profile reference is flagged as a validation error before payload submission.
  - **Backend Existence Verification:** Per OWPROV backend validation (`RESTAPI_configurations_handler.cpp`), any variable UUID in `variables[]` that does not exist in `VariablesDB` is rejected by the backend with `400 Bad Request` (`VariableMustExist`).
* **Deletion Protection Alignment (TC-PRF-007 / CFG-009):** Synchronizing attached profile UUIDs into root `variables[]` ensures that OWPROV's `DELETE /api/v1/variable/{id}` in-use guard (`!Existing.configurations.empty() -> 400 StillInUse`) functions reliably, preventing accidental deletion of in-use profiles.

---

## 32. Configurations Catalog Table & Management

### 32.1 Column Specifications
* **Configuration Name:** Clickable link opening the configuration detail/editor modal.
* **Description:** Freeform explanatory text.
* **Scope:** Property or Venue badge showing the operational boundary.
* **Platform / Device Type:** Derived directly from `deviceTypes[0]` (e.g., AP, Switch, OLG).
* **Variables / Profiles Used:** Interactive styled pills with hover tooltips for all referenced profiles.
* **Validation State:** Badge showing configuration validity.
* **Last Modified:** Relative timestamp.
* **Actions:** Context menu (`...`) offering View, Edit, Duplicate, and Delete actions.

### 32.2 Table Search & Filtering
* Real-time search across configuration names and descriptions.
* Scope filtering across Property and Venue assignments.

---

## 33. Authoritative REST API Contracts for Modular Configurations

### 33.1 List Modular Configurations
* **Endpoint:** `GET /api/v1/configuration?withExtendedInfo=true&limit=500&offset=0`
* **Batch Ingestion Contract:** To guarantee fleet-wide data completeness, the UI executes an iterative ingestion loop (`getModularConfigurations`), collecting subsequent pages until all records are retrieved without silent truncation at the 500-record boundary.
* **Platform Category Derivation:** OWPROV does not persist or return a `deviceGroup` field. The UI derives the platform category (`ap`, `switch`, `olg`) directly from `deviceTypes[0]`.
* **Response `200 OK`:**
  ```json
  {
    "configurations": [
      {
        "id": "b42c67f1-857e-4054-9988-82ef1dfc0b20",
        "name": "Building A Standard Config",
        "description": "Standard venue configuration",
        "deviceTypes": ["ap"],
        "entity": "00000000-0000-0000-0000-000000000001",
        "venue": "11111111-1111-1111-1111-111111111111",
        "variables": ["39d0617b-5d1d-4eb9-a720-6d43e5c944eb"],
        "configuration": [
          {
            "name": "Radio Config",
            "weight": 100,
            "configuration": {
              "__variableBlock": ["39d0617b-5d1d-4eb9-a720-6d43e5c944eb"]
            }
          }
        ],
        "created": 1697360000,
        "modified": 1697361200
      }
    ]
  }
  ```

### 33.2 Create Modular Configuration
* **Endpoint:** `POST /api/v1/configuration/0`
* **Request Body:** `ModularConfigurationPayload` (Optionally includes `deviceGroup` as a temporary schema validation hint).
* **Response `200 OK`:** Created `ModularConfigurationApiResponse` object with generated `id`.

### 33.3 Update Modular Configuration
* **Endpoint:** `PUT /api/v1/configuration/{id}`
* **Request Body:** `Partial<ModularConfigurationPayload>` with preserved `variables[]` array and updated configuration sections.
* **Response `200 OK`:** Updated `ModularConfigurationApiResponse`.

### 33.4 Delete Modular Configuration
* **Endpoint:** `DELETE /api/v1/configuration/{id}`
* **Response `200 OK`:** Empty object `{}` indicating successful deletion. Automatically cleans up membership in referencing VariableBlocks.
* **Response `400 Bad Request` (StillInUse):**
  ```json
  {
    "ErrorCode": 400,
    "ErrorText": "Still in use"
  }
  ```
  * **UI Handling:** When OWPROV returns `StillInUse` (or if `inUse` is non-empty), the UI intercepts deletion and displays an error dialog: *"Configuration cannot be deleted because it is currently assigned to one or more scopes or devices. Please detach or reassign the configuration before deleting."*

### 33.5 Get Affected Devices
* **Endpoint:** `GET /api/v1/configuration/{id}?computedAffected=true`
* **Response `200 OK`:**
  ```json
  {
    "affectedDevices": ["0123456789ab", "cdef01234567"]
  }
  ```

---

## 34. Frontend Data Structures & Type Definitions (Configurations)

```typescript
export interface ModularConfigElementPayload {
  name: string;
  description?: string;
  weight: number;
  configuration: string | Record<string, unknown>;
}

export interface ModularConfigurationPayload {
  name: string;
  description?: string;
  deviceGroup?: 'ap' | 'switch' | 'olg' | string; // Optional creation hint for OWPROV schema validation
  deviceTypes: string[]; // Authoritative persisted platform type (e.g. ["ap"], ["switch"])
  deviceRules?: DeviceRulesPayload;
  notes?: Array<{ note: string }>;
  entity?: string;
  venue?: string;
  subscriber?: string;
  subscriberOnly?: boolean;
  variables?: string[];
  configuration: ModularConfigElementPayload[];
}

export interface ModularConfigurationApiResponse {
  id: string;
  name: string;
  description?: string;
  deviceTypes: string[]; // Persisted by OWPROV; UI derives platform category (e.g. 'ap', 'switch') via deviceTypes[0]
  deviceRules?: DeviceRulesPayload;
  notes?: Array<{ note: string; created?: number; author?: string }>;
  entity?: string;
  venue?: string;
  subscriber?: string;
  subscriberOnly?: boolean;
  created?: number;
  modified?: number;
  inUse?: string[];
  variables?: string[];
  configuration?: ModularConfigElementPayload[];
  tags?: string[];
}
```

---

## 35. Acceptance Criteria & QA Test Scenarios (Modular Configurations)

### 35.1 Variable Scanning & Reference Presentation
- **TC-CFG-001 (Recursive Variable Block Extraction):** Load configurations where `__variableBlock` is deeply embedded inside nested `configuration[].configuration` JSON strings and arrays. Verify `extractVariableBlockUuids` captures 100% of referenced UUIDs for table display.
- **TC-CFG-002 (Batch Name Resolution):** In Configurations table, verify `GET /api/v1/variable?select=...` is dispatched with extracted UUIDs. Verify pills render human-readable Profile names instead of raw UUIDs.
- **TC-CFG-003 (Batch Resolution Network Failure Isolation):** Mock network failure on `GET /api/v1/variable?select=...`. Verify UI catches error and renders neutral fallback pill `[Profile: <uuid>]` with tooltip *"Unable to load profile name (network/server error)"* without crashing the table.
- **TC-CFG-004 (Interactive Variable Pill Tooltip):** Hover over a rendered Profile pill. Verify tooltip displays section prefix and full Variable UUID.
- **TC-CFG-005 (Profile Scope Eligibility Enforcement in UI):** When authoring a Configuration at Venue A, verify only Profiles scoped to Venue A (`venue === config.venue`) or shared from parent Property A (`entity === config.entity && (!venue || venue === "")`) are available in the dropdown. Verify profiles belonging to other Venues (neither child nor sibling venues) and other Properties are omitted and cannot be selected.
- **TC-CFG-006 (Table Stability on Unresolved Reference):** Load a configuration referencing an unresolvable or missing VariableBlock UUID. Verify the configuration table renders row stably with a fallback representation rather than crashing.

### 35.2 Lossless Configuration Editing & Dependency Preservation
- **TC-CFG-007 (Lossless Configuration Section Preservation):** Load a configuration containing custom or unrecognized JSON sections. Edit only the Radio section and save. Verify untouched custom sections are preserved verbatim in the submitted payload.
- **TC-CFG-008 (Root Variables Preservation & Delta Synchronization on Edit):** 
  1. Load a configuration with root `variables: ["legacy-uuid-1"]` not referenced in any UI form section. Attach Profile `P1` to an SSID section and save. Verify the saved payload contains `variables: ["legacy-uuid-1", "P1"]` (unrelated legacy variable preserved, new profile delta synchronized into root array).
  2. Detach Profile `P1` from the SSID section and save. Verify `P1` is removed from root `variables[]` while `legacy-uuid-1` remains intact without being stripped.
  3. Load a configuration where `P1` exists in both root `variables[]` and an unmanaged raw section outside the UI form ($V_{\text{independent}}$). Attach and subsequently detach `P1` in the UI form. Verify `P1` remains preserved in root `variables[]` as an independently maintained dependency.
- **TC-CFG-009 (Standard Configuration Update):** Edit an existing configuration and click Save. Verify payload is submitted via `PUT /api/v1/configuration/{id}` with updated fields and `200 OK` response updates the UI.

### 35.3 Configuration Lifecycle & Impact
- **TC-CFG-010 (Configuration Creation):** Create modular configuration with name, AP device group, scope, and sections. Verify record appears in table.
- **TC-CFG-011 (Affected Devices Query):** Select configuration. Open deployment or impact modal. Verify `GET /api/v1/configuration/{id}?computedAffected=true` is called and displays accurate device count.
- **TC-CFG-012 (Configuration Deletion):** Delete an unassigned configuration. Verify `DELETE /api/v1/configuration/{id}` executes and refreshes table.
- **TC-CFG-013 (Assigned Configuration Deletion Guard):** Attempt to delete an assigned configuration (`inUse` non-empty). Verify deletion is blocked with an explanatory dialog and `StillInUse` error handling.
- **TC-CFG-014 (List Pagination Fleet Scaling):** Ingest more than 500 configurations or profiles. Verify iterative batch ingestion loops collect all records across page boundaries without silent truncation.




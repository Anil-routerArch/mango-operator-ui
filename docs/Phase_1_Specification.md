# Phase 1 Technical Specification: Users & Access Module

---

## Document Metadata

| Attribute | Value |
| :--- | :--- |
| **Document Version** | 1.0.0 |
| **Module** | Administration — Users & Access |
| **Target Codebase** | `mango-operator-ui` (React / TypeScript / TanStack Query / Vite) |
| **Reference Implementation** | `ra-wlan-cloud-owprov-ui` (`src/hooks/Network/Users.ts`, `src/hooks/Network/ManagementRoles.ts`) |
| **Downstream Microservices** | `OWSEC` (Port 9002) & `OWPROV` (Port 9005 / V1 & V2) |
| **Target Audience** | Frontend Engineers, QA Automation Engineers, Backend Integration Engineers |
| **Status** | Authoritative Normative Specification |
| **UI Design Authority** | Approved Figma Workspace (`media_1790061771415.png`, `media_1790063724718.png`, `media_1790064164851.png`) |

---

## Specification Strategy & Phasing Note

> [!IMPORTANT]
> **Tab-Wise Implementation Strategy:**  
> The Phase 1 delivery for `mango-operator-ui` is executed and specified **tab-by-tab**. Each functional tab is specified to industry standards with complete API contracts, component architecture, state machines, validation schemas, and test scenarios. Once the specification for a tab is approved, engineering implements and validates that specific tab end-to-end before proceeding to subsequent modules.
>
> In Phase 1, the **Users & Access** module contains two primary tabs:
> 1. **Users Tab:** Identity management, authentication lifecycles, user directory with search/filters/pagination, real-time KPI metrics, detailed profile editing, scoped access infrastructure management (MRAs), and user onboarding.
> 2. **Policies Tab:** Management policy catalog, headline policy KPIs, resource permissions visualizer, overview aggregation API, and root-only policy lifecycle administration.
>
> **Scope of this Document:**  
> This specification covers both tabs of the Users & Access module: **Part 1** details the Users Tab and its associated workflows; **Part 2** details the Policies Tab, its resource permissions matrix, and aggregation integrations.
>
> **Visual Styling & Dimensions:**  
> Explicit pixel dimensions, color hex codes, and typography scales are intentionally decoupled from this document. Frontend developers must reference the official Figma design files for layout geometry, spacing, and styling tokens. This specification provides the normative contract for **data structures, API interactions, business logic, component behavior, validation rules, state management, and error handling**.

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
    - **Non-admin roles (`noc`, `installer`, `csr`, etc.):** `OWSEC` authoritatively rejects the request with `401 Unauthorized` (`ACCESS_DENIED`) as source-verified in `RESTAPI_users_handler.cpp`.
  - **`GET /api/v1/managementPolicy` (`OWPROV`):**
    - Policy definitions are inspectable by authenticated operators.
- **UI Presentation Philosophy (Data-Driven Display):**
  - The UI does not need to worry about client-side pre-evaluating role permissions before dispatching queries:
    - **If the API returns data:** The UI displays the data, metric cards, and relevant controls.
    - **If the API returns `401`/`403` (Access Denied) or empty results:** The UI gracefully renders an unauthorized empty state (e.g. *"You do not have administrative permissions to view the user directory."*) without blocking navigation or crashing the route.
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

All KPI metrics are strictly computed from `manageableUsers` (i.e. `total manageable users = allUsers.length - 1`):

| KPI Card | Metric Calculation | Underlying Fields / Logic | Empty / Loading State |
| :--- | :--- | :--- | :--- |
| **Total Users** | `manageableUsers.length` | Total manageable operators excluding current operator (`allUsers.length - 1`). | Skeleton shimmer / `0` |
| **Active** | `manageableUsers.filter(u => !u.suspended).length` | Count of manageable operators with operational access enabled (`u.suspended === false`). | Skeleton shimmer / `0` |
| **Suspended** | `manageableUsers.filter(u => u.suspended === true).length` | Count of locked or deactivated manageable operators (`u.suspended === true`). | Skeleton shimmer / `0` |
| **MFA Enabled** | `manageableUsers.filter(u => u.userTypeProprietaryInfo?.mfa?.enabled).length + " of " + manageableUsers.length` | Proportion of manageable operators with active multi-factor authentication. | Skeleton shimmer / `0 of 0` |

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
- **Complete Population Parity:** This exact same filter is applied to the KPI summary cards (§2.1). If `OWSEC` returns 18 total accessible users, both the KPI card ("Total Users") and the Directory Table count indicator evaluate against the 17 manageable users (`total - 1`), preventing counting discrepancies across the view.
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
| **Reset MFA** | `PUT /api/v1/user/{id}?resetMFA=true` | Prompts confirmation. Clears `authenticatorSecret` and resets `mfa.enabled` to `false`. |
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

### 6.1 Data Fetching (`OWPROV`)
Scoped access records are fetched directly using:
```typescript
GET /api/v1/managementRole?userId={selectedUserId}
```
The UI loads associated metadata in parallel:
- Properties (`Entities`): `GET /api/v1/entity` (resolves `role.entity` $\rightarrow$ Property Name).
- Venues: `GET /api/v1/venue` (resolves `role.venue` $\rightarrow$ Venue Name).
- Policies: `GET /api/v1/managementPolicy` (resolves `role.managementPolicy` $\rightarrow$ Policy Name).

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
   - Populated via `GET /api/v1/entity`.
   - Displays all properties accessible to the operator.
2. **`Venues` (Venue Multi-Select Dropdown, Optional):**
   - Populated via `GET /api/v1/venue` and dynamically filtered to venues where `venue.entity === selectedEntityId`.
   - **Property-Wide Selection:** Leaving this field empty assigns the role to the entire property (`"All venues"`).
   - **Multi-Venue Batch Selection:** Selecting one or more venues configures a batch assignment (`venueIds: [id1, id2, ...]`).
3. **`Policy *` (Management Policy Dropdown, Required):**
   - Populated via `GET /api/v1/managementPolicy`.
   - Displays all active policies with their descriptions.
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
   - Validation: Minimum 8 characters, containing at least one uppercase letter, one lowercase letter, one digit, and one special character (`[!@#$%^&*(),.?":{}|<>]`).
   - Helper text: *"Minimum 8 characters with uppercase, lowercase, number, and symbol. View password policy."*
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
- **Reset MFA:** `PUT /api/v1/user/{id}?resetMFA=true` with `{}`
- **Send Password Reset:** `PUT /api/v1/user/{id}?forgotPassword=true` with `{}`
- **Resend Email Verification:** `PUT /api/v1/user/{id}?email_verification=true` with `{}` (Response `200 OK`)
- **Delete User:** `DELETE /api/v1/user/{id}` (Response `204 No Content`)

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
**Response (`200 OK`):** `{}`

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

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export const CreateUserValidationSchema = Yup.object().shape({
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
    .matches(
      passwordPattern,
      'Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a symbol'
    ),
  description: Yup.string().max(256, 'Description cannot exceed 256 characters'),
  note: Yup.string().max(500, 'Note cannot exceed 500 characters'),
  changePassword: Yup.boolean(),
  emailValidation: Yup.boolean(),
});

export const UpdateUserValidationSchema = Yup.object().shape({
  name: Yup.string()
    .min(1, 'Name must be at least 1 character')
    .max(128, 'Name cannot exceed 128 characters')
    .required('Full name is required'),
  userRole: Yup.string()
    .oneOf(['admin', 'noc', 'installer', 'csr', 'root'], 'Please select a valid system role')
    .required('System role is required'),
  currentPassword: Yup.string()
    .notRequired()
    .test('password-complexity', 'Password must meet complexity requirements', function (value) {
      if (!value || value.length === 0) return true;
      return passwordPattern.test(value);
    }),
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
- **TC-USR-001 (KPI Metrics Accuracy & Population Parity):** Verify `Total Users`, `Active`, `Suspended`, and `MFA Enabled` accurately compute from the manageable population (`allUsers.length - 1`), excluding the authenticated operator and exactly matching the Directory Table total count.
- **TC-USR-002 (Self-Account Exclusion):** Verify the currently authenticated user is excluded from both the Directory Table and the headline KPI summary calculations.
- **TC-USR-003 (Admin Visibility Enforcement):** Authenticate as an `admin`. Verify `OWSEC` returns strictly users where `createdBy == currentAdminId`.
- **TC-USR-004 (Table Search Filtering):** Enter query in search bar. Verify real-time 300ms debounced filtering across name, email, and description.
- **TC-USR-005 (Role & Status Filtering):** Filter by `noc` role and `Active` status. Verify table renders only active NOC operators.
- **TC-USR-006 (Pagination):** Verify pagination navigates through pages correctly and resets to page 1 upon search/filter changes.

### 11.2 User Lifecycle & Security Action Tests
- **TC-USR-007 (Create User Validation):** Attempt to submit Create User with password under 8 characters or lacking required character classes. Verify inline error.
- **TC-USR-008 (Create User Success):** Fill valid details with role `noc`, submit form. Verify `POST /api/v1/user/0` is dispatched, modal closes, and new user appears in table.
- **TC-USR-009 (Administrative Actions):** Trigger Reset MFA, Send Password Reset, and Suspend User from context menu. Verify correct API parameters on `PUT /api/v1/user/{id}`.
- **TC-USR-010 (Profile Editing & Email Immutability):** Verify `Email` input field is disabled and read-only across all roles (including `root`). Update name and description in Profile sub-tab, click Save. Verify `PUT /api/v1/user/{id}` dispatches only editable fields (`name`, `description`, `userRole`, `notes`, etc.) without `email`, executes successfully, and updates cached data.
- **TC-USR-011 (Admin Role Editing Authorization):** Authenticate as an `admin`. Open an operator created by this admin who holds the `admin` role. Verify the `System Role` dropdown is enabled, lists non-root roles (`admin`, `noc`, `installer`, `csr`), and omits `root`. Change the role to `noc` and click Save; verify `PUT /api/v1/user/{id}` succeeds with `200 OK`. Attempting to submit `userRole: "root"` returns `401 Unauthorized` (`ACCESS_DENIED`). Verify that an admin cannot edit their own role.
- **TC-USR-012 (Token-Driven Authorization & Non-Admin Graceful Handling):** Authenticate with a non-admin role (e.g. `noc`, `installer`, `csr`). Navigate to the Users tab. Verify the UI does not pre-block or crash the route. When `GET /api/v1/users` returns `401 Unauthorized` (`ACCESS_DENIED`), verify the UI renders a graceful unauthorized state indicating the caller is not authorized to retrieve the user directory.

### 11.3 Scoped Access (MRA) Tests
- **TC-SCA-001 (Fetch Scoped Access):** Select user with active assignments. Verify `GET /api/v1/managementRole?userId={id}` displays individual 1:1 cards.
- **TC-SCA-002 (Scope Immutability):** Click edit on an assignment card. Verify Property and Venue fields are read-only and only Policy is editable.
- **TC-SCA-003 (MRA Policy Update):** Change policy on existing card, click save. Verify `PUT /api/v2/managementRole/{id}` sends `{ "managementPolicy": newId }`.
- **TC-SCA-004 (Single-Item Revocation):** Click trash icon on card, confirm prompt. Verify `DELETE /api/v2/managementRole/{id}` removes the assignment card.
- **TC-SCA-005 (Assign Property-Wide Access):** In inline form, select Entity, leave Venues empty, select Policy, submit. Verify `POST /api/v2/managementRole/0` creates property-wide MRA (`venue: ""`).
- **TC-SCA-006 (Assign Multi-Venue Batch Access):** In inline form, select Entity, select 2 Venues, select Policy, submit. Verify V2 backend returns normalized `{ "roles": [...] }` envelope and 2 distinct cards render.

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
   - Operators with non-root roles (`admin`, `noc`, `installer`, `csr`) have view-only access to inspect policy definitions and permissions. Scoped user assignments in the Scoped Access interface are governed authoritatively by the backend based on the caller's authority over the target user. As detailed in §1.2, UI tabs and modules are not bound or restricted by user role; downstream services authoritatively inspect the session token and return data if authorized, or `401`/`403` if denied.
2. **Authoritative Deletion Protection (`StillInUse`):**
   - A policy can only be deleted if its active assignments count is `0`.
   - If a policy is currently assigned to one or more active Management Role Assignments (`inUse.length > 0`), `OWPROV` authoritatively rejects deletion with:
     ```json
     {
       "ErrorCode": 400,
       "ErrorDescription": "StillInUse",
       "ErrorDetails": "Policy cannot be deleted while assigned to active management roles."
     }
     ```
   - In the UI, the delete action is disabled with an explanatory tooltip whenever active assignments exist.

---

## 13. Headline KPI Metric Cards (Policies Tab)

Above the Policies catalog table, four real-time KPI metric cards provide platform policy distribution and operational assignment statistics:

```
+-------------------+   +-------------------+   +-------------------+   +-------------------+
|   Total Policies  |   |  Policies in Use  |   |Unassigned Policies|   | Active Assignments|
|         8         |   |         6         |   |         2         |   |        27         |
+-------------------+   +-------------------+   +-------------------+   +-------------------+
```

### 13.1 KPI Calculation Specifications

Metrics are derived directly from cached `['managementPolicies']` (`OWPROV` `GET /api/v1/managementPolicy`) and cached `['managementRoles']` (`OWPROV` `GET /api/v1/managementRole`):

| KPI Card | Calculation Formula | Source & Underlying Logic |
| :--- | :--- | :--- |
| **Total Policies** | `policies.length` | Total policies returned by `OWPROV` `GET /api/v1/managementPolicy`. |
| **Policies in Use** | `policies.filter(p => (p.inUse?.length ?? 0) > 0 || mras.some(r => r.managementPolicy === p.id)).length` | Count of policies currently bound to $\ge 1$ active Management Role Assignments. |
| **Unassigned Policies** | `policies.filter(p => (p.inUse?.length ?? 0) === 0 && !mras.some(r => r.managementPolicy === p.id)).length` | Count of dormant policies eligible for deletion by `root`. |
| **Active Assignments** | `mras.length` | Total active scoped infrastructure assignments across the entire platform. |

---

## 14. Policies Catalog Table (Left Panel)

The left side of the split-view layout renders the master Policies Catalog table, aligning with `ra-wlan-cloud-owprov-ui` (`PoliciesPage/Table.tsx`).

### 14.1 Search & Scope Controls
- **Search Policies Input (`Search policies...`):**
  - Debounced by **300ms**.
  - Matches `name` and `description` (case-insensitive substring).
- **Scope Filter Dropdown (Legacy Compatibility):**
  - Options: `All Scopes` (default), `Global (Unscoped)`.
  - In the Mango model, policies are global permission templates not bound to a physical scope. Scope is bound exclusively via MRAs; hence all policy records evaluate as global templates.

### 14.2 Table Column Specifications

| Column | Header | Data Source & Transformation | Display Behavior |
| :--- | :--- | :--- | :--- |
| **`Policy`** | `Policy` / `Name` | `policy.name` | Shield Icon + Policy Name (bold primary text). |
| **`Entity`** | `Property` / `Entity` | `policy.entity` | Legacy schema field. Always empty (`""`) as policies are global templates independent of scope. Displays `"Global"` or `"—"`. |
| **`Venue`** | `Venue` | `policy.venue` | Legacy schema field. Always empty (`""`) as policies are global templates independent of scope. Displays `"Global"` or `"—"`. |
| **`Description`** | `Description` | `policy.description` | Truncated single-line summary with tooltip for full text. |
| **`Used By`** | `Used By` | Distinct users computed from active MRAs (see §14.2.1) | Formatted string: `"X users"` (e.g. `"4 users"`, or `"Unassigned"` if 0). Tooltip on hover displays total assignment scope: `"X users across Y scoped assignments"`. |
| **`Modified`** | `Modified` | `policy.modified` | Formatted relative or calendar date (e.g. `"1 Sep 2026"`). If `0`, render `"Never"`. |
| **Selection** | Chevron (`>`) | `selectedPolicyId === policy.id` | Highlights active row loaded into right detail panel. |

> [!NOTE]
> **Scope Independence & Legacy Schema Preservation:**
> While `entity` and `venue` columns are preserved in the table for interface parity with `owprov-ui`'s legacy schema, their values remain empty (`""`) across all policies. Policies define platform permission sets, whereas physical scoping (`entity` and `venue`) is applied dynamically when assigning policies to users via Management Role Assignments (MRAs).

#### 14.2.1 Distinct Users vs. Scoped Assignments Calculation
Because an individual user can hold scoped access across multiple properties or venues under the same policy, displaying raw assignment counts as "users" produces inaccurate figures (e.g., 1 operator with 3 venue assignments would erroneously report as "3 users"). The catalog table strictly computes distinct user IDs:

```typescript
// 1. Filter MRAs assigned to the target policy
const matchingMRAs = mras.filter(r => r.managementPolicy === policy.id);

// 2. Compute distinct user count
const distinctUsersCount = new Set(
  matchingMRAs.flatMap(r => r.users)
).size;

// 3. Compute total scoped assignments count
const totalScopedAssignments = matchingMRAs.length;

// 4. Render display string & secondary tooltip
const displayLabel = distinctUsersCount > 0 ? `${distinctUsersCount} users` : "Unassigned";
const tooltipText = distinctUsersCount > 0
  ? `${distinctUsersCount} users across ${totalScopedAssignments} scoped assignments`
  : "Not currently assigned to any users";
```

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
  - **`Edit Policy`:** Activates policy edit mode on the Permissions sub-tab (visible only to `root`). Switches the sub-tab to edit mode, exposing editable fields for **Policy Name**, **Description**, **Policy Preset**, and the **Resource Permissions Matrix**, with `[ Cancel ]` and `[ Save policy ]` controls.
  - **`Delete Policy`:** Initiates policy deletion (visible only to `root`).
    - **In-Use Guard:** If the policy is bound to $\ge 1$ active assignments (`inUse.length > 0`), the delete button is disabled with tooltip:
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
3. **"Users with this policy" Roster Table:**
   - Interactive list displaying all operators holding this policy.
   - Each row shows:
     - Avatar circle with uppercase 2-letter initials fallback.
     - Full Name (bold) and Email (muted).
     - Scoped Assignments count badge (e.g. `"2 assignments"`).
     - Direct Infrastructure Scope Badges indicating physical boundaries (e.g. `[Sunrise Apartments - All venues]`, `[Oakwood Housing - Building A]`).

---

## 17. Permissions Sub-Tab (Resource Permissions Matrix)

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
|  Resource permissions                                             |
|  +-------------------------------------------------------------+  |
|  | Resource        |  Read   |  Create  |  Update  |  Delete   |  |
|  |-----------------+---------+----------+----------+-----------|  |
|  | Entity          |   [x]   |   [ ]    |   [ ]    |    [ ]    |  |
|  | Venue           |   [x]   |   [ ]    |   [ ]    |    [ ]    |  |
|  | Configuration   |   [x]   |   [x]    |   [x]    |    [ ]    |  |
|  | Inventory       |   [x]   |   [ ]    |   [x]    |    [ ]    |  |
|  | Operator        |   [x]   |   [ ]    |   [ ]    |    [ ]    |  |
|  | Subscriber      |   [ ]   |   [ ]    |   [ ]    |    [ ]    |  |
|  | Contact         |   [x]   |   [ ]    |   [ ]    |    [ ]    |  |
|  | Location        |   [x]   |   [ ]    |   [ ]    |    [ ]    |  |
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

In standard **View Mode** (for non-root operators or prior to entering edit mode), Policy Name and Description are rendered statically in the split panel header and Overview tab, while the Permissions tab displays the read-only permissions matrix without form input controls or action buttons.

### 17.2 Canonical 8 System Resources & Operational Verbs
The matrix maps strictly across the canonical 8 OpenWifi resources defined in `owprov-ui` (`CreatePolicyModal.tsx`):
1. **`Entity` (`entity`):** Customer properties and organizational roots.
2. **`Venue` (`venue`):** Physical subdivisions and venues.
3. **`Configuration` (`configuration`):** Device and network configurations. *(Note: Configuration profile handling is managed in the Configuration module; this row represents all configuration management).*
4. **`Inventory` (`inventory`):** Physical devices, gateways, access points, and switches.
5. **`Operator` (`operator`):** Platform administrative accounts and operator profiles.
6. **`Subscriber` (`subscriber`):** End-user residents, captive portals, and guest Wi-Fi.
7. **`Contact` (`contact`):** Administrative and technical contacts.
8. **`Location` (`location`):** Physical addresses and geo-coordinates.

### 17.3 Bidirectional Mapping & Serialization Rules

| UI Column | Backend Access Verb | Serialization Rule | Deserialization Rule |
| :--- | :--- | :--- | :--- |
| **`Read`** | `READ` | If checked, serialize `'READ'`. | Checked if array contains `'READ'` or `'LIST'`. |
| **`Create`** | `CREATE` | If checked, serialize `'CREATE'`. | Checked if array contains `'CREATE'`. |
| **`Update`** | `MODIFY` | **Must serialize strictly to `'MODIFY'`.** | Checked if array contains `'MODIFY'` or `'UPDATE'`. |
| **`Delete`** | `DELETE` | If checked, serialize `'DELETE'`. | Checked if array contains `'DELETE'`. |
| **All 4 Checked** | `FULL` | Compacted to `['FULL']`. | All 4 checkboxes rendered checked. |
| **None Checked** | `NOACCESS` | Entry omitted from `entries` array. | All 4 checkboxes rendered unchecked. |

### 17.4 Preset Base Dropdown
The dropdown offers standard starting configurations:
- **`Full Access`:** Sets all 8 resources to `['FULL']`.
- **`Read Only`:** Sets all 8 resources to `['READ']`.
- **`Custom`:** Permits arbitrary checkbox combinations.

### 17.5 Policy Impact Banner & Root Mutation Flow
- **Impact Callout:** Displays real-time assignment impact:
  > *"Policy impact: [X] users across [Y] scoped assignments will be affected by permission changes."*
- **Authorization Guard:** For non-root users, metadata fields are non-editable, matrix checkboxes are disabled (`readOnly: true`), and footer action buttons are hidden.
- **Root Mutation Flow:**
  - `root` operators can edit `name`, `description`, select presets, and toggle individual resource checkboxes.
  - Clicking **`Cancel`** reverts all form fields (`name`, `description`, `entries`) back to their cached `policy` values and exits edit mode.
  - Clicking **`Save policy`** validates fields, groups matrix entries by access permissions, and dispatches `PUT /api/v1/managementPolicy/{id}` to `OWPROV` with:
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
4. **`Resource Permissions Matrix`:**
   - Interactive 8x4 checkbox grid initialized according to selected preset.

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
GET /api/v1/managementPolicy HTTP/1.1
Host: <owprov-host>:9005
Authorization: Bearer <jwt-token>
```
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
**Response (`200 OK`):** `{}`  
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
- **TC-POL-001 (Catalog Ingestion):** Verify `GET /api/v1/managementPolicy` populates the catalog table with all returned policies.
- **TC-POL-002 (Search Filtering):** Enter search text matching policy name or description. Verify debounced real-time table filtering.
- **TC-POL-003 (KPI Metrics Calculation):** Verify `Total Policies`, `Policies in Use`, and `Unassigned Policies` accurately calculate from policy `inUse` and active MRAs.

### 21.2 Overview Aggregation Integration
- **TC-POL-004 (Overview Aggregation Query):** Select policy row. Verify `GET /api/v1/policy/{id}/overview` loads summary mini-cards and the "Users with this policy" roster table.
- **TC-POL-005 (Roster Scope Badges):** Verify each user in the overview roster renders their assigned property and venue badges correctly.

### 21.3 Permissions Matrix & Serialization
- **TC-POL-006 (Matrix Rendering):** Open Permissions sub-tab. Verify 8 canonical resources render with appropriate checkmarks matching backend `entries`.
- **TC-POL-007 (UPDATE to MODIFY Serialization):** In edit mode, check `Update` column, save policy. Verify request payload maps to `MODIFY` in the `access` array.
- **TC-POL-008 (Root Mutation Enforcement):** Log in as non-root operator. Verify `+ Create policy` button is hidden and matrix edit controls are disabled.
- **TC-POL-009 (In-Use Policy Deletion Guard):** Attempt to delete a policy with active assignments. Verify delete button is disabled with tooltip, and backend rejects with `400 Bad Request` (`StillInUse`).
- **TC-POL-010 (Create Policy Success):** Log in as `root`. Open `+ Create policy`, fill name and permissions, submit. Verify `POST /api/v1/managementPolicy/0` executes and adds policy to catalog.
- **TC-POL-011 (Edit Policy Metadata & Permissions):** Log in as `root`. From the `...` context menu, select `Edit Policy`. Modify Policy Name and Description, toggle permissions in the matrix, and click `Save policy`. Verify `PUT /api/v1/managementPolicy/{id}` dispatches updated `name`, `description`, and `entries`, updates split panel header text and catalog table rows, and returns to view mode.



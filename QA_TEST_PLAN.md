# JobPulse QA Test Plan & Execution Suite

## Overview
This document specifies the execution-level QA Test Plan for the **JobPulse Tracking OS**. The objective is to verify the functional correctness, user isolation, sandbox-to-live transition, and storage persistence of the client application when running in either the Local Sandbox (Guest Mode) or Live Supabase connection mode.

---

## Scope

### In-Scope Functional Areas
1. **Connection Modes**: Switching between Live Supabase and Local Sandbox modes.
2. **Authentication / Session Management**: Registration, Sign In, Sign Out, User state isolation.
3. **Application CRUD Pipeline**: Adding, reading, editing, and deleting job applications.
4. **Interactive Filters**: Text-based search queries, category status filters, and sorting rules (newest, oldest, alphabetized by company/title).
5. **Data Persistence and Transition**: Verify local storage operations remain isolated and do not cross over to live sessions incorrectly.
6. **Robust Input Validation & Edge Cases**: Handling invalid characters, blank submissions, duplicate records, and rapid double-clicks (concurrency constraints).

### Out-of-Scope Functional Areas
- Database server performance tuning.
- Real-time network latency simulation over 30 seconds.
- Multi-factor authentication configurations on the Supabase dashboard.

---

## Test Environment
- **Runtime Target**: Web Browser Sandbox (Chrome 120+, Firefox 121+, Safari 17+)
- **Testing URL**: Development App / Shared App URL
- **Local Persistence Target**: `window.localStorage` (prefix: `jobpulse_` or `supabase.auth.token`)
- **Backend Service**: Supabase JS v2 Client API with Row-Level Security (RLS) policies.

---

## Entry Criteria
1. The web application builds successfully with 0 compilation and linter errors.
2. The local storage is cleared before initiating the baseline suite execution.
3. The tester has access to both:
   - A mockup sandbox browser console.
   - An active Supabase Project URL and Anon Public Key for Live Integration verification.

---

## Test Data Specification

| Key | Variable | Values used in test cases |
| :--- | :--- | :--- |
| **USER_A** | Valid Register Email | `qa-candidate-alpha@jobpulse.io` |
| **USER_B** | Valid Register Email | `qa-candidate-beta@jobpulse.io` |
| **PASS_A** | Strong Password | `SecurePass123!` |
| **PASS_SHORT** | Invalid Short Password| `123` |
| **APP_01** | Standard Application | Company: `Google`, Title: `QA Engineer`, Salary: `$120k - $150k`, Location: `Remote`, Status: `Applied` |
| **APP_02** | Boundary Application | Company: `A`, Title: `B`, Salary: ``, Location: ``, Status: `Applied` |
| **APP_LONG** | Excessive Text App | Company: `X`.repeat(100), Title: `Y`.repeat(100) |

---

## Detailed Test Cases

### 1. Connection Mode & Local Sandbox (Guest Mode)

#### TC-01: Guest Mode Detection & UI Setup State
* **Step 1**: Load the application URL in a clean browser profile (incognito with no prior localStorage).
* **Step 2**: Inspect the top navigation bar and verify the Connection Status Pill.
* **Step 3**: Inspect the primary dashboard area for the Guest Mode Alert Notice.
* **Input**: None (first-load context).
* **Expected Result**: 
  - The connection mode is marked as `"Sandbox (Local)"` in the desktop navigation bar.
  - A prominent banner states: `"✨ Experiencing JobPulse in Guest Mode"`.
  - The visual metrics cards (Applied, Interview, Assessment, Offer, Rejected, Total) all display exactly `0`.
* **Pass/Fail Conditions**: Pass if top pill displays Sandbox status and banner is visible with zero metrics; fail otherwise.

#### TC-02: Local Sandbox Seeding
* **Step 1**: Ensure the dashboard has 0 applications.
* **Step 2**: Click the **"Seed Guest Samples"** button inside the Guest Mode banner.
* **Step 3**: Refresh the browser page using the browser reload command.
* **Input**: Left-click on `#dash-seed-guest`.
* **Expected Result**:
  - Sample job applications are successfully injected.
  - The metrics cards instantly update to display values corresponding to the seeded mock list.
  - The seed button disappears immediately.
  - After browser refresh, all seeded records remain fully present in the table.
* **Pass/Fail Conditions**: Pass if exactly the seeded items appear and survive page refresh.

---

### 2. Authentication & Data Isolation

#### TC-03: Register New User with Password Complexity Validation (Negative & Positive)
* **Step 1**: Click **"Sign In"** in the top navigation bar to summon the Auth Modal.
* **Step 2**: Click **"Sign Up"** in the toggle link inside the modal.
* **Step 3**: Fill in Email: `qa-candidate-alpha@jobpulse.io`, Password: `123`, Confirm Password: `123`. Click **"Create Account"**.
* **Step 4**: Notice the error alert. Change Password to `SecurePass123!`, but leave Confirm Password as `SecurePass123!_mismatch`. Click **"Create Account"**.
* **Step 5**: Notice the error alert. Change Confirm Password to `SecurePass123!`. Click **"Create Account"**.
* **Input**: Interactive strings on fields `#auth-email-input`, `#auth-password-input`, `#auth-confirm-password-input`.
* **Expected Result**:
  - Step 3 triggers error message: `"Password must be at least 6 characters."`
  - Step 4 triggers error message: `"Passwords do not match."`
  - Step 5 completes registration and shows: `"🎉 Registration successful! Check your email or try signing in."`
* **Pass/Fail Conditions**: Pass if registration flow behaves exactly with specified inline error text and successful green registration alert.

#### TC-04: Multi-User Session Isolation (RLS Verification)
* **Step 1**: Sign In as `qa-candidate-alpha@jobpulse.io` using the mock sandbox auth system.
* **Step 2**: Create a new job application with Company: `Microsoft`, Title: `Senior Dev`, Status: `Interview`.
* **Step 3**: Sign Out using the logout button `#navbar-signout`.
* **Step 4**: Sign In as `qa-candidate-beta@jobpulse.io`.
* **Step 5**: Check the applications list.
* **Input**: Credentials and application creations.
* **Expected Result**:
  - `qa-candidate-alpha@jobpulse.io` successfully creates their Microsoft application.
  - Upon signing in as `qa-candidate-beta@jobpulse.io`, the dashboard must show exactly `0` records. The Microsoft application created by Alpha is isolated and completely invisible.
* **Pass/Fail Conditions**: Pass if Alpha's records are fully hidden from Beta.

---

### 3. Application CRUD Operations & Integrity

#### TC-05: Create Application Form Validation & Insertion
* **Step 1**: Click the **"+ Add Opportunity"** button on the dashboard.
* **Step 2**: Leave Company Name blank. Enter Title: `Site Reliability Engineer`. Click **"Save Opportunity"**.
* **Step 3**: Fill Company Name: `Apple`, Title: `Site Reliability Engineer`, Salary: `$140k - $180k`, Location: `Cupertino, CA`, Status: `Applied`. Click **"Save Opportunity"**.
* **Input**: Submitting the Opportunity Form.
* **Expected Result**:
  - Leaving Company Name blank triggers HTML5 native field validation or a validation tooltip preventing submission.
  - Completing all fields inserts exactly 1 row into the tracker.
  - The Total applications counter increments by exactly `1`.
  - The modal closes, and the new item is listed at the top.
* **Pass/Fail Conditions**: Pass if form validation prevents empty submissions and inserts correct data structure upon fulfillment.

#### TC-06: Quick Inline Status Update and Metric Calculation
* **Step 1**: Locate the newly created Apple application card.
* **Step 2**: Click the Status Dropdown (currently displaying `Applied`).
* **Step 3**: Change the status value to `Offer`.
* **Input**: Selecting `Offer` from the status selector.
* **Expected Result**:
  - The status on the card instantly shifts to a green `Offer` badge.
  - The "Applied" metric counter decrements by `1`.
  - The "Offer" metric counter increments by `1`.
  - Reloading the page retains the `Offer` status.
* **Pass/Fail Conditions**: Pass if card state and metrics sync instantly and survive browser refresh.

#### TC-07: Concurrency & Rapid Submission Mitigation (Negative Control)
* **Step 1**: Open the **"Add Opportunity"** form.
* **Step 2**: Fill in required fields.
* **Step 3**: Double-click (or triple-click) the submit button as fast as possible (within 200ms).
* **Input**: Multiple rapid clicks on `#auth-submit-button` / `#opportunity-submit`.
* **Expected Result**:
  - The application button enters a disabled/loading state upon the first click.
  - Only exactly `1` application is registered in the database. No duplicate entries appear in the listing.
* **Pass/Fail Conditions**: Pass if only 1 entry is created and the submit button correctly implements loading state protection.

---

### 4. Search, Filter & Sort Constraints

#### TC-08: Real-Time Dynamic Search Filter
* **Step 1**: Populate the list with three entries:
  - Card A: Company `NVIDIA`, Title `Machine Learning Scientist`
  - Card B: Company `Netflix`, Title `Engineering Lead`
  - Card C: Company `Amazon`, Title `Frontend Developer`
* **Step 2**: Type `nv` in the search text field.
* **Step 3**: Clear the field, then type `Lead`.
* **Step 4**: Clear the field, then type `Non-existent Company`.
* **Input**: Keystroke strings in search bar input.
* **Expected Result**:
  - For `nv`, Card A (`NVIDIA`) is displayed; Card B and Card C are hidden.
  - For `Lead`, Card B (`Netflix - Engineering Lead`) is displayed; Card A and Card C are hidden.
  - For `Non-existent Company`, the table displays an empty state with an illustrative feedback message.
* **Pass/Fail Conditions**: Pass if exact matches are filtered in real-time, and empty search yields zero results with an explicit placeholder UI.

---

### 5. API Configuration & Fallback States

#### TC-09: Live Supabase Invalid Credentials Fallback (API Failure Handling)
* **Step 1**: Open **Settings** via the gear/connection menu.
* **Step 2**: Input invalid parameters:
  - URL: `https://invalid-subdomain.supabase.co`
  - Anon Key: `invalid-anon-key-string`
* **Step 3**: Toggle mode to **Live Supabase** and click **Save Connection Details**.
* **Step 4**: Trigger a refresh action or attempt to load the applications list.
* **Input**: Custom configuration inputs.
* **Expected Result**:
  - The app displays a clear connection error state.
  - A friendly error message details that the server is unreachable or credentials are incorrect.
  - The application provides a clear option to fall back to the Sandbox Mode or update credentials.
* **Pass/Fail Conditions**: Pass if invalid keys do not crash the React app and instead show an informative, recoverable warning UI.

---

## Acceptance Criteria
1. **0 Leakage**: All application records are strictly filtered by `user_id` when an active user session exists.
2. **Deterministic CRUD**: All created, updated, and deleted items reflect changes in storage immediately.
3. **No App Crashes**: Invalid inputs, missing Supabase connection params, or rapid actions must gracefully render warnings instead of white-screening the app.

---

## Exit Decision
The system is ready for production deployment if 100% of the above high-strictness test cases pass successfully without data regressions or UI-blocking state loops.

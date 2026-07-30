## Prompt

Build a full-stack internal task/request management web app called **"Marketing Portal"** (application name: "Marketing Operations Portal") for a company's Marketing department. Use the following stack:

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend/Database/Auth:** Supabase (Postgres, Row Level Security, Supabase Auth)
- **Deployment:** Vercel

### Overall Layout
- Persistent dark navy left sidebar (approx. `#0f1a3c`) with a small square logo badge ("LAF") and app name "Marketing Portal" / subtitle "MARKETING".
- Sidebar nav items with icons: **Home**, **Review Panel**, **Team Stats**, **Admin Center** (visible only to Supervisor role), **My Account**.
- Bottom of sidebar: logged-in user's avatar, display name, role (e.g. `marketing_supervisor`), a **Dark Mode** toggle, and a **Logout** link (in red).
- Top bar on each page: page title on the left, a notification bell icon on the right.
- Main content area on a light gray background with white rounded cards.

### Roles & Auth
- Two roles: **Supervisor** and **Member**, both scoped to a **Department** (e.g. Marketing, Accounting, Corporate, HR, Litigation, Operations).
- Supabase Auth (email/password). Users log in with a company email (e.g. `name@company.com`).
- Row Level Security: Members can only see/edit their own tasks; Supervisors can see/manage all tasks in their department plus access Admin Center.

### Page 1 — Home (Dashboard, "Marketing Overview")
- Header: "Marketing Overview" title + subtitle "Manage team workload and track performance."
- Top-right buttons: **Export CSV** and a primary **+ Create New Task** button.
- Section label "CAPACITY AND RISK" with 4 summary cards in a row:
  1. **Active Workload** — count of tasks assigned/in progress/review/revision, with helper text.
  2. **Due This Week** — count of items due in the current week, with date range shown.
  3. **Overdue** — count in red, of open tasks past due date.
  4. **Review Bottlenecks** — count of tasks waiting on review feedback/revision decisions.
- Below that: a card per team member (grid of cards), each showing:
  - Avatar initial, name, "X ACTIVE • X DUE THIS WEEK".
  - Three mini-stats: Overdue, Bottlenecks, Avg. Revisions.
  - Four colored status pill counts: Assigned, In Progress, Review, Revisions.
  - A "Next Due Task" panel showing the soonest due task or "No tasks due this week."
- A right-hand **Team Bottlenecks** panel with counts for "For Review", "Revision Needed", "Unassigned Active", plus a **Supervisor Focus** callout box listing "Highest Workload", "Most Overdue", and "Most Review Pressure" (each naming a team member, computed dynamically).

### Page 2 — Task Management (list/kanban/calendar views)
- Top bar: "TASK MANAGEMENT" label, and a view switcher with **List**, **Kanban**, **Calendar** tabs (icon + label, active tab highlighted).
- Search bar: "Search by title, ID, requestor, or description..." plus a result count ("Showing X of Y") and a **Filters** button.
- List view organized into collapsible stage sections, each with a count badge: **Pending Requests**, **Assigned Tasks**, **In Progress**, **For Review**, **Completed**. Empty stages show "No tasks in this stage."
- Each task card shows: a priority pill (e.g. NORMAL), task title, department • requestor name, an assignee row ("Assigned to: [Name]"), a due date pill, time since creation (e.g. "341h ago"), a revision count ("0 revs"), a short task ID with an external-link icon (e.g. `MR-8735-697`), and action icons (menu / delete).

### Page 3 — Review Panel
- Simple state: when there's nothing pending, show a centered success state — green checkmark icon, "No Tasks for Review" heading, "Everything is up to date." subtext.
- When populated, this should list tasks in "For Review" status for the supervisor to approve, request revisions on, or comment on.

### Page 4 — Team Stats ("Analytics Overview")
- Header + subtitle "Performance metrics and team workload", with an **Export Full Report** button top-right.
- Four top summary stats: **Total Requests**, **Completed**, **In Progress**, **Overdue** (each with a small icon; show em-dash "—" when zero/empty rather than 0 for In Progress/Overdue).
- Charts (use a charting library like Recharts):
  1. **Avg. Revisions per Project** — bar/line chart, x-axis = team member names.
  2. **Active Tasks per Member (Workload)** — bar chart, x-axis = team member names.
  3. **Requests by Department** — donut/pie chart with a legend (e.g. "Marketing (1)").
  4. **Completed Projects by Member** — horizontal bar chart, y-axis = team member names.

### Page 5 — Admin Center (Supervisor-only)
- Header "Admin Center" / subtitle "Manage system-wide settings and data."
- **System Initialization** card: explains first-time setup; buttons **Initialize Team Credentials** (creates all staff accounts with default passwords) and **Seed Sample Tasks**.
- **Request Templates** card: "+ New Template" button, list of templates or empty state "No templates yet."
- **Reset Task Data** card (danger styling): warns it permanently deletes all marketing requests, comments, activity logs, and notifications, but does not affect user accounts/login credentials; notes uploaded files are hosted externally (e.g. Cloudinary) not in the database. **Reset Data** destructive button.
- **App Info** card: read-only fields for Application Name and a backend project ID, plus a note "Admin Center is only accessible to Marketing Supervisors."

### Page 6 — My Account
- **Profile** card: avatar, display name, email, role badge, department.
- **Change Display Name** card: text input + **Save Name** button.
- **Change Password** card: current password, new password, confirm password fields, password rules checklist ("At least 8 characters", "Passwords must match"), **Update Password** button.
- **Notification Preferences** card: toggle switches, e.g. "Notify me when a comment is posted on my request", "Notify me when my request status changes".
- **User Directory** card: two sub-lists —
  - **Marketing Team**: each row shows avatar initials/photo, name, email, and role/department pills (Supervisor/Member + Marketing).
  - **Departments**: each row is a department "user" (e.g. Accounting Department, Corporate Department, HR Department, Litigation Department, Operations Department) with a shared department inbox-style email and a "Department" pill + department name pill.

### Data Model (Supabase/Postgres tables)
- `users` (id, display_name, email, avatar_url, role [supervisor|member], department, created_at)
- `departments` (id, name, email)
- `tasks` (id, task_code, title, description, priority, status [pending|assigned|in_progress|for_review|revision|completed], requestor_id, department, assignee_id, due_date, created_at, updated_at, revision_count)
- `comments` (id, task_id, user_id, body, created_at)
- `activity_logs` (id, task_id, user_id, action, created_at)
- `notifications` (id, user_id, type, message, read, created_at)
- `templates` (id, name, fields JSON, created_by, created_at)

### Non-functional requirements
- Fully responsive layout; collapse sidebar into a mobile drawer.
- Support light/dark mode via a toggle in the sidebar (persist preference).
- Use Supabase Row Level Security policies so Members only see their own department/tasks and Supervisors see everything in their department; Admin Center gated to `role = 'supervisor'`.
- Deploy-ready `vercel.json` / environment variables for `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Include seed script / SQL migrations for the schema above and a "Seed Sample Tasks" admin action.

Please scaffold the project structure, set up Supabase client and auth, implement the schema/migrations, and build out each page above with realistic mock data first, then wire up real Supabase queries.

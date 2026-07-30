# Marketing Portal 🚀

A modern, full-featured Marketing Task Management & Review Portal built for teams to manage tasks, track performance analytics, review submissions, and manage team permissions in real-time.

![STLAF Logo](STLAF_LOGO.png)

---

## ✨ Features

- **🔒 Authentication & Role-Based Access (RBAC)**: Secure authentication powered by Supabase Auth with support for multi-role workflows (**Agents** and **Supervisors/Admins**).
- **📋 Task Management**: Create, assign, filter, track, and update marketing tasks with real-time status changes and comment threads.
- **🔍 Review Panel**: Dedicated supervisor workflow for reviewing, approving, or requesting revisions on submitted tasks.
- **📊 Team Analytics & Stats**: Dynamic metrics dashboard with interactive charts (powered by Recharts) tracking task completion rates, workload distribution, and team throughput.
- **⚙️ Admin Center**: Exclusive supervisor tools for managing users, user roles, system configurations, and task templates.
- **👤 Account Management**: Customizable user profiles and password management.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Routing**: [React Router 6](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) + [PostCSS](https://postcss.org/) + [Autoprefixer](https://github.com/postcss/autoprefixer)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Row Level Security)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 📁 Project Structure

```text
marketing-portal/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components (Layout, Sidebar, TopBar, TaskCard, etc.)
│   ├── contexts/           # React Context providers (AuthContext, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Client configurations (Supabase client setup)
│   ├── pages/              # Application pages (Home, Tasks, ReviewPanel, TeamStats, AdminCenter, MyAccount, Login)
│   ├── App.jsx             # Route definitions & protection wrapper
│   ├── main.jsx            # React app entry point
│   └── index.css           # Global styles & Tailwind configuration
├── supabase/
│   └── migrations/         # Database schemas, seeds, constraints, and RLS policies
├── package.json            # Project dependencies & scripts
├── tailwind.config.js      # Tailwind theme & plugin setup
├── vite.config.js          # Vite build configuration
└── vercel.json             # Vercel deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** / **pnpm**
- A **Supabase** project instance

---

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MJDemotica/marketing_portal.git
   cd marketing_portal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Database Setup (Supabase)**:
   Run the SQL scripts located in the `supabase/migrations/` folder in your Supabase SQL Editor in numerical order:
   - `001_schema.sql` (Creates tables, triggers, and Row Level Security policies)
   - `002_seed_users.sql` (Optional seed users)
   - `003_seed_tasks.sql` (Optional sample tasks)
   - `004_update_status_constraint.sql` (Task status constraints update)
   - `005_seed_templates.sql` (Task templates seed data)

5. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 📦 Building for Production

To generate a production-ready build:

```bash
npm run build
```

To preview the build locally:

```bash
npm run preview
```

---

## 🌐 Deployment (Vercel)

This repository includes a `vercel.json` file configured for SPA single-page application routing.

1. Connect your repository to **Vercel**.
2. Add your environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings.
3. Deploy!

---

## 📜 License

This project is proprietary and built for internal marketing team operations.

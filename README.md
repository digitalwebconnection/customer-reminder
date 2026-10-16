# RemindIQ — Customer Follow-up & Call Reminder System

A private, single-user Customer Follow-up & Call Reminder System built with React (Vite + Tailwind CSS v4), Node.js (Express + Mongoose), and background reminder scheduling.

---

## 🏗️ Project Architecture

```
customer-reminder/
├── frontend/                     # Vite + React 19 + Tailwind CSS v4
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js         # Configured Axios instance with credentials & proxy
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header with live API health indicator
│   │   │   ├── Sidebar.jsx      # Navigation drawer with Lucide icons
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── StatusBadge.jsx  # Color-coded reminder/customer status pills
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Metrics and milestone status
│   │   │   ├── Customers.jsx    # Customer directory & search
│   │   │   ├── CustomerDetails.jsx
│   │   │   ├── Reminders.jsx    # Call scheduling & status tabs
│   │   │   ├── Settings.jsx     # Timezone & notification config
│   │   │   └── Login.jsx        # Single-user authentication preview
│   │   ├── App.jsx              # React Router setup
│   │   ├── index.css            # Tailwind CSS v4 + Plus Jakarta Sans typography
│   │   └── main.jsx
│   ├── vite.config.js           # Tailwind v4 plugin + API proxy to :5000
│   └── package.json
│
├── backend/                      # Node.js + Express (ES Modules)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # Mongoose connection with error handling
│   │   ├── middleware/
│   │   │   └── errorHandler.js  # Centralized JSON error handler
│   │   ├── app.js               # Express app (Helmet, CORS, Cookie-parser)
│   │   └── server.js            # Server entry point on port 5000
│   ├── .env.example             # Complete environment configuration template
│   ├── .env                     # Local development environment file
│   └── package.json
│
├── .gitignore                   # Ignores node_modules, .env, dist, logs
├── package.json                 # Monorepo root scripts
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies

Dependencies are already installed for both frontend and backend. To re-install or update:

```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Review `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/customer-reminder
FRONTEND_URL=http://localhost:5173
JWT_SECRET=super_secret_dev_jwt_key_replace_with_strong_random_secret_in_production
COOKIE_NAME=customer_session
APP_TIMEZONE=Asia/Kolkata
```

### 3. Start Development Servers

You can start both servers from the root:

```bash
# Run backend (with hot reload via node --watch)
npm run dev:backend

# Run frontend (Vite dev server on http://localhost:5173)
npm run dev:frontend
```

---

## 📡 API Endpoints

### Health Check

- **`GET /api/v1/health`**
  - **Status**: 200 OK
  - **Response**:
    ```json
    {
      "status": "ok",
      "database": "connected | disconnected",
      "timestamp": "2026-10-16T...",
      "uptime": 12,
      "service": "customer-reminder-api"
    }
    ```

---

## 📋 Build Order Roadmap

- [x] **Step 1: Setup** — Monorepo setup with Vite + React + Tailwind v4 frontend, Express backend, git repo, `.gitignore`, and `/api/v1/health` route.
- [ ] **Step 2: Database + models** — Mongoose models: User, Customer, Reminder, CallLog, NotificationLog with fields and compound indexes.
- [ ] **Step 3: Single-user Auth** — Argon2id hashing, HTTP-only JWT cookies, login rate limiting, and owner seed script.
- [ ] **Step 4: Customers API + UI** — Customer CRUD, archival, search, pagination, and `tel:` calling links.
- [ ] **Step 5: Reminders + call logs** — Call outcomes, reschedule/snooze, customer timeline, and next-reminder chaining.
- [ ] **Step 6: Dashboard** — Summary API, Asia/Kolkata boundary statistics, stat cards, and responsive drawer.
- [ ] **Step 7: Notification engine** — `node-cron` worker, Nodemailer, Web Push with VAPID keys, atomic claims, and retry handling.
- [ ] **Step 8: Testing & Deployment** — Security checks, Render backend, Vercel frontend.

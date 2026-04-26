# 🎓 Admission Tracker

College admission management system — React frontend + Node.js backend + **MongoDB Atlas**.

---

## ⚡ ONE-CLICK START (Windows)

Double-click **`START.bat`** — that's it!

**First time only**, it will:
1. Ask you to paste your MongoDB URI into `backend/.env`
2. Install all packages automatically
3. Seed sample data (admin + students)
4. Open the app in your browser

---

## 🔌 MongoDB Setup (one time, 2 minutes)

1. Go to [mongodb.com](https://mongodb.com) → sign in → your cluster
2. Click **Connect** → **Drivers** → copy the connection string
3. It looks like: `mongodb+srv://username:password@cluster.mongodb.net/...`
4. Open `backend/.env` (created on first run), paste your URI on the `MONGODB_URI=` line
5. Save and run `START.bat` again

> **Important:** In the URI, replace `<password>` with your actual password, and add `admission_tracker` as the database name before the `?`

---

## 🔑 Default Login

| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Admin | admin@college.com      | Admin@123  |
| Staff | priya@college.com      | Staff@123  |
| Staff | rahul@college.com      | Staff@123  |

---

## 📁 Project Structure

```
admission-tracker/
├── START.bat          ← Double-click to run everything
├── backend/
│   ├── .env           ← Your MongoDB URI goes here
│   └── src/
│       ├── models/    ← MongoDB schemas
│       ├── controllers/
│       ├── routes/
│       └── migrations/seed.js  ← Sample data
└── frontend/
    └── src/
```

---

## 🛠 Manual Start (if needed)

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm start
```

Then open http://localhost:3000

---

## 🌱 Re-seed Database

```bash
cd backend
node src/migrations/seed.js
```

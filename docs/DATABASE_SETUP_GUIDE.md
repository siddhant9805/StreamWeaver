# Database Setup Guide

**Owner:** Nikhil Singh (Database & Testing)

Follow this once per machine (local dev) or once per environment
(staging/production via Atlas). Pairs with `docs/DATABASE_SCHEMA.md`.

## 1. Choose where MongoDB runs

**Option A — Local MongoDB (fastest for development)**
```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Windows / Linux: install MongoDB Community Server from
# https://www.mongodb.com/try/download/community and start the mongod service
```
Default connection string: `mongodb://127.0.0.1:27017/streamweaver`

**Option B — MongoDB Atlas (free tier, shared across the team)**
1. Create a free cluster at https://cloud.mongodb.com
2. Add each teammate's IP (or `0.0.0.0/0` for the internship, since this
   isn't production) under Network Access.
3. Create a database user under Database Access.
4. Copy the connection string from "Connect → Drivers" — it looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/streamweaver`

## 2. Configure the backend

```bash
cd streamweaver-backend
cp .env.example .env
```

Edit `.env` and set:
```
MONGO_URI=mongodb://127.0.0.1:27017/streamweaver
# or the Atlas SRV string from step 1B
```

## 3. Install dependencies

```bash
npm install
```

## 4. Verify the connection + indexes

```bash
node scripts/testConnection.js
```

This script (see `scripts/testConnection.js`):
- Connects using the same `connectDB()` the real app uses
- Confirms both collections (`jobs`, `failedrows`) exist and are reachable
- Confirms the expected indexes are actually built
- Runs a throwaway insert + read + delete to prove write/read access works
- Exits with a clear ✅ / ❌ summary

## 5. Load sample data (optional, for frontend/dashboard development)

```bash
node scripts/seed.js
```

This inserts one sample `completed` job, one sample `failed` job, and a
handful of `failedrows` linked to the failed job — enough for the frontend
team to build the job list / error table UI against real-shaped data
without needing to actually upload a CSV first.

To wipe the sample data again:
```bash
node scripts/seed.js --clean
```

## 6. Start the server

```bash
npm run dev
```

You should see, in order:
```
MongoDB connected -> streamweaver
Server listening on port 5000
```
(exact log wording may vary — the important part is "MongoDB connected"
appearing before the server starts accepting requests).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `MongooseServerSelectionError` | MongoDB isn't running, or wrong `MONGO_URI` | Confirm `mongod` is running locally, or double-check the Atlas string/password |
| Connects locally but not for teammates | Using `127.0.0.1` while sharing `.env` | Everyone should use their **own** local Mongo, or the team should share one Atlas cluster |
| Atlas: "IP not whitelisted" | Your current IP isn't in Network Access | Add it in Atlas, or temporarily allow `0.0.0.0/0` for the internship |
| `npm install` fails on `isolated-vm` | Missing build tools on some OS/Node combos | Use Node 18+ as pinned in `package.json` `engines`; this is unrelated to the database layer |

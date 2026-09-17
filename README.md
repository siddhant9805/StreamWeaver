# StreamWeaver — Integrated MERN + ETL Project

A clean internship-ready monorepo combining the StreamWeaver React frontend, Node/Express API, MongoDB models, authentication, CSV upload service, and streaming ETL engine.

## Stack

- **Frontend:** React 18, Vite, React Router, React Icons
- **Backend:** Node.js, Express 4, ES Modules
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT + bcrypt
- **ETL:** Node.js streams + `csv-parse` + isolated-vm transformations
- **Realtime:** Socket.IO (backend events are available for live pipeline monitoring)
- **Security:** Helmet, authenticated API routes, upload size limits, path validation

## Project structure

```text
StreamWeaver/
├── backend/
│   ├── src/
│   │   ├── config/          # environment + constants
│   │   ├── controllers/     # request orchestration
│   │   ├── middleware/      # JWT authentication
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # ETL + pipeline execution
│   │   └── utils/           # validation, logging, errors
│   ├── test/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/        # API client
│   │   └── styles/
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
```

## Setup

### 1. Install

From the project root:

```bash
npm install
```

This installs both workspace dependencies, including `react-virtualized` and `socket.io-client` for the frontend and `busboy`, `csv-parse`, `isolated-vm`, Mongoose and Socket.IO for the backend.

### 2. Configure MongoDB

The database is intentionally **not hard-coded**. The team member responsible for infrastructure/database should copy:

```text
backend/.env.example -> backend/.env
```

and set `MONGODB_URI` to the required MongoDB connection string.

Also set a strong `JWT_SECRET`.

### 3. Run

Run both frontend and backend:

```bash
npm run dev
```

Or independently:

```bash
npm run dev:backend
npm run dev:frontend
```

Frontend: `http://localhost:5173`  
API: `http://localhost:4000`

## ETL flow

1. User registers/logs in and receives a JWT.
2. Frontend uploads a CSV to `POST /api/etl/upload`.
3. Backend streams the upload to disk and creates a `SourceUpload` record.
4. User creates a pipeline with source-to-destination mappings.
5. `POST /api/pipelines/:id/run` creates a `PipelineRun`.
6. The executor streams the CSV through **Extract → Transform → Load**.
7. Transformations execute inside `isolated-vm`.
8. Rows are bulk-inserted into a dynamically named MongoDB collection.
9. Progress and final status are persisted in `PipelineRun` and emitted through Socket.IO.
10. Dashboard, history and analytics read actual backend data instead of frontend mock/localStorage data.

## Important API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/pipelines`
- `POST /api/pipelines`
- `PUT /api/pipelines/:id`
- `DELETE /api/pipelines/:id`
- `POST /api/etl/upload`
- `GET /api/etl/uploads`
- `POST /api/pipelines/:id/run`
- `GET /api/pipelines/:id/runs/:runId`
- `GET /api/pipelines/runs/history`
- `GET /health`

Protected endpoints require:

```text
Authorization: Bearer <JWT>
```

## Notes for the database/integration team

No production MongoDB credentials are included. Only `backend/.env.example` is committed. Set `MONGODB_URI` in the deployment environment and keep `.env` out of source control.

Uploaded files and runtime logs are intentionally excluded from the deliverable.

## Internship roadmap coverage

The integrated project now covers the requested StreamWeaver internship milestones:

- **Multipart streaming:** Busboy streams uploads directly to disk with a 10 GB upload ceiling.
- **Virtual Grid:** `react-virtualized` renders the first 1,000 CSV rows without creating 1,000+ DOM rows at once.
- **Streaming ETL Transform:** Node.js `Transform` streams parse, validate and transform records without buffering the dataset.
- **Visual Mapping UI:** CSV headers are loaded from the real uploaded dataset and mapped to MongoDB fields with optional sandbox transforms, required fields and regex validation.
- **Memory audit:** `backend/scripts/memory-audit.js` runs the ETL path against a CSV while sampling RSS. Use a real 2 GB CSV to produce the 150 MB acceptance result.
- **Sandboxed execution:** `isolated-vm` executes user transformations with an 8 MB isolate and 50 ms timeout.
- **Live progress:** Socket.IO streams processed, inserted, failed and byte-progress events to the React UI.
- **Bulk ingestion:** MongoDB `bulkWrite` is triggered in batches; the default is **5,000 records**.
- **Failed-row handling:** Validation/transformation failures are recorded (up to 500 detailed rows) while successful rows continue through the ETL stream. The UI highlights failed rows and displays their error messages.

### Memory audit command

```bash
cd backend
npm run audit:memory -- ./uploads/your-2gb-file.csv
```

A successful audit exits with code `0` and prints `RESULT: PASS` when peak RSS is at or below 150 MB. The audit is intentionally streaming and does not create an in-memory copy of the CSV.


## Team Deliverables (Weeks 1–3)

- **Siddhant (Backend & Core ETL Engineering):**
  - Chunk-by-chunk file stream ingestion (`Busboy` direct streaming to disk, avoiding RAM buffering).
  - Native Node `Transform` stream pipeline (`extract.js` -> `transform.js` -> `load.js`).
  - Edge-case line handling (`
` CRLF), uppercase mapping, and condition filters (`min`, `equals`).
  - Benchmarked throughput: over 60,000 rows/sec with peak memory bounded under 32 MB.

- **Siddhi (Full-Stack & Pipeline Execution):**
  - JWT Authentication (`POST /api/auth/register`, `POST /api/auth/login`) and route guards.
  - Pipeline Builder APIs (`/api/pipelines`, `/api/pipelines/:id/run`, `/api/pipelines/runs/history`).
  - Isolated JS execution via `isolated-vm` sandbox (8 MB limit, 50ms timeout).
  - Realtime progress broadcast using `Socket.IO` channels.

- **Nikhil Singh (Database & Testing Workstream):**
  - Mongoose schemas: `Job`, `FailedRow`, `PipelineConfig`, and `PipelineRun` (Run History).
  - Comprehensive test suite in `scripts/`: `testConnection.js`, `testPipelineConfig.js`, `testPipelineRun.js`, and `testIntegrationApi.js`.
  - Database documentation in `docs/`: `DATABASE_SCHEMA.md`, `DATABASE_SETUP_GUIDE.md`, `TEST_CASES.md`, `BUG_LOG.md`, and `TEST_REPORT_MID_REVIEW.md`.

- **Akiti (Frontend UI & Virtualization):**
  - React 18 + Vite dashboard with responsive design and modern styling.
  - Virtualized preview of CSV rows using `react-virtualized`.
  - Visual column-mapping interface with live status indicators.

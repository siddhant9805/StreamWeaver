# StreamWeaver Frontend

React 18 + Vite frontend for the StreamWeaver MERN ETL platform.

Implemented internship features:
- Virtualized CSV preview of the first 1,000 rows using `react-virtualized`.
- Visual CSV-to-MongoDB column mapping.
- Optional per-field required validation and regular-expression validation.
- Live Socket.IO pipeline progress with processed/inserted/failed counters.
- Failed-row inspection with virtualization for large error sets.
- Existing authentication, dashboard, history and analytics flows remain available.

Configure `VITE_API_URL` in `.env` when the backend is not running on `http://localhost:4000`.

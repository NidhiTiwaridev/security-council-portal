# College Management System — Backend

A simple Node.js + Express backend starter. It can run before a database is configured.

## Requirements

- Node.js and npm installed
- VS Code (optional)

## Run it on macOS

1. Extract this ZIP file.
2. Open the extracted `College-Management-System-Backend` folder in VS Code.
3. Open the VS Code terminal (**Terminal → New Terminal**).
4. Install packages:

   ```bash
   npm install
   ```

5. Create your local environment file by copying `.env.example` to `.env`.
   You can do this in VS Code: right-click `.env.example`, choose **Copy**, then paste it in the same folder and name the copy `.env`.
6. Start the server:

   ```bash
   npm run dev
   ```

   Or use `npm start`.

You should see a message saying the backend is running at `http://localhost:3000`.

## Test the backend

Open these addresses in your browser:

- `http://localhost:3000/`
- `http://localhost:3000/api/health`

The database check at `http://localhost:3000/api/db-health` will report that the database is not configured until you add a real PostgreSQL connection string to `.env`.

## Connect PostgreSQL later

1. Open `.env` in VS Code.
2. Put your real PostgreSQL connection string after `DATABASE_URL=`.
3. Set `DATABASE_SSL=true` if your database provider requires SSL.
4. Stop and restart the server.

Do not share or commit `.env`; it contains credentials.

## Notes

This is the starting backend foundation, not the complete college management system yet. It does not create student, faculty, attendance, fees, timetable, or login tables/routes. Those should be added after the database is connected and the required features are decided.

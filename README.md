# Task OS

Next.js App Router + PostgreSQL task manager. The UI uses native CSS nesting and custom properties, following a standards-first styling approach.

## Features
- Create, edit, delete tasks
- Status flow: todo → doing → done
- Search and status filters
- PostgreSQL-backed API routes
- Deployable to Vercel or Render with the same codebase

## Tech
- Next.js App Router
- React
- PostgreSQL via `pg`
- Native CSS only

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
3. Start the app:
   ```bash
   npm run dev
   ```

## Database
Create a PostgreSQL database and run `sql/schema.sql` once.

## Deploy on Vercel
- Import the GitHub repository in Vercel.
- Set `DATABASE_URL` in Project Settings.
- Deploy. Next.js is supported with zero-config deployment on Vercel.

## Deploy on Render
- Create a Web Service from the GitHub repository.
- Set `DATABASE_URL` in the Render environment.
- Use the provided build and start commands.

## Notes
If you want persistent storage, use a managed PostgreSQL database. Vercel and Render both work well with that model.

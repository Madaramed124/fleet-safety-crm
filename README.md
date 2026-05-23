# Fleet Safety CRM

Fleet Safety CRM is a React + TypeScript application for managing fleet safety incidents, violations, and accounting workflows.

## Features

- Month-based incident organization
- Traffic ticket, accident, and inspection tracking
- KPI dashboard and search/filtering
- LocalStorage-backed data persistence by default
- Optional Supabase integration for remote storage
- Charge builder, ledger, and document previewing

## Requirements

- Node.js 18+
- npm

## Setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the development server
   ```bash
   npm run dev
   ```
3. Open the app at `http://localhost:5173`

## Environment

Copy `.env.example` and add your own values if you want to enable Supabase.

```env
VITE_USE_SUPABASE=false
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_USE_REMOTE_API=false
```

## Scripts

- `npm run dev` — start the Vite app and local extraction server
- `npm run build` — create a production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## Deployment

This project is configured for Netlify via `netlify.toml`.

## Notes

- The default data mode is local browser storage.
- Supabase is optional and disabled by default.
- The local extraction server is required for the document processing workflow during development.

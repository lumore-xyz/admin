# Lumore Admin

Lumore Admin is the internal dashboard for managing the Lumore platform.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- ApexCharts
- Google OAuth (`@react-oauth/google`)

## Core Features

- Admin login via Google OAuth code flow
- Dashboard analytics:
  - total, active, inactive, matching, archived users
  - online now
  - male/female/other/unknown distribution
  - verification breakdown
  - age distribution
  - location demographics:
    - global (country-wise)
    - selected country (state-wise)
- User management:
  - searchable user table
  - archive/unarchive actions
  - detailed user properties
- This-or-That moderation:
  - game submissions review (`approve` / `reject`)
- Report moderation:
  - reported users list
  - status transitions (`open` / `reviewing` / `closed`)
- Credits ledger view

## Routes

- `/auth/login`
- `/dashboard`
- `/users`
- `/credits`
- `/moderation/this-or-that`
- `/moderation/reported-users`

## Environment Variables

Create `lumore-admin/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_client_id
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint checks

## Backend Dependencies

This app expects Lumore backend admin APIs (from `lumorebe`) to be available, especially:

- `POST /admin/auth/google-signin-web`
- `GET /admin/stats`
- `GET /admin/users`
- `PATCH /admin/users/:userId/archive`
- `GET /admin/games/this-or-that/pending`
- `PATCH /games/this-or-that/questions/:questionId/status`
- `GET /admin/reported-users`
- `PATCH /admin/reported-users/:reportId/status`
- `GET /admin/credits/ledger`

## Branding

- Logo: `public/lumore-logo.png`
- Theme colors:
  - Primary: `#541388`
  - White: `#fafafa`
  - Black: `#0a0a09`

# Event Management System (React + Vite)

A responsive front-end Event Management System for the project review rubric. It uses React components and browser Local Storage (no backend required).

## Features

### Admin module
- Admin login with role-based access
- Dashboard summary: total events, upcoming events and registrations
- Create, edit and delete events
- Set event title, date, venue, description and capacity
- View participants registered for each event

### User module
- User signup and login
- Browse available events
- Register for an event (capacity and duplicate registration checks)
- View and cancel personal registrations

## Run locally

1. Install Node.js (LTS) from https://nodejs.org/
2. Extract this ZIP and open the project folder in VS Code.
3. Open a terminal in the project folder and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite (usually http://localhost:5173).

## Demo login

- **Admin email:** `admin@evently.com`
- **Admin password:** `admin123`

You can also create a normal user account from the Sign up page.

> Demo note: Local Storage authentication is suitable for an academic front-end demonstration only. It is not secure for a real production application. A real deployment should use a backend, secure password hashing and proper authorization.

## Deploy to Vercel

1. Push the extracted project folder to a GitHub repository.
2. Sign in to https://vercel.com/ and choose **Add New → Project**.
3. Import the GitHub repository.
4. Vercel should detect Vite. Confirm:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Select **Deploy**. The included `vercel.json` supports client-side route fallback.
6. Open the deployment URL and test signup, login, event creation and registration.

## Local Storage keys

- `ems_users` – registered users and the demo admin
- `ems_events` – event records
- `ems_registrations` – event registrations
- `ems_current_user` – current login session

To reset demo data, open browser DevTools → Application → Local Storage, remove keys beginning with `ems_`, and refresh.

## Project structure

```text
event-management-system/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    └── styles.css
```

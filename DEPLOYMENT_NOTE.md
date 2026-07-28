# Campus Connect Deployment Guide

## Recommended hosting setup

- Frontend: Vercel
- Backend: Render
- Database: Railway MySQL

## 1) Prepare the database on Railway

1. Create a new MySQL service on Railway.
2. Copy the connection details:
   - Host
   - Port
   - Database name
   - Username
   - Password
3. Use these values in the backend environment variables.

## 2) Deploy the backend on Render

1. Connect your GitHub repository to Render.
2. Create a new Web Service for the backend folder.
3. Set the following environment variables:

```env
PORT=10000
DB_HOST=your_railway_host
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
JWT_SECRET=your_long_random_secret
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

4. Build command:

```bash
cd backend
npm install
```

5. Start command:

```bash
cd backend
npm start
```

6. Render will expose a public URL such as:

```text
https://your-backend-name.onrender.com
```

## 3) Deploy the frontend on Vercel

1. Connect the frontend folder to Vercel.
2. Set the frontend environment variable:

```env
VITE_API_BASE_URL=https://your-backend-name.onrender.com
```

3. Build command:

```bash
cd web
npm install
npm run build
```

4. Output directory:

```text
dist
```

## 4) Important project structure note

Keep the project split like this:

```text
event-management/
├── backend/   -> Render
└── web/       -> Vercel
```

Do not place the React app inside the backend folder for deployment. The frontend should be deployed separately from the backend.

## 5) API URL usage

The frontend now supports:

- local development via http://localhost:3000
- production via VITE_API_BASE_URL or VITE_API_URL

Example:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
});
```

## 6) Database setup after deployment

If the database is empty, run the schema setup script once from the backend service environment or local machine:

```bash
cd backend
npm run setup-db
```

## 7) Final checklist

- Backend starts successfully on Render
- Health endpoint responds: https://your-backend-name.onrender.com/health
- Frontend loads and calls the backend correctly
- Database connection works from Render

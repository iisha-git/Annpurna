# Annpurna Production Deployment Guide (Vercel)

This guide walks you through deploying the **Annpurna API (Backend)** and the **Annpurna Owner Panel (Frontend)** to **Vercel**, plus publishing the **Student Mobile App**.

---

## 1. Prerequisites
- A free [Vercel account](https://vercel.com).
- Your GitHub repository pushed to GitHub.
- Your [MongoDB Atlas](https://cloud.mongodb.com) connection URI (ensure Network Access in Atlas allows `0.0.0.0/0` so Vercel serverless IPs can connect).

---

## 2. Deploying the Backend API on Vercel

The backend is configured to run as a **Vercel Serverless Function** using `apps/api/vercel.json` and `apps/api/api/index.js`.

### Step-by-Step:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." → "Project"**.
2. Select your GitHub repository (`Annpurna`) and click **"Import"**.
3. Under **Configure Project**:
   - **Project Name**: `annpurna-api`
   - **Framework Preset**: Choose **"Other"** (or leave as default).
   - **Root Directory**: Click **Edit** and choose **`apps/api`** (⚠️ **Crucial step**).
4. Expand **Environment Variables** and add the following:

| Key | Example / Description |
| :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0...mongodb.net/annpurna?retryWrites=true&w=majority` |
| `JWT_SECRET` | A secure random 32+ character string (e.g. `6e743d2c9e301bd8e4ef767157d447...`) |
| `JWT_EXPIRES_IN` | `30d` |
| `OWNER_EMAIL` | `owner@annpurna.host` |
| `OWNER_PASSWORD` | `supersecretowner123` *(must be at least 8 characters)* |
| `OWNER_NAME` | `Mess Owner` |

5. Click **"Deploy"**.
6. Once deployed, copy your assigned Vercel URL (e.g., `https://annpurna-api.vercel.app`).
   - Test it by visiting: `https://annpurna-api.vercel.app/api/health` — it will return:
     ```json
     { "ok": true, "dbState": "connected" }
     ```

---

## 3. Deploying the Owner Panel on Vercel

The Owner Panel is a high-performance React + Vite Single Page Application configured with `apps/owner-panel/vercel.json`.

### Step-by-Step:
1. In your [Vercel Dashboard](https://vercel.com/dashboard), click **"Add New..." → "Project"**.
2. Select the same GitHub repository (`Annpurna`) and click **"Import"**.
3. Under **Configure Project**:
   - **Project Name**: `annpurna-owner`
   - **Framework Preset**: **Vite** (auto-detected).
   - **Root Directory**: Click **Edit** and choose **`apps/owner-panel`** (⚠️ **Crucial step**).
4. Expand **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | Your deployed backend URL + `/api` (e.g., `https://annpurna-api.vercel.app/api`) |

5. Click **"Deploy"**.
6. Open your deployed Owner Panel URL (e.g., `https://annpurna-owner.vercel.app`).
7. Sign in using your `OWNER_EMAIL` and `OWNER_PASSWORD`.

---

## 4. Connecting the Student Mobile App

In `apps/student`:

1. **For Local Testing / Expo Go**:
   - Create `apps/student/.env`:
     ```env
     EXPO_PUBLIC_API_URL=https://annpurna-api.vercel.app/api
     ```
   - Start with: `npx expo start`

2. **Generating a Standalone Android APK (EAS Build)**:
   - Run in `apps/student`:
     ```bash
     npm install -g eas-cli
     eas login
     eas build -p android --profile preview
     ```
   - EAS will build an installable `.apk` file for Android phones with 24/7 background geofencing enabled.

---

## 5. Security & Verification Checklist

- [x] **MongoDB Atlas Access**: Go to MongoDB Atlas → **Network Access** → Add IP Address `0.0.0.0/0` (Allow Access from Anywhere) so Vercel functions can connect from any serverless node.
- [x] **Git Secrets Protection**: Local `.env` files are untracked and excluded in `.gitignore`.
- [x] **Database Connection Pooling**: Mongoose connection caching (`ensureConnected()`) prevents Atlas connection limits from being exceeded.
- [x] **CORS Configuration**: The backend has CORS enabled with `origin: '*'` so the owner panel and mobile app can communicate without browser blocking.
- [x] **Zero Breaking Changes**: Local `node src/index.js` continues to work on port 4000 alongside Vercel serverless.
